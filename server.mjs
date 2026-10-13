import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, resolve, sep } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const publicFiles = new Set(['index.html', 'styles.css', 'app.js', 'project-gallery.js', 'projects.json', 'favicon.svg']);
const assetRoot = resolve(root, 'projects') + sep;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif' };

const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = path === '/' ? 'index.html' : path.slice(1);
    const target = resolve(root, relative);
    const isProjectImage = target.startsWith(assetRoot) && /^\.(svg|png|jpe?g|webp|avif|gif)$/.test(extname(target).toLowerCase());
    if ((!publicFiles.has(relative) && !isProjectImage) || !target.startsWith(root + sep)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': mime[extname(target).toLowerCase()], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local: http://localhost:${port}`);
});
