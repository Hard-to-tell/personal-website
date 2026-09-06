const fs = require("node:fs");
const { createStore } = require("../lib/store.cjs");
(async () => {
  const output = process.argv[2];
  if (!output) throw new Error("Missing output");
  const store = createStore();
  try {
    const tree = await store.getTree();
    if (!tree) throw new Error("Not initialized");
    fs.writeFileSync(output, JSON.stringify(tree, null, 2) + "\n", { flag: "wx" });
    console.log("书签备份已保存。");
  } finally { await store.close(); }
})().catch(() => { console.error("备份失败。请指定一个尚不存在的输出文件，并检查数据库配置。"); process.exitCode = 1; });
