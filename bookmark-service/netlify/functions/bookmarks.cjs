const { createHandler, readConfig } = require("../../lib/api.cjs");
const { createStore } = require("../../lib/store.cjs");
const initialNodes = require("../../data/initial-tree.json");
let handler;
exports.handler = async (event) => {
  try {
    handler ||= createHandler({ store: createStore(), config: readConfig(), initialNodes });
    return await handler(event);
  } catch {
    return { statusCode: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify({ error: "书签服务尚未配置。" }) };
  }
};
