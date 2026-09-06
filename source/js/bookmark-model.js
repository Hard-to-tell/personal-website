/* Shared validation for the browser, API and one-time legacy migration. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NemoBookmarks = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const MAX_NODES = 5000;
  function requireText(value, label, max) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
      throw new Error(`${label}不能为空，且不能超过 ${max} 个字符。`);
    }
    return value.trim();
  }
  function normalizeUrl(value) {
    let text = requireText(value, "网址", 4096);
    if (/\s|[\\\u0000-\u001f]/u.test(text)) throw new Error("请填写有效的网址。");
    if (!/^[a-z][a-z\d+.-]*:/i.test(text)) text = `https://${text}`;
    let url;
    try { url = new URL(text); } catch { throw new Error("请填写有效的网址。"); }
    if (!["https:", "http:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
      throw new Error("只支持不含账号密码的 HTTP 或 HTTPS 网址。");
    }
    return url.href;
  }
  function validateTree(input) {
    if (!Array.isArray(input) || input.length > MAX_NODES) throw new Error("书签目录格式不正确或数量超过上限。");
    const ids = new Map();
    const nodes = input.map((entry) => {
      if (!entry || !["folder", "bookmark"].includes(entry.type)) throw new Error("无效的书签类型。");
      const id = requireText(entry.id, "编号", 80);
      if (!/^[a-z\d_-]+$/i.test(id) || ids.has(id)) throw new Error("书签编号无效或重复。");
      if (entry.parentId !== null && typeof entry.parentId !== "string") throw new Error("请选择书签夹。");
      const node = { id, type: entry.type, parentId: entry.parentId, title: requireText(entry.title, "名称", 100) };
      if (node.type === "bookmark") {
        node.url = normalizeUrl(entry.url);
        node.note = typeof entry.note === "string" ? entry.note.trim() : "";
        if (node.note.length > 120) throw new Error("说明不能超过 120 个字符。");
      }
      ids.set(id, node);
      return node;
    });
    for (const node of nodes) {
      const seen = new Set([node.id]);
      let parentId = node.parentId;
      while (parentId !== null) {
        const parent = ids.get(parentId);
        if (!parent || parent.type !== "folder") throw new Error("目标书签夹不存在。");
        if (seen.has(parentId)) throw new Error("不能将书签夹移入自身或它的子文件夹。");
        seen.add(parentId);
        if (seen.size > 33) throw new Error("书签夹最多支持 32 层。");
        parentId = parent.parentId;
      }
    }
    return nodes;
  }
  function applyOperation(input, operation) {
    const nodes = validateTree(input);
    if (!operation || typeof operation !== "object") throw new Error("缺少修改内容。");
    if (operation.type === "create") {
      nodes.push(operation.node);
    } else {
      const index = nodes.findIndex((node) => node.id === operation.id);
      if (index < 0) throw new Error("这条书签或书签夹已不存在，请刷新。");
      if (operation.type === "delete") {
        if (nodes.some((node) => node.parentId === operation.id)) throw new Error("请先移走或删除夹内内容，再删除空书签夹。");
        nodes.splice(index, 1);
      } else if (operation.type === "update") {
        const changes = operation.changes;
        if (!changes || Object.keys(changes).some((key) => !["title", "parentId", "url", "note"].includes(key))) {
          throw new Error("修改内容无效。");
        }
        nodes[index] = { ...nodes[index], ...changes };
      } else throw new Error("不支持此操作。");
    }
    return validateTree(nodes);
  }
  function fromLegacy(entries) {
    const nodes = [];
    const groups = new Map();
    for (const [index, entry] of entries.entries()) {
      if (!groups.has(entry.category)) {
        const id = `legacy-folder-${groups.size + 1}`;
        groups.set(entry.category, id);
        nodes.push({ id, type: "folder", parentId: null, title: entry.category });
      }
      nodes.push({ id: `legacy-bookmark-${index + 1}`, type: "bookmark", parentId: groups.get(entry.category), title: entry.title, url: entry.url, note: entry.note || "" });
    }
    return validateTree(nodes);
  }
  return { normalizeUrl, validateTree, applyOperation, fromLegacy };
});
