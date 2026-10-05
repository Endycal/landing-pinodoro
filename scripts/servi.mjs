// Server locale per guardare _sito/ nel browser: node scripts/servi.mjs [porta]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const CARTELLA = fileURLToPath(new URL("../_sito", import.meta.url));
const TIPI = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8" };
const porta = Number(process.argv[2]) || 8080;

createServer(async (richiesta, risposta) => {
  const percorso = decodeURIComponent(new URL(richiesta.url, "http://localhost").pathname);
  const file = join(CARTELLA, normalize(percorso.endsWith("/") ? percorso + "index.html" : percorso));
  try {
    const contenuto = await readFile(file);
    risposta.writeHead(200, { "Content-Type": TIPI[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    risposta.end(contenuto);
  } catch {
    risposta.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    risposta.end("Non trovato");
  }
}).listen(porta, () => console.log(`http://localhost:${porta}/  (cartella _sito; Ctrl+C per fermare)`));
