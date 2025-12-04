/**
 * Serveur de développement léger pour Game 2.5D
 * Usage: node server.js [--app=game|backoffice|stage-maker] [--port=3000]
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

const PORT = parseInt(getArg('port', '3000'));
const APP = getArg('app', 'game');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

// Routes des applications
const APP_ROUTES = {
  'game': '/src/game',
  'backoffice': '/src/backoffice',
  'stage-maker': '/src/stage-maker'
};

// Résolution des chemins
const resolvePath = (url) => {
  // Racine -> index.html de l'app
  if (url === '/') {
    return join(__dirname, APP_ROUTES[APP], 'index.html');
  }

  // Chemins /shared -> src/shared
  if (url.startsWith('/shared/')) {
    return join(__dirname, 'src', url);
  }

  // Chemins /assets -> assets
  if (url.startsWith('/assets/')) {
    return join(__dirname, url);
  }

  // Chemins /data -> data
  if (url.startsWith('/data/')) {
    return join(__dirname, url);
  }

  // Autres chemins -> relatifs à l'app courante
  return join(__dirname, APP_ROUTES[APP], url);
};

// Serveur
const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // CORS headers pour dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const filePath = resolvePath(url);
    const ext = extname(filePath) || '.html';

    // Vérifier si le fichier existe
    try {
      await stat(filePath);
    } catch {
      // Fichier non trouvé - essayer avec .html
      const htmlPath = filePath + '.html';
      try {
        await stat(htmlPath);
        const content = await readFile(htmlPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return;
      } catch {
        // 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${url}`);
        console.log(`[404] ${url}`);
        return;
      }
    }

    // Lire et servir le fichier
    const content = await readFile(filePath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
    console.log(`[200] ${url}`);

  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`500 Internal Server Error: ${err.message}`);
    console.error(`[500] ${url}`, err);
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Game 2.5D Dev Server                      ║
╠══════════════════════════════════════════════════════════════╣
║  App:  ${APP.padEnd(54)}║
║  URL:  http://localhost:${PORT}${' '.repeat(37 - PORT.toString().length)}║
╠══════════════════════════════════════════════════════════════╣
║  Commandes:                                                  ║
║    npm run dev        → Game (défaut)                        ║
║    npm run dev:bo     → BackOffice                           ║
║    npm run dev:stage  → Stage Maker                          ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close();
  process.exit(0);
});
