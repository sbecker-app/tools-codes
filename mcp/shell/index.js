#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 2 * 1024 * 1024;
const REPO_ROOT = process.cwd();

const server = new McpServer({
  name: 'shell-mcp',
  version: '0.1.0',
});

server.registerTool(
  'shell-run',
  {
    title: 'Execute shell command',
    description: 'Run a shell command inside the repository workspace.',
    inputSchema: {
      command: z
        .string()
        .min(1, 'A shell command is required.')
        .describe('Command to execute (passed to the configured shell).'),
      cwd: z
        .string()
        .optional()
        .describe('Working directory relative to the repository root.'),
      timeout: z
        .number()
        .int()
        .positive()
        .max(600_000)
        .optional()
        .describe('Timeout in milliseconds. Defaults to 120000.'),
      shell: z
        .string()
        .optional()
        .describe('Shell executable to use. Defaults to $SHELL or /bin/sh.'),
    },
  },
  async (args) => {
    let workingDirectory;
    try {
      workingDirectory = resolveWorkingDirectory(args.cwd);
    } catch (error) {
      return errorResponse((error && error.message) || String(error));
    }

    const timeoutMs = args.timeout ?? DEFAULT_TIMEOUT_MS;
    const shellBinary = resolveShellBinary(args.shell);
    const shellArgs = buildShellArgs(shellBinary, args.command);

    const result = await runShellCommand(shellBinary, shellArgs, {
      cwd: workingDirectory,
      timeout: timeoutMs,
    });

    const summary = formatSummary(result, workingDirectory);
    return {
      content: [
        {
          type: 'text',
          text: summary,
        },
      ],
      isError: !result.ok,
    };
  }
);

const transport = new StdioServerTransport();

server
  .connect(transport)
  .then(() => {
    console.error('[shell-mcp] Server ready');
  })
  .catch((error) => {
    console.error('[shell-mcp] Failed to start server:', error);
    process.exit(1);
  });

function resolveWorkingDirectory(cwd) {
  if (!cwd) {
    return REPO_ROOT;
  }

  const resolved = path.resolve(REPO_ROOT, cwd);
  if (!resolved.startsWith(REPO_ROOT + path.sep) && resolved !== REPO_ROOT) {
    throw new Error('Requested cwd resolves outside the repository root.');
  }

  return resolved;
}

function resolveShellBinary(provided) {
  if (provided) {
    return provided;
  }
  if (process.platform === 'win32') {
    return 'cmd.exe';
  }
  return process.env.SHELL || '/bin/sh';
}

function buildShellArgs(shellBinary, command) {
  if (process.platform === 'win32' && shellBinary.toLowerCase().includes('cmd')) {
    return ['/d', '/s', '/c', command];
  }
  return ['-lc', command];
}

function runShellCommand(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stdout = createBufferAccumulator();
    const stderr = createBufferAccumulator();

    let timeout;
    let timedOut = false;
    if (options.timeout) {
      timeout = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 2_000);
      }, options.timeout);
    }

    child.stdout.on('data', (chunk) => {
      stdout.append(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr.append(chunk);
    });

    child.on('error', (error) => {
      if (timeout) clearTimeout(timeout);
      resolve({
        ok: false,
        exitCode: null,
        signal: null,
        timedOut: timedOut,
        stdout: stdout.value,
        stderr: stderr.value,
        error,
      });
    });

    child.on('close', (code, signal) => {
      if (timeout) clearTimeout(timeout);
      resolve({
        ok: !timedOut && code === 0,
        exitCode: code,
        signal,
        timedOut,
        stdout: stdout.value,
        stderr: stderr.value,
        error: timedOut
          ? new Error(`Command exceeded timeout of ${options.timeout}ms and was terminated.`)
          : undefined,
      });
    });
  });
}

function createBufferAccumulator() {
  let value = '';
  let truncated = false;

  return {
    append(chunk) {
      if (truncated) {
        return;
      }

      value += chunk.toString();
      if (value.length > MAX_OUTPUT_CHARS) {
        value = `${value.slice(0, MAX_OUTPUT_CHARS)}\n[output truncated]`;
        truncated = true;
      }
    },
    get value() {
      return value;
    },
  };
}

function formatSummary(result, cwd) {
  const header = [
    `cwd: ${cwd}`,
    `exitCode: ${result.exitCode ?? 'n/a'}`,
    `signal: ${result.signal ?? 'none'}`,
    result.timedOut ? 'timedOut: true' : undefined,
  ]
    .filter(Boolean)
    .join('\n');

  const stdoutBlock = formatBlock('stdout', result.stdout);
  const stderrBlock = formatBlock('stderr', result.stderr);

  if (!result.ok) {
    const reason = result.error ? `\nerror: ${(result.error && result.error.message) || result.error}` : '';
    return `${header}${reason}\n${stdoutBlock}\n${stderrBlock}`.trim();
  }

  return `${header}\n${stdoutBlock}\n${stderrBlock}`.trim();
}

function formatBlock(label, content) {
  const body = content ? content : '(empty)';
  return `--- ${label} ---\n${body}`;
}

function errorResponse(message) {
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
}
