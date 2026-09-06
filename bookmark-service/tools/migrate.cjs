const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("yaml");
const { fromLegacy } = require("../../source/js/bookmark-model.js");
const { createStore } = require("../lib/store.cjs");

(async () => {
  const entries = parse(fs.readFileSync(path.join(__dirname, "../../source/_data/friends.yml"), "utf8"));
  const nodes = fromLegacy(entries);
  console.log(`迁移检查通过：${entries.length} 个书签，${nodes.length - entries.length} 个书签夹。`);
  if (!process.argv.includes("--apply")) { console.log("当前为只读检查。配置环境后使用 --apply 才会写入。现有目录不会被覆盖。"); return; }
  const store = createStore();
  try { console.log(await store.initialize(nodes) ? "初始化成功。" : "目录已经存在，未覆盖任何数据。"); }
  finally { await store.close(); }
})().catch(() => { console.error("迁移失败，请检查源数据和私密环境配置。未输出连接凭据。"); process.exitCode = 1; });
