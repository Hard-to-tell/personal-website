(() => {
  const categoryIcons = {
    "工具与资料": "⌘",
    "超分辨率": "SR",
    "计算机视觉": "CV",
    "模型与架构": "◇",
    "图像增强": "◐",
    "Transformer 学习": "TF",
  };

  const entries = () =>
    (Array.isArray(window.__NEMO_FRIEND_LINKS__) ? window.__NEMO_FRIEND_LINKS__ : [])
      .filter((entry) => entry && entry.category && entry.title && entry.url)
      .map((entry) => ({
        category: String(entry.category),
        title: String(entry.title),
        url: String(entry.url),
        note: entry.note ? String(entry.note) : "",
      }));

  function getHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function createLink(entry) {
    const link = document.createElement("a");
    link.className = "nemo-friend-link";
    link.href = entry.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const title = document.createElement("strong");
    title.textContent = entry.title;
    const meta = document.createElement("span");
    meta.textContent = entry.note || getHost(entry.url);
    const arrow = document.createElement("span");
    arrow.className = "nemo-friend-link-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    link.append(title, meta, arrow);
    return link;
  }

  function createGroup(category, links, index) {
    const details = document.createElement("details");
    details.className = "nemo-friend-group";
    details.open = index === 0;

    const summary = document.createElement("summary");
    const icon = document.createElement("span");
    icon.className = "nemo-friend-group-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = categoryIcons[category] || "·";
    const heading = document.createElement("span");
    heading.className = "nemo-friend-group-heading";
    const name = document.createElement("strong");
    name.textContent = category;
    const count = document.createElement("small");
    count.textContent = `${links.length} 个入口`;
    heading.append(name, count);
    const toggle = document.createElement("span");
    toggle.className = "nemo-friend-group-toggle";
    toggle.setAttribute("aria-hidden", "true");
    toggle.textContent = "+";
    summary.append(icon, heading, toggle);

    const grid = document.createElement("div");
    grid.className = "nemo-friend-grid";
    links.forEach((entry) => grid.append(createLink(entry)));
    details.append(summary, grid);
    return details;
  }

  function findRoot() {
    const existing = document.querySelector("[data-nemo-friend-links]");
    if (existing) return existing;

    const heading = [...document.querySelectorAll("#main h2")].find((element) =>
      element.textContent.includes("书签收藏")
    );
    if (!heading) return null;

    const root = document.createElement("div");
    root.className = "nemo-friend-directory";
    root.dataset.nemoFriendLinks = "";
    root.setAttribute("aria-label", "分类书签收藏");
    const placeholder = heading.nextElementSibling;
    if (placeholder?.textContent.trim() === "正在整理收藏入口……") {
      placeholder.replaceWith(root);
    } else {
      heading.insertAdjacentElement("afterend", root);
    }
    return root;
  }

  function mount() {
    const root = findRoot();
    if (!root) return;
    const allEntries = entries();
    root.replaceChildren();

    if (!allEntries.length) {
      const empty = document.createElement("p");
      empty.className = "nemo-friend-empty";
      empty.textContent = "收藏入口还在整理中。";
      root.append(empty);
      return;
    }

    const groups = new Map();
    allEntries.forEach((entry) => {
      if (!groups.has(entry.category)) groups.set(entry.category, []);
      groups.get(entry.category).push(entry);
    });

    const overview = document.createElement("p");
    overview.className = "nemo-friend-overview";
    overview.textContent = `${allEntries.length} 个站点 · ${groups.size} 个主题；点击分类展开`;
    root.append(overview);
    [...groups.entries()].forEach(([category, links], index) => {
      root.append(createGroup(category, links, index));
    });
  }

  document.addEventListener("DOMContentLoaded", mount);
  window.addEventListener("pjax:complete", mount);
  if (document.readyState !== "loading") mount();
})();
