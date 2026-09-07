const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("yaml");
const { validateTree, normalizeUrl, applyOperation, fromLegacy } = require("../../source/js/bookmark-model.js");
const { fixture, seed, config } = require("./helpers.cjs");
const { OAUTH_COOKIE, SESSION_COOKIE, readConfig } = require("../lib/api.cjs");

test("legacy migration preserves every bookmark, note, category and source order", () => {
  const entries = parse(fs.readFileSync(path.join(__dirname, "../../source/_data/friends.yml"), "utf8"));
  const nodes = fromLegacy(entries);
  const links = nodes.filter((node) => node.type === "bookmark");
  assert.equal(links.length, entries.length);
  assert.deepEqual(links.map(({ title, url, note, parentId }) => ({ title, url, note, category: nodes.find((n) => n.id === parentId).title })), entries.map((entry) => ({ ...entry, url: normalizeUrl(entry.url), note: entry.note || "" })));
  assert.deepEqual(fromLegacy(entries), nodes);
});
test("URL validation accepts missing protocol and rejects scripts, credentials and whitespace", () => {
  assert.equal(normalizeUrl("example.com/path"), "https://example.com/path");
  assert.equal(normalizeUrl("http://example.com"), "http://example.com/");
  for (const value of ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "https://user:pass@example.com", "https://a b.com", "https://", "https:\\example.com", ""]) assert.throws(() => normalizeUrl(value));
});
test("tree rejects duplicate IDs, missing parents, non-folder parents and cycles", () => {
  assert.throws(() => validateTree([...seed, seed[0]]));
  assert.throws(() => applyOperation(seed, { type: "update", id: "folder", changes: { parentId: "child" } }), /不能/);
  assert.throws(() => applyOperation(seed, { type: "update", id: "folder", changes: { parentId: "folder" } }), /不能/);
  assert.throws(() => applyOperation(seed, { type: "update", id: "link", changes: { parentId: "missing" } }));
  assert.throws(() => applyOperation(seed, { type: "update", id: "child", changes: { parentId: "link" } }));
});
test("create, rename, move and deletion preserve unrelated records and enforce empty folders", () => {
  let nodes = applyOperation(seed, { type: "create", node: { id: "new", type: "folder", parentId: "child", title: "新建" } });
  assert.equal(nodes.length, 4);
  assert.throws(() => applyOperation(nodes, { type: "delete", id: "folder" }), /移走/);
  nodes = applyOperation(nodes, { type: "update", id: "link", changes: { parentId: null, title: "已移动" } });
  assert.equal(nodes.find((n) => n.id === "link").note, "保留说明");
  nodes = applyOperation(nodes, { type: "delete", id: "new" });
  nodes = applyOperation(nodes, { type: "delete", id: "child" });
  assert.equal(nodes.length, 2);
  assert.equal(seed[2].title, "示例");
  assert.throws(() => applyOperation(seed, { type: "update", id: "link", changes: { type: "folder" } }));
});
test("visitors can read but cannot write, even by calling API directly", async () => {
  const { handler, event } = await fixture();
  assert.equal((await handler(event("GET", "/bookmarks", undefined, { headers: {} }))).statusCode, 200);
  assert.equal((await handler(event("PUT", "/bookmarks", { version: 1, operation: { type: "delete", id: "link" } }, { headers: {} }))).statusCode, 401);
});
test("writes require exact origin, valid session and CSRF token", async () => {
  const { handler, event, store } = await fixture();
  for (const patch of [{ origin: "https://evil.example" }, { origin: "https://other.exileland.online" }, { origin: undefined }, { "x-bookmark-csrf": "wrong" }]) {
    const e = event("PUT", "/bookmarks", { version: 1, operation: { type: "delete", id: "link" } });
    Object.assign(e.headers, patch);
    assert.equal((await handler(e)).statusCode, 403);
  }
  await store.putAuth("session", "admin-session", { userId: "999", csrf: "csrf-token", expiresAt: new Date(Date.now() + 60000) });
  assert.equal((await handler(event("PUT", "/bookmarks", {}))).statusCode, 401);
});
test("two simultaneous writes cannot overwrite each other; stale retries return conflict", async () => {
  const { handler, event, store } = await fixture();
  const payload = { version: 1, operation: { type: "update", id: "link", changes: { title: "新名称" } } };
  const responses = await Promise.all([handler(event("PUT", "/bookmarks", payload)), handler(event("PUT", "/bookmarks", payload))]);
  assert.deepEqual(responses.map((r) => r.statusCode).sort(), [200, 409]);
  assert.equal((await store.getTree()).version, 2);
  assert.equal((await handler(event("PUT", "/bookmarks", payload))).statusCode, 409);
});
test("API rejects malformed data, dangerous URLs and deleting nonempty folders", async () => {
  const { handler, event } = await fixture();
  for (const operation of [{ type: "delete", id: "folder" }, { type: "update", id: "link", changes: { url: "javascript:alert(1)" } }]) {
    assert.equal((await handler(event("PUT", "/bookmarks", { version: 1, operation }))).statusCode, 400);
  }
  assert.equal((await handler(event("PUT", "/bookmarks", null))).statusCode, 400);
  assert.equal((await handler(event("PUT", "/bookmarks", {}, { body: "{" }))).statusCode, 400);
  assert.equal((await handler(event("PUT", "/bookmarks", {}, { body: "x".repeat(17000) }))).statusCode, 413);
});
test("session expiry and logout invalidate server-side authorization", async () => {
  const { handler, event, store } = await fixture();
  assert.equal(JSON.parse((await handler(event("GET", "/session"))).body).admin, true);
  assert.equal((await handler(event("POST", "/auth/logout"))).statusCode, 200);
  assert.equal(JSON.parse((await handler(event("GET", "/session"))).body).admin, false);
  await store.putAuth("session", "admin-session", { userId: "123", csrf: "csrf-token", expiresAt: new Date(Date.now() - 1) });
  assert.equal((await handler(event("PUT", "/bookmarks", {}))).statusCode, 401);
});
test("unavailable database reports an error without leaking credentials; uninitialized tree stays unmodified", async () => {
  const { handler, event, store } = await fixture();
  store.clearTree();
  assert.equal((await handler(event("GET", "/bookmarks"))).statusCode, 503);
  store.getTree = async () => { throw new Error("mongodb://SECRET"); };
  const response = await handler(event("GET", "/bookmarks"));
  assert.equal(response.statusCode, 503);
  assert.ok(!response.body.includes("SECRET"));
});
test("an empty database initializes once from the bundled public bookmark tree", async () => {
  const { handler, event, store } = await fixture({ initialNodes: seed });
  store.clearTree();
  const first = await handler(event("GET", "/bookmarks", undefined, { headers: {} }));
  assert.equal(first.statusCode, 200);
  assert.deepEqual(JSON.parse(first.body), { version: 1, nodes: seed });
  const second = await handler(event("GET", "/bookmarks", undefined, { headers: {} }));
  assert.deepEqual(JSON.parse(second.body), { version: 1, nodes: seed });
});
test("OAuth uses state and PKCE, accepts only configured numeric user ID, sets secure cookie and prevents replay", async () => {
  const calls = [];
  const { handler, event } = await fixture({ fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => url.includes("access_token") ? { access_token: "temporary-test-token" } : { id: 123, login: "owner" } };
  } });
  const login = await handler(event("GET", "/auth/login"));
  const target = new URL(login.headers.Location);
  assert.equal(target.searchParams.get("scope"), "");
  assert.equal(target.searchParams.get("code_challenge_method"), "S256");
  assert.equal(target.searchParams.get("redirect_uri"), `${config.apiOrigin}/auth/callback`);
  const state = target.searchParams.get("state");
  const callback = event("GET", "/auth/callback", undefined, { headers: { cookie: `${OAUTH_COOKIE}=${state}` }, queryStringParameters: { code: "temporary-code", state } });
  const result = await handler(callback);
  assert.equal(result.headers.Location, `${config.siteOrigin}/friend/`);
  const sessionCookie = result.multiValueHeaders["Set-Cookie"].find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  assert.match(sessionCookie, /HttpOnly; Secure; SameSite=Lax/);
  const tokenBody = JSON.parse(calls[0].options.body);
  assert.ok(tokenBody.code_verifier);
  assert.ok(!result.body.includes("temporary-test-token"));
  assert.match((await handler(callback)).headers.Location, /failed/);
  assert.equal(calls.length, 2);
});
test("OAuth rejects mismatched state, expired flow and wrong account", async () => {
  const { handler, event, store } = await fixture({ fetchImpl: async (url) => ({ ok: true, json: async () => url.includes("access_token") ? { access_token: "t" } : { id: 999 } }) });
  await store.putAuth("oauth", "state", { verifier: "v", expiresAt: new Date(Date.now() + 60000) });
  const callback = (state, cookieState) => event("GET", "/auth/callback", undefined, { headers: { cookie: `${OAUTH_COOKIE}=${cookieState}` }, queryStringParameters: { code: "code", state } });
  assert.match((await handler(callback("state", "wrong"))).headers.Location, /failed/);
  assert.match((await handler(callback("state", "state"))).headers.Location, /failed/);
  await store.putAuth("oauth", "expired", { verifier: "v", expiresAt: new Date(Date.now() - 1) });
  assert.match((await handler(callback("expired", "expired"))).headers.Location, /failed/);
});
test("production requires HTTPS API subdomain and immutable administrator ID", () => {
  const env = { BOOKMARK_SITE_ORIGIN: config.siteOrigin, BOOKMARK_API_ORIGIN: config.apiOrigin, GITHUB_CLIENT_ID: "c", GITHUB_CLIENT_SECRET: "s", GITHUB_ADMIN_ID: "123" };
  assert.equal(readConfig(env).adminId, "123");
  assert.throws(() => readConfig({ ...env, BOOKMARK_API_ORIGIN: "https://demo.netlify.app" }));
  assert.throws(() => readConfig({ ...env, GITHUB_ADMIN_ID: "owner" }));
});
