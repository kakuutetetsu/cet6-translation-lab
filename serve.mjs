import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'text/plain; charset=utf-8', 'Cache-Control':'no-store'}).end(content);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? '端口 4173 已被占用，请关闭已有预览服务后重试。' : error.message);
  process.exitCode = 1;
});
server.listen(4173, '127.0.0.1', () => console.log('CET-6 Translation Lab — http://127.0.0.1:4173\n按 Ctrl+C 停止本地预览。'));
