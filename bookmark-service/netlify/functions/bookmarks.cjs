const { createHandler, readConfig } = require("../../lib/api.cjs");
const { createStore } = require("../../lib/store.cjs");
let handler;
exports.handler = async (event) => {
  try {
    handler ||= createHandler({ store: createStore(), config: readConfig() });
    return await handler(event);
  } catch {
    return { statusCode: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify({ error: "书签服务尚未配置。" }) };
  }
};
