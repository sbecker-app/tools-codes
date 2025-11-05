#!/usr/bin/env node

/**
 * MCP server that proxies the Foncia Gateway GraphQL API.
 *
 * The server exposes:
 *   - A `gateway.graphql.query` tool for executing GraphQL operations
 *   - A `gateway-graphql-schema` resource template exposing schema files from the gateway build
 *
 * Required environment variables:
 *   GATEWAY_GRAPHQL_URL         - Base URL of the GraphQL endpoint (e.g. http://localhost:4040/graphql)
 *   GATEWAY_GRAPHQL_AUTH_TOKEN  - Static bearer token used for Authorization header (optional when OAuth is configured)
 *   GATEWAY_GRAPHQL_SCHEMA_PATH - Absolute path to the compiled schema directory
 *
 * Optional OAuth configuration (takes precedence over the static token when provided):
 *   GATEWAY_OAUTH_TOKEN_URL             - OAuth token endpoint URL
 *   GATEWAY_OAUTH_CLIENT_ID             - OAuth client identifier
 *   GATEWAY_OAUTH_CLIENT_SECRET         - Client secret (optional, falls back to public client)
 *   GATEWAY_OAUTH_CLIENT_SECRET_IN_BODY - When "true", send the client secret in the request body instead of Basic auth
 *   GATEWAY_OAUTH_SCOPE                 - Requested scope string (space separated)
 *   GATEWAY_OAUTH_GRANT_TYPE            - OAuth grant type (default: client_credentials)
 *   GATEWAY_OAUTH_USERNAME              - Username for password grant
 *   GATEWAY_OAUTH_PASSWORD              - Password for password grant
 *   GATEWAY_OAUTH_EXTRA_PARAMS          - JSON object with additional form parameters (e.g. {"audience":"...","redirect_uri":"..."})
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

loadEnvFromFile();

const server = new McpServer({
  name: 'gateway-graphql-mcp',
  version: '0.1.0',
});

const graphqlUrl = requireEnv('GATEWAY_GRAPHQL_URL');
const staticAuthToken = optionalEnv('GATEWAY_GRAPHQL_AUTH_TOKEN');
const schemaRoot = optionalEnv('GATEWAY_GRAPHQL_SCHEMA_PATH');
const normalizedSchemaRoot = schemaRoot ? path.resolve(schemaRoot) : undefined;
const oauthConfig = loadOauthConfig();

if (!staticAuthToken && !oauthConfig) {
  console.error(
    '[gateway-graphql-mcp] Provide either GATEWAY_GRAPHQL_AUTH_TOKEN or OAuth environment variables to obtain an access token.'
  );
  process.exit(1);
}

const tokenManager = createTokenManager({
  staticToken: staticAuthToken,
  oauthConfig,
});

tokenManager
  .ensureToken()
  .then(() => {
    console.error(
      `[gateway-graphql-mcp] Authentication ready (${tokenManager.description}).`
    );
  })
  .catch((error) => {
    console.error(
      `[gateway-graphql-mcp] Failed to obtain initial access token: ${(error && error.message) || String(error)}`
    );
    process.exit(1);
  });

server.registerTool(
  'gateway-graphql-query',
  {
    title: 'Gateway GraphQL Query',
    description: 'Execute a GraphQL operation against the Foncia gateway API.',
    inputSchema: {
      query: z
        .string()
        .min(1, 'A GraphQL query or mutation is required')
        .describe('GraphQL document to execute.'),
      variables: z
        .union([z.string().min(1), z.record(z.any())])
        .optional()
        .describe('Optional variables as a JSON string or object.'),
      operationName: z
        .string()
        .min(1)
        .optional()
        .describe('Name of the operation to execute when the document defines multiple operations.'),
      headers: z
        .record(z.string())
        .optional()
        .describe('Additional HTTP headers to merge with the default request headers.'),
    },
  },
  async (args) => {
    let parsedVariables;
    if (typeof args.variables === 'string') {
      try {
        parsedVariables = JSON.parse(args.variables);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid JSON in variables: ${(error && error.message) || String(error)}`,
            },
          ],
          isError: true,
        };
      }
    } else {
      parsedVariables = args.variables;
    }

    const token = await tokenManager.getToken();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...args.headers,
    };

    try {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: args.query,
          variables: parsedVariables,
          operationName: args.operationName,
        }),
      });

      const responseText = await response.text();
      let parsedBody;
      try {
        parsedBody = responseText ? JSON.parse(responseText) : undefined;
      } catch {
        parsedBody = undefined;
      }

      const payload = parsedBody ?? responseText ?? '';
      const prettyPayload =
        typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);

      const isGraphQLError =
        typeof parsedBody === 'object' &&
        parsedBody !== null &&
        Array.isArray(parsedBody.errors) &&
        parsedBody.errors.length > 0;

      return {
        content: [
          {
            type: 'text',
            text: `POST ${graphqlUrl}\nStatus: ${response.status} ${response.statusText}`,
          },
          {
            type: 'text',
            text: prettyPayload,
          },
        ],
        isError: !response.ok || isGraphQLError,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `GraphQL request failed: ${(error && error.message) || String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

if (normalizedSchemaRoot) {
  registerSchemaResourceTemplate(server, normalizedSchemaRoot);
} else {
  console.warn(
    '[gateway-graphql-mcp] GATEWAY_GRAPHQL_SCHEMA_PATH not set; schema resources will be unavailable.'
  );
}

const transport = new StdioServerTransport();

server
  .connect(transport)
  .then(() => {
    console.error('[gateway-graphql-mcp] Server ready');
  })
  .catch((error) => {
    console.error('[gateway-graphql-mcp] Failed to start server:', error);
    process.exit(1);
  });

function requireEnv(name) {
  const value = optionalEnv(name);
  if (!value) {
    console.error(`[gateway-graphql-mcp] Missing required environment variable ${name}.`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : undefined;
}

function loadEnvFromFile() {
  const candidates = [];
  const explicitPath = process.env.GATEWAY_MCP_ENV_FILE;
  if (explicitPath) {
    candidates.push({ path: explicitPath, required: true });
  }
  candidates.push({ path: path.resolve(process.cwd(), '.env'), required: false });
  const repoEnvPath = path.resolve(__dirname, '../../.env');
  if (!candidates.some((candidate) => candidate.path === repoEnvPath)) {
    candidates.push({ path: repoEnvPath, required: false });
  }

  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate.path)) {
      continue;
    }
    seen.add(candidate.path);
    if (loadEnvCandidate(candidate.path, candidate.required)) {
      break;
    }
  }
}

function loadEnvCandidate(filePath, required) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return false;
    }
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      if (required) {
        console.error(
          `[gateway-graphql-mcp] Env file ${filePath} not found but was requested via GATEWAY_MCP_ENV_FILE.`
        );
      }
      return false;
    }
    console.error(
      `[gateway-graphql-mcp] Unable to access env file ${filePath}: ${(error && error.message) || String(
        error
      )}`
    );
    return false;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const match = trimmed.match(/^(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/);
      if (!match) {
        continue;
      }

      const key = match[1];
      let value = match[2] ?? '';
      value = value.trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (value.includes('\\n')) {
        value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    return true;
  } catch (error) {
    console.error(
      `[gateway-graphql-mcp] Failed to read env file ${filePath}: ${(error && error.message) || String(
        error
      )}`
    );
    return false;
  }
}

function loadOauthConfig() {
  const tokenUrl = optionalEnv('GATEWAY_OAUTH_TOKEN_URL');
  if (!tokenUrl) {
    return undefined;
  }

  const grantType = optionalEnv('GATEWAY_OAUTH_GRANT_TYPE') || 'client_credentials';
  const clientId = optionalEnv('GATEWAY_OAUTH_CLIENT_ID');
  if (!clientId) {
    console.error(
      '[gateway-graphql-mcp] OAuth is configured but GATEWAY_OAUTH_CLIENT_ID is missing.'
    );
    process.exit(1);
  }

  const clientSecret = optionalEnv('GATEWAY_OAUTH_CLIENT_SECRET');
  const clientSecretInBody = parseBoolean(optionalEnv('GATEWAY_OAUTH_CLIENT_SECRET_IN_BODY'));
  const scope = optionalEnv('GATEWAY_OAUTH_SCOPE');
  const username = optionalEnv('GATEWAY_OAUTH_USERNAME');
  const password = optionalEnv('GATEWAY_OAUTH_PASSWORD');
  const extraParams = parseExtraParams(optionalEnv('GATEWAY_OAUTH_EXTRA_PARAMS'));

  if (grantType === 'password' && (!username || !password)) {
    console.error(
      '[gateway-graphql-mcp] GATEWAY_OAUTH_USERNAME and GATEWAY_OAUTH_PASSWORD are required for password grant.'
    );
    process.exit(1);
  }

  return {
    tokenUrl,
    grantType,
    clientId,
    clientSecret,
    clientSecretInBody,
    scope,
    username,
    password,
    extraParams,
  };
}

function createTokenManager({ staticToken, oauthConfig }) {
  if (staticToken) {
    return {
      description: 'static token (GATEWAY_GRAPHQL_AUTH_TOKEN)',
      ensureToken: async () => staticToken,
      getToken: async () => staticToken,
    };
  }

  if (!oauthConfig) {
    throw new Error('Token manager requires either a static token or OAuth configuration.');
  }

  let cachedToken;
  let expiresAtMs = 0;
  let inflightPromise;

  async function ensureFreshToken() {
    const now = Date.now();
    if (cachedToken && now < expiresAtMs) {
      return cachedToken;
    }

    if (inflightPromise) {
      return inflightPromise;
    }

    inflightPromise = requestAccessToken(oauthConfig)
      .then(({ token, expiresIn }) => {
        cachedToken = token;
        const ttlSeconds = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 300;
        const refreshWindowSeconds = Math.min(30, Math.max(5, Math.floor(ttlSeconds / 5)));
        expiresAtMs = Date.now() + Math.max(ttlSeconds - refreshWindowSeconds, 5) * 1000;
        return cachedToken;
      })
      .finally(() => {
        inflightPromise = undefined;
      });

    return inflightPromise;
  }

  return {
    description: `OAuth ${oauthConfig.grantType} grant`,
    ensureToken: ensureFreshToken,
    getToken: ensureFreshToken,
  };
}

async function requestAccessToken(config) {
  const params = new URLSearchParams();
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (config.extraParams) {
    for (const [key, value] of Object.entries(config.extraParams)) {
      if (value === undefined || value === null) {
        continue;
      }
      params.set(key, String(value));
    }
  }

  params.set('grant_type', config.grantType);

  if (!config.clientSecretInBody) {
    params.set('client_id', config.clientId);
  }

  if (config.scope) {
    params.set('scope', config.scope);
  }

  if (config.grantType === 'password') {
    params.set('username', config.username);
    params.set('password', config.password);
  }

  if (config.clientSecret) {
    if (config.clientSecretInBody) {
      params.set('client_id', config.clientId);
      params.set('client_secret', config.clientSecret);
    } else {
      headers.Authorization = `Basic ${Buffer.from(
        `${config.clientId}:${config.clientSecret}`,
        'utf8'
      ).toString('base64')}`;
    }
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: params,
  });

  const responseText = await response.text();
  let parsedBody;

  if (responseText) {
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = undefined;
    }
  }

  if (!response.ok) {
    const errorDetails =
      (parsedBody && (parsedBody.error_description || parsedBody.error)) || responseText || '';
    throw new Error(
      `Token endpoint responded with ${response.status} ${response.statusText}: ${errorDetails}`
    );
  }

  if (!parsedBody || typeof parsedBody !== 'object' || typeof parsedBody.access_token !== 'string') {
    throw new Error('Token endpoint response missing access_token.');
  }

  const expiresInValue = parsedBody.expires_in;
  let expiresIn = Number(expiresInValue);
  if (!Number.isFinite(expiresIn)) {
    expiresIn = undefined;
  }

  return {
    token: parsedBody.access_token,
    expiresIn,
  };
}

function parseBoolean(rawValue) {
  if (rawValue === undefined) {
    return false;
  }
  const normalized = rawValue.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function parseExtraParams(rawValue) {
  if (!rawValue) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('JSON must describe an object.');
    }
    return parsed;
  } catch (error) {
    console.error(
      `[gateway-graphql-mcp] Invalid JSON in GATEWAY_OAUTH_EXTRA_PARAMS: ${(error && error.message) || String(
        error
      )}`
    );
    process.exit(1);
  }
}

function registerSchemaResourceTemplate(mcpServer, schemaDirectory) {
  const template = new ResourceTemplate('gateway-schema://{+path}', {
    list: async () => {
      const resources = [];
      try {
        const files = await collectSchemaFiles(schemaDirectory);
        for (const relativePath of files) {
          resources.push({
            uri: `gateway-schema://${relativePath}`,
            name: relativePath,
            description: 'GraphQL schema file generated by the gateway build',
            mimeType: detectMimeType(relativePath),
          });
        }
      } catch (error) {
        console.warn(
          `[gateway-graphql-mcp] Unable to enumerate schema directory: ${
            (error && error.message) || String(error)
          }`
        );
      }
      return { resources };
    },
    complete: {
      async path(value) {
        try {
          const files = await collectSchemaFiles(schemaDirectory);
          return files.filter((file) => file.startsWith(value));
        } catch {
          return [];
        }
      },
    },
  });

  mcpServer.registerResource(
    'gateway-graphql-schema',
    template,
    {
      title: 'Gateway GraphQL Schema Files',
      description: `Schema artifacts from ${schemaDirectory}`,
      mimeType: 'application/graphql',
    },
    async (uri, variables) => {
      try {
        const relativePath = variables.path;
        if (!relativePath) {
          throw new Error('No path provided in resource URI.');
        }
        const absolutePath = secureJoin(schemaDirectory, relativePath);
        const contents = await fsp.readFile(absolutePath, 'utf8');
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: detectMimeType(relativePath),
              text: contents,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'text/plain',
              text: `Failed to read schema file: ${(error && error.message) || String(error)}`,
            },
          ],
        };
      }
    }
  );
}

async function collectSchemaFiles(rootDirectory) {
  const entries = await fsp.readdir(rootDirectory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDirectory, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectSchemaFiles(entryPath);
      for (const nestedPath of nested) {
        results.push(path.posix.join(entry.name, nestedPath));
      }
    } else if (entry.isFile() && isGraphqlSchema(entry.name)) {
      results.push(entry.name);
    }
  }

  return results.sort();
}

function isGraphqlSchema(filename) {
  return /\.(graphql|gql|json)$/i.test(filename);
}

function detectMimeType(filename) {
  if (/\.json$/i.test(filename)) {
    return 'application/json';
  }
  return 'application/graphql';
}

function secureJoin(rootDirectory, relativePath) {
  const resolvedPath = path.resolve(rootDirectory, relativePath);
  const normalizedRoot = path.resolve(rootDirectory);

  if (!resolvedPath.startsWith(normalizedRoot + path.sep) && resolvedPath !== normalizedRoot) {
    throw new Error('Resolved path escapes the configured schema directory.');
  }

  return resolvedPath;
}
