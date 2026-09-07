const crypto = require("node:crypto");
const { applyOperation } = require("../../source/js/bookmark-model.js");
const SESSION_COOKIE = "__Host-nemo_bookmarks";
const OAUTH_COOKIE = "__Host-nemo_bookmarks_oauth";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const random = () => crypto.randomBytes(32).toString("base64url");
const cookie = (name, value, seconds) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;

function readConfig(env = process.env) {
  const required = ["BOOKMARK_SITE_ORIGIN", "BOOKMARK_API_ORIGIN", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_ADMIN_ID"];
  if (required.some((key) => !env[key])) throw new Error("Missing bookmark configuration");
  const site = new URL(env.BOOKMARK_SITE_ORIGIN);
  const api = new URL(env.BOOKMARK_API_ORIGIN);
  if (site.protocol !== "https:" || api.protocol !== "https:" || !api.hostname.endsWith(`.${site.hostname}`)) {
    throw new Error("The API must use an HTTPS subdomain of the site");
  }
  if (!/^\d+$/.test(env.GITHUB_ADMIN_ID)) throw new Error("Invalid administrator ID");
  return { siteOrigin: site.origin, apiOrigin: api.origin, clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET, adminId: env.GITHUB_ADMIN_ID };
}

function createHandler({ store, config, fetchImpl = fetch, initialNodes = null }) {
  return async function handler(event) {
    const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
    const cookies = Object.fromEntries((headers.cookie || "").split(";").map((part) => part.trim().split("=")).filter((parts) => parts.length === 2));
    const origin = headers.origin;
    const baseHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", Vary: "Origin" };
    if (origin === config.siteOrigin) {
      baseHeaders["Access-Control-Allow-Origin"] = origin;
      baseHeaders["Access-Control-Allow-Credentials"] = "true";
    }
    const reply = (statusCode, data, extra = {}) => ({ statusCode, headers: { ...baseHeaders, ...extra }, body: data === null ? "" : JSON.stringify(data) });
    const redirect = (url, setCookies = []) => ({ ...reply(302, null, { Location: url }), multiValueHeaders: { "Set-Cookie": setCookies } });
    const error = (status, message, code) => reply(status, { error: message, code });
    const route = event.path.replace(/^\/\.netlify\/functions\/bookmarks/, "").replace(/^\/api/, "") || "/";
    const method = event.httpMethod;
    // Keep the OAuth callback outside /api: some browser privacy extensions block
    // top-level navigations to API-looking paths even though normal fetches work.
    const callback = `${config.apiOrigin}/auth/callback`;
    try {
      if (origin && origin !== config.siteOrigin) return error(403, "不允许此来源访问。");
      if (method === "OPTIONS") {
        if (origin !== config.siteOrigin) return error(403, "不允许此来源访问。");
        return reply(204, null, { "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Bookmark-CSRF" });
      }
      if (route === "/auth/login" && method === "GET") {
        const state = random();
        const verifier = random();
        await store.putAuth("oauth", state, { verifier, expiresAt: new Date(Date.now() + 600000) });
        const url = new URL("https://github.com/login/oauth/authorize");
        url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: callback, scope: "", state, code_challenge: crypto.createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256", allow_signup: "false" }).toString();
        return redirect(url.href, [cookie(OAUTH_COOKIE, state, 600)]);
      }
      if (route === "/auth/callback" && method === "GET") {
        const params = event.queryStringParameters || {};
        const failed = () => redirect(`${config.siteOrigin}/friend/?bookmark_login=failed`, [cookie(OAUTH_COOKIE, "", 0)]);
        if (!params.state || params.state !== cookies[OAUTH_COOKIE] || !params.code || params.error) return failed();
        const flow = await store.getAuth("oauth", params.state, true);
        if (!flow) return failed();
        const tokenResponse = await fetchImpl("https://github.com/login/oauth/access_token", {
          method: "POST", signal: AbortSignal.timeout(10000), headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code: params.code, redirect_uri: callback, code_verifier: flow.verifier }),
        });
        if (!tokenResponse.ok) return failed();
        const token = await tokenResponse.json();
        if (!token.access_token || token.error) return failed();
        const userResponse = await fetchImpl("https://api.github.com/user", { signal: AbortSignal.timeout(10000), headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token.access_token}`, "User-Agent": "Nemo-Bookmarks" } });
        if (!userResponse.ok) return failed();
        const user = await userResponse.json();
        if (String(user.id) !== config.adminId) return failed();
        const session = random();
        if (cookies[SESSION_COOKIE]) await store.deleteAuth("session", cookies[SESSION_COOKIE]);
        await store.putAuth("session", session, { userId: String(user.id), csrf: random(), expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000) });
        return redirect(`${config.siteOrigin}/friend/`, [cookie(OAUTH_COOKIE, "", 0), cookie(SESSION_COOKIE, session, SESSION_SECONDS)]);
      }
      if (route === "/bookmarks" && method === "GET") {
        let tree = await store.getTree();
        if (!tree && initialNodes) {
          await store.initialize(initialNodes);
          tree = await store.getTree();
        }
        return tree ? reply(200, tree) : error(503, "在线书签尚未初始化。", "UNINITIALIZED");
      }
      const session = await store.getAuth("session", cookies[SESSION_COOKIE]);
      const admin = session && session.userId === config.adminId;
      if (route === "/session" && method === "GET") return reply(200, admin ? { admin: true, csrf: session.csrf } : { admin: false });
      if (!admin) return error(401, "请先用站长 GitHub 账号登录。", "UNAUTHORIZED");
      if (origin !== config.siteOrigin || !headers["x-bookmark-csrf"] || headers["x-bookmark-csrf"] !== session.csrf) return error(403, "登录验证失效，请刷新页面。", "CSRF");
      if (route === "/auth/logout" && method === "POST") {
        await store.deleteAuth("session", cookies[SESSION_COOKIE]);
        return { ...reply(200, { ok: true }), multiValueHeaders: { "Set-Cookie": [cookie(SESSION_COOKIE, "", 0)] } };
      }
      if (route === "/bookmarks" && method === "PUT") {
        if (!(headers["content-type"] || "").startsWith("application/json")) return error(415, "请使用 JSON 提交。");
        if (event.isBase64Encoded || !event.body || Buffer.byteLength(event.body) > 16384) return error(413, "提交内容过大或无效。");
        let payload;
        try { payload = JSON.parse(event.body); } catch { return error(400, "提交内容格式错误。"); }
        if (!payload || !Number.isSafeInteger(payload.version) || payload.version < 1) return error(400, "缺少有效的数据版本。");
        const tree = await store.getTree();
        if (!tree) return error(503, "在线书签尚未初始化。", "UNINITIALIZED");
        if (payload.version !== tree.version) return error(409, "另一页面已修改了收藏。请刷新目录后重新保存。", "CONFLICT");
        let nodes;
        try { nodes = applyOperation(tree.nodes, payload.operation); } catch (e) { return error(400, e.message); }
        if (!await store.saveTree(tree.version, nodes)) return error(409, "另一页面已修改了收藏。请刷新目录后重新保存。", "CONFLICT");
        return reply(200, { version: tree.version + 1, nodes });
      }
      return error(404, "接口不存在。");
    } catch {
      // Never include provider errors, connection strings or OAuth tokens in responses/logs.
      if (route === "/auth/callback") return redirect(`${config.siteOrigin}/friend/?bookmark_login=failed`, [cookie(OAUTH_COOKIE, "", 0)]);
      return error(503, "书签服务暂时无法连接，请稍后重试。", "UNAVAILABLE");
    }
  };
}
module.exports = { createHandler, readConfig, SESSION_COOKIE, OAUTH_COOKIE };
