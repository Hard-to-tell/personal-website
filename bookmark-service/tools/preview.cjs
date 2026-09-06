// Local acceptance harness only: fake GitHub login and an in-memory store, never deployed.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("yaml");
const { fromLegacy } = require("../../source/js/bookmark-model.js");
const { createHandler, SESSION_COOKIE } = require("../lib/api.cjs");
const { memoryStore } = require("../test/helpers.cjs");
const root = path.resolve(__dirname, "../../public");
const port = Number(process.env.BOOKMARK_PREVIEW_PORT || 4173);
const origin = `http://127.0.0.1:${port}`;
const entries = parse(fs.readFileSync(path.resolve(__dirname, "../../source/_data/friends.yml"), "utf8"));
const store = memoryStore(fromLegacy(entries));
const config = { siteOrigin: origin, apiOrigin: origin, adminId: "123" };
const handler = createHandler({ store, config });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2" };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin);
    if (url.pathname === "/api/auth/login") {
      await store.putAuth("session", "preview-admin", { userId: "123", csrf: "preview-csrf", expiresAt: new Date(Date.now() + 3600000) });
      res.writeHead(302, { Location: "/friend/", "Set-Cookie": "nemo_preview_session=preview-admin; Path=/; HttpOnly; SameSite=Lax" }); res.end(); return;
    }
    if (url.pathname.startsWith("/api/")) {
      let body = "";
      for await (const chunk of req) { body += chunk; if (body.length > 20000) { res.writeHead(413); res.end(); return; } }
      const headers = { ...req.headers };
      if ((headers.cookie || "").includes("nemo_preview_session=preview-admin")) headers.cookie = `${SESSION_COOKIE}=preview-admin`;
      const result = await handler({ path: url.pathname, httpMethod: req.method, headers, body });
      const responseHeaders = { ...result.headers };
      if (url.pathname === "/api/auth/logout") responseHeaders["Set-Cookie"] = "nemo_preview_session=; Path=/; Max-Age=0";
      res.writeHead(result.statusCode, responseHeaders); res.end(result.body); return;
    }
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    let file = path.resolve(root, relative || "index.html");
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    let data = fs.readFileSync(file);
    if (file.endsWith("nemo-friend-links-data.js")) data = Buffer.from(data.toString() + `\nwindow.__NEMO_BOOKMARK_CONFIG__={apiOrigin:${JSON.stringify(origin)}};`);
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" }); res.end(data);
  } catch { res.writeHead(500); res.end("Preview error"); }
}).listen(port, "127.0.0.1", () => console.log(`本地测试预览（模拟登录，数据仅保存在内存）：${origin}/friend/`));
