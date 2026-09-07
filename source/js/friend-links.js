(() => {
  "use strict";
  const currentUrl = new URL(window.location.href);
  const oauthParams = ["code", "state", "iss"];
  if (oauthParams.some((name) => currentUrl.searchParams.has(name))) {
    oauthParams.forEach((name) => currentUrl.searchParams.delete(name));
    history.replaceState(history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
  }
  const model = window.NemoBookmarks;
  if (!model) return;
  window.__NEMO_BOOKMARK_DISPOSE__?.();
  let active;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (text, action, className = "") => {
    const node = element("button", className, text);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  };
  function findRoot() {
    const existing = document.querySelector("[data-nemo-friend-links]");
    if (existing) return existing;
    const heading = [...document.querySelectorAll("#main h2")].find((node) => node.textContent.includes("书签收藏"));
    if (!heading) return null;
    const root = element("div", "nemo-friend-directory");
    root.dataset.nemoFriendLinks = "";
    root.setAttribute("aria-label", "书签收藏");
    const placeholder = heading.nextElementSibling;
    if (placeholder?.textContent.trim() === "正在整理收藏入口……") placeholder.replaceWith(root);
    else heading.insertAdjacentElement("afterend", root);
    return root;
  }
  function mount() {
    const root = findRoot();
    if (!root || active?.root === root) return;
    active?.dispose();
    const lifecycle = new AbortController();
    const api = String(window.__NEMO_BOOKMARK_CONFIG__?.apiOrigin || "").replace(/\/$/, "");
    let nodes;
    try { nodes = model.fromLegacy(window.__NEMO_FRIEND_LINKS__ || []); }
    catch { nodes = []; }
    let current = null;
    let version = null;
    let session = { admin: false };
    let online = false;
    let loading = false;
    let saving = false;
    const expanded = new Set();
    let dialog;
    const toolbar = element("div", "nemo-bookmark-toolbar");
    const status = element("p", "nemo-bookmark-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const layout = element("div", "nemo-bookmark-layout");
    const sidebar = element("details", "nemo-bookmark-sidebar");
    sidebar.open = !window.matchMedia("(max-width: 767px)").matches;
    const tree = element("nav", "nemo-bookmark-tree");
    tree.setAttribute("aria-label", "书签夹");
    sidebar.append(element("summary", "", "书签夹"), tree);
    const content = element("div", "nemo-bookmark-content");
    layout.append(sidebar, content);
    root.replaceChildren(toolbar, status, layout);
    active = { root, dispose() { lifecycle.abort(); dialog?.remove(); } };
    const notice = (text) => { status.textContent = text; };
    const editable = () => session.admin && online && !loading && !saving;
    async function request(path, options = {}) {
      let response;
      try {
        response = await fetch(`${api}/api${path}`, {
          ...options, credentials: "include", signal: AbortSignal.any([lifecycle.signal, AbortSignal.timeout(12000)]),
          headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(session.csrf ? { "X-Bookmark-CSRF": session.csrf } : {}), ...options.headers },
        });
      } catch { throw new Error("连接中断或超时，保存结果尚未确认。请刷新目录核对后重试。"); }
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.error || "操作失败，请稍后重试。");
        error.code = data.code;
        throw error;
      }
      return data;
    }
    function acceptTree(data) {
      if (!Number.isSafeInteger(data.version) || data.version < 1) throw new Error("目录版本无效。");
      const next = model.validateTree(data.nodes);
      nodes = next;
      version = data.version;
      online = true;
      if (current && !nodes.some((node) => node.id === current)) current = null;
    }
    async function refresh() {
      if (!api || loading || saving) return;
      loading = true;
      render();
      notice("正在加载收藏……");
      const results = await Promise.allSettled([request("/bookmarks"), request("/session")]);
      if (lifecycle.signal.aborted) return;
      session = results[1].status === "fulfilled" ? results[1].value : { admin: false };
      try {
        if (results[0].status === "rejected") throw results[0].reason;
        acceptTree(results[0].value);
        notice(results[1].status === "rejected" ? "收藏已加载，登录状态暂时无法获取。可重试刷新。" : "");
      } catch {
        online = false;
        notice(version ? "连接暂时中断，正在显示上次加载的收藏。请刷新后再编辑。" : "在线收藏暂时不可用，正在显示旧版收藏副本。请稍后刷新。");
      }
      loading = false;
      render();
    }
    function navigate(id) {
      current = id;
      let parent = nodes.find((node) => node.id === id);
      while (parent) { expanded.add(parent.id); parent = nodes.find((node) => node.id === parent.parentId); }
      render();
    }
    function folderPath(id) {
      const path = [];
      let node = nodes.find((item) => item.id === id);
      while (node) { path.unshift(node.title); node = nodes.find((item) => item.id === node.parentId); }
      return path.join(" / ") || "全部收藏";
    }
    function folderTree(parentId) {
      const group = element("div", "nemo-bookmark-branches");
      for (const folder of nodes.filter((node) => node.type === "folder" && node.parentId === parentId)) {
        const row = element("div", "nemo-bookmark-tree-row");
        const children = nodes.some((node) => node.type === "folder" && node.parentId === folder.id);
        if (children) {
          const toggle = button(expanded.has(folder.id) ? "−" : "+", () => { expanded.has(folder.id) ? expanded.delete(folder.id) : expanded.add(folder.id); render(); }, "nemo-bookmark-toggle");
          toggle.setAttribute("aria-label", `${expanded.has(folder.id) ? "收起" : "展开"}${folder.title}`);
          toggle.setAttribute("aria-expanded", String(expanded.has(folder.id)));
          row.append(toggle);
        }
        const open = button(folder.title, () => navigate(folder.id), "nemo-bookmark-folder-name");
        if (current === folder.id) open.setAttribute("aria-current", "page");
        row.append(open);
        group.append(row);
        if (children && expanded.has(folder.id)) group.append(folderTree(folder.id));
      }
      return group;
    }
    function render() {
      toolbar.replaceChildren();
      const count = nodes.filter((node) => node.type === "bookmark").length;
      toolbar.append(element("span", "nemo-bookmark-count", `${count} 个书签 · ${nodes.length - count} 个书签夹`));
      const actions = element("div", "nemo-bookmark-actions");
      if (api) {
        const reload = button(loading ? "加载中…" : "刷新", refresh);
        reload.disabled = loading || saving;
        actions.append(reload);
      }
      if (session.admin) {
        const add = button("＋ 添加书签", () => editNode("bookmark"));
        const folder = button("新建书签夹", () => editNode("folder"));
        add.disabled = folder.disabled = !editable();
        const logout = button("退出管理", async () => {
          if (saving) return;
          try { await request("/auth/logout", { method: "POST" }); session = { admin: false }; dialog?.close(); render(); notice("已退出管理。"); }
          catch { notice("退出失败，请重试。"); }
        });
        logout.disabled = saving || loading;
        actions.append(add, folder, logout);
      } else {
        actions.append(button("管理", () => {
          if (!api) { notice("在线管理尚未启用，当前可以浏览已有收藏。"); return; }
          window.location.assign(`${api}/api/auth/login`);
        }));
      }
      toolbar.append(actions);
      const all = button("全部收藏", () => navigate(null));
      if (current === null) all.setAttribute("aria-current", "page");
      tree.replaceChildren(all, folderTree(null));
      content.replaceChildren();
      const heading = element("div", "nemo-bookmark-heading");
      heading.append(element("strong", "", folderPath(current)));
      if (current && session.admin) heading.append(menu(nodes.find((node) => node.id === current)));
      content.append(heading);
      const list = element("ul", "nemo-bookmark-list");
      const children = nodes.filter((node) => node.parentId === current);
      for (const node of children) {
        const row = element("li", "nemo-bookmark-row");
        if (node.type === "folder") row.append(button(`▱ ${node.title}`, () => navigate(node.id), "nemo-bookmark-item"));
        else {
          const link = element("a", "nemo-bookmark-item");
          link.href = node.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.append(element("strong", "", node.title), element("small", "", node.note || new URL(node.url).hostname));
          row.append(link);
        }
        if (session.admin) row.append(menu(node));
        list.append(row);
      }
      content.append(list);
      if (!children.length) content.append(element("p", "nemo-friend-empty", session.admin ? "这里还是空的，可以添加书签或新建书签夹。" : "这个书签夹还是空的。"));
    }
    function menu(node) {
      const details = element("details", "nemo-bookmark-menu");
      const summary = element("summary", "", "···");
      summary.setAttribute("aria-label", `管理${node.title}`);
      const options = element("div", "nemo-bookmark-menu-options");
      const edit = button(node.type === "folder" ? "改名" : "编辑", () => { details.open = false; editNode(node.type, node); });
      const move = button("移动到…", () => { details.open = false; editNode(node.type, node, true); });
      const remove = button("删除", () => { details.open = false; deleteNode(node); });
      edit.disabled = move.disabled = remove.disabled = !editable();
      options.append(edit, move, remove);
      details.append(summary, options);
      return details;
    }
    function openDialog(title) {
      dialog?.remove();
      const opener = document.activeElement;
      dialog = element("dialog", "nemo-bookmark-dialog");
      const modal = dialog;
      dialog.setAttribute("aria-labelledby", "nemo-bookmark-dialog-title");
      const heading = element("h3", "", title);
      heading.id = "nemo-bookmark-dialog-title";
      const form = element("form");
      const error = element("p", "nemo-bookmark-form-error");
      error.setAttribute("role", "alert");
      const buttons = element("div", "nemo-bookmark-actions");
      const cancel = button("取消", () => modal.close());
      const submit = element("button", "nemo-bookmark-primary", "保存");
      submit.type = "submit";
      buttons.append(cancel, submit);
      form.append(heading);
      dialog.append(form);
      root.append(dialog);
      dialog.addEventListener("cancel", (event) => { if (saving) event.preventDefault(); });
      dialog.addEventListener("close", () => { modal.remove(); if (dialog !== modal) return; if (opener?.isConnected) opener.focus(); else toolbar.querySelector("button")?.focus(); });
      return { form, error, buttons, submit, cancel, show() { form.append(error, buttons); modal.showModal(); } };
    }
    function field(form, label, control) {
      const wrapper = element("label", "nemo-bookmark-field");
      wrapper.append(element("span", "", label), control);
      form.append(wrapper);
      return control;
    }
    function editNode(type, existing, moveOnly = false) {
      if (!editable()) return;
      const ui = openDialog(moveOnly ? "移动到书签夹" : existing ? (type === "folder" ? "书签夹改名" : "编辑书签") : (type === "folder" ? "新建书签夹" : "添加书签"));
      let url;
      let title;
      if (!moveOnly) {
        if (type === "bookmark") {
          url = field(ui.form, "网址", element("input"));
          url.type = "text";
          url.inputMode = "url";
          url.required = true;
          url.maxLength = 4096;
          url.placeholder = "粘贴网址，例如 https://example.com";
          url.value = existing?.url || "";
        }
        title = field(ui.form, "名称", element("input"));
        title.required = type === "folder";
        title.maxLength = 100;
        title.value = existing?.title || "";
        title.placeholder = type === "bookmark" ? "可修改；留空使用网站域名" : "例如：论文";
        if (url) {
          let autoTitle = "";
          url.addEventListener("input", () => {
            try {
              if (!title.value.trim() || title.value === autoTitle) {
                autoTitle = new URL(model.normalizeUrl(url.value)).hostname.slice(0, 100);
                title.value = autoTitle;
              }
            } catch { /* Validate when submitting, not while pasting. */ }
          });
        }
      }
      const parent = field(ui.form, "保存到", element("select"));
      const rootOption = element("option", "", "全部收藏（最外层）");
      rootOption.value = "";
      parent.append(rootOption);
      for (const folder of nodes.filter((node) => node.type === "folder")) {
        if (existing?.type === "folder") {
          let ancestor = folder;
          let forbidden = false;
          while (ancestor) {
            if (ancestor.id === existing.id) { forbidden = true; break; }
            ancestor = nodes.find((node) => node.id === ancestor.parentId);
          }
          if (forbidden) continue;
        }
        const option = element("option", "", folderPath(folder.id));
        option.value = folder.id;
        parent.append(option);
      }
      parent.value = (existing ? existing.parentId : current) || "";
      const id = existing?.id || crypto.randomUUID();
      ui.form.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          const changes = { parentId: parent.value || null };
          if (!moveOnly) {
            if (url) changes.url = model.normalizeUrl(url.value);
            changes.title = title.value.trim() || (changes.url ? new URL(changes.url).hostname.slice(0, 100) : "");
          }
          const operation = existing ? { type: "update", id, changes } : { type: "create", node: { id, type, ...changes } };
          await save(operation, ui);
        } catch (e) { ui.error.textContent = e.message; }
      });
      ui.show();
    }
    function deleteNode(node) {
      if (!editable()) return;
      if (nodes.some((item) => item.parentId === node.id)) { notice("请先移走或删除夹内内容，再删除空书签夹。"); return; }
      const ui = openDialog(node.type === "folder" ? "删除空书签夹" : "删除书签");
      ui.form.append(element("p", "", `确定删除“${node.title}”吗？`));
      ui.submit.textContent = "确认删除";
      ui.form.addEventListener("submit", (event) => { event.preventDefault(); save({ type: "delete", id: node.id }, ui); });
      ui.show();
      ui.cancel.focus();
    }
    async function save(operation, ui) {
      if (saving) return;
      ui.error.replaceChildren();
      if (!editable()) { ui.error.textContent = "请刷新目录并确认登录后再保存。"; return; }
      try { model.applyOperation(nodes, operation); }
      catch (error) { ui.error.textContent = error.message; return; }
      saving = true;
      const controls = [...ui.form.querySelectorAll("input, select, button")];
      controls.forEach((control) => { control.disabled = true; });
      const text = ui.submit.textContent;
      ui.submit.textContent = "保存中…";
      render();
      try {
        const result = await request("/bookmarks", { method: "PUT", body: JSON.stringify({ version, operation }) });
        if (lifecycle.signal.aborted) return;
        acceptTree(result);
        dialog.close();
        notice("已保存。");
      } catch (error) {
        if (lifecycle.signal.aborted) return;
        if (error.code === "UNAUTHORIZED") session = { admin: false };
        ui.error.append(element("span", "", error.message || "保存未确认，请刷新目录核对后重试。"));
        if (error.code === "CONFLICT" || !error.code) {
          ui.error.append(button("刷新目录，保留输入", async () => {
            await refresh();
            if (online) ui.error.textContent = "目录已刷新，输入已保留。请核对后再次保存。";
          }));
        }
      } finally {
        saving = false;
        controls.forEach((control) => { control.disabled = false; });
        ui.submit.textContent = text;
        if (!lifecycle.signal.aborted) render();
      }
    }
    render();
    if (api) refresh();
    const params = new URLSearchParams(location.search);
    if (params.get("bookmark_login") === "failed") {
      params.delete("bookmark_login");
      history.replaceState(history.state, "", `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`);
      toolbar.insertAdjacentElement("beforebegin", element("p", "nemo-bookmark-form-error", "登录未完成，请使用站长 GitHub 账号重试。"));
    }
  }
  document.addEventListener("DOMContentLoaded", mount);
  const unmount = () => { active?.dispose(); active = null; };
  window.addEventListener("pjax:send", unmount);
  window.addEventListener("pjax:complete", mount);
  window.__NEMO_BOOKMARK_DISPOSE__ = () => {
    unmount();
    document.removeEventListener("DOMContentLoaded", mount);
    window.removeEventListener("pjax:send", unmount);
    window.removeEventListener("pjax:complete", mount);
  };
  if (document.readyState !== "loading") mount();
})();
