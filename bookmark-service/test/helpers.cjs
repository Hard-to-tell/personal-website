const { createHandler, SESSION_COOKIE } = require("../lib/api.cjs");
const config = { siteOrigin: "https://exileland.online", apiOrigin: "https://bookmarks-api.exileland.online", clientId: "test-client", clientSecret: "test-secret", adminId: "123" };
const seed = [
  { id: "folder", type: "folder", parentId: null, title: "科研" },
  { id: "child", type: "folder", parentId: "folder", title: "论文" },
  { id: "link", type: "bookmark", parentId: "child", title: "示例", url: "https://example.com/", note: "保留说明" },
];
function memoryStore(initial = seed) {
  let tree = { version: 1, nodes: structuredClone(initial) };
  const auth = new Map();
  return {
    async getTree() { return structuredClone(tree); },
    async saveTree(version, nodes) { if (tree.version !== version) return false; tree = { version: version + 1, nodes: structuredClone(nodes) }; return true; },
    async initialize(nodes) { if (tree) return false; tree = { version: 1, nodes: structuredClone(nodes) }; return true; },
    async putAuth(kind, token, data) { auth.set(`${kind}:${token}`, data); },
    async getAuth(kind, token, consume = false) { const key = `${kind}:${token}`; const data = auth.get(key); if (consume) auth.delete(key); return data?.expiresAt > new Date() ? data : null; },
    async deleteAuth(kind, token) { auth.delete(`${kind}:${token}`); },
    clearTree() { tree = null; },
  };
}
async function fixture(options = {}) {
  const store = memoryStore();
  await store.putAuth("session", "admin-session", { userId: "123", csrf: "csrf-token", expiresAt: new Date(Date.now() + 600000) });
  const handler = createHandler({ store, config, ...options });
  const event = (method, path, payload, overrides = {}) => ({ httpMethod: method, path: `/api${path}`, headers: { origin: config.siteOrigin, cookie: `${SESSION_COOKIE}=admin-session`, "content-type": "application/json", "x-bookmark-csrf": "csrf-token" }, body: payload === undefined ? undefined : JSON.stringify(payload), ...overrides });
  return { store, handler, event };
}
module.exports = { config, seed, memoryStore, fixture };
