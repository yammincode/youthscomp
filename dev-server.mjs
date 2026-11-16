// 本機測試用伺服器（netlify dev 無法使用時的替代方案）：node dev-server.mjs
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { BlobsServer } from "@netlify/blobs/server";

const root = path.dirname(new URL(import.meta.url).pathname);
const dir = path.join(root, ".netlify", "local-blobs");
await mkdir(dir, { recursive: true });
const token = "local";
const blobs = new BlobsServer({ directory: dir, token, port: 8971 });
const { port: bport } = await blobs.start();
process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify({ apiURL: `http://localhost:${bport}`, siteID: "local", token })).toString("base64");
process.env.ADMIN_PASSWORD ??= "test123";

const fns = {};
for (const n of (await import("node:fs")).readdirSync(path.join(root, "netlify/functions")).map((f) => f.replace(/\.mjs$/, ""))) {
  const m = await import(`./netlify/functions/${n}.mjs`);
  fns[m.config.path] = m.default;
}
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (fns[url.pathname]) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await fns[url.pathname](new Request(url, { method: req.method, headers: req.headers, body: req.method === "GET" ? undefined : Buffer.concat(chunks) }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  const p = path.join(root, "public", url.pathname === "/" ? "index.html" : url.pathname);
  try { res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end("not found"); }
}).listen(8888, () => console.log("http://localhost:8888  (admin password: " + process.env.ADMIN_PASSWORD + ")"));
