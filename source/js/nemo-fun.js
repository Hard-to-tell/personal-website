(function () {
  const isHome =
    document.documentElement.classList.contains("nemo-home") ||
    location.pathname.replace(/index\.html$/, "") === "/";
  const lines = [
    "今日宜把网页打开，等风从缓存里经过。",
    "你被允许拖延十分钟，但要记得回来。",
    "一枚星屑落在归档页，暂时没有造成错误。",
    "系统没有审判你，只递来一杯冷掉的月光。",
    "书记员请假了。今天的结论由你自己填写。",
    "随机结果：适合阅读、发呆、整理一个小念头。",
    "城堡还在远处，但今天可以先吃点东西。",
    "甲虫没有出现。请正常起床，正常刷新页面。",
    "白鲸从标签云旁边游过，什么也没有带走。",
    "堂吉诃德建议你先检查风车是不是 CSS 动画。",
    "爱丽丝掉进兔子洞之前，先保存了草稿。",
    "包法利夫人把浪漫放进购物车，又悄悄移除了。",
    "奥德修斯正在回家，预计还要若干个分页。",
    "浮士德说：这次先不要签同意书。",
    "简·爱把窗口打开，风把旧缓存吹走了。",
    "哈姆雷特还在犹豫，但按钮可以先点。",
    "百年孤独提示：同一个名字不要起太多次。",
    "局外人看了看太阳，决定关闭自动播放。",
    "追忆似水年华加载中，饼干不一定是 cookie。",
    "小王子说：请先照顾好你的那一朵花。",
    "月亮与六便士都在，今天先捡起六便士。",
    "尤利西斯迷路了，但导航栏还算清楚。",
    "罗生门下雨，服务器没有。",
    "海边的卡夫卡路过，但这里只留下轻一点的风。",
    "一只看不见的猫把你的犹豫推下了桌子。",
    "今日判决：无罪，但需要多喝水。"
  ];

  function createGuide() {
    const guide = document.createElement("section");
    guide.className = "nemo-home-guide";
    guide.setAttribute("aria-labelledby", "nemo-home-guide-title");
    guide.innerHTML = `
      <div class="nemo-home-guide-copy">
        <h2 id="nemo-home-guide-title">这里收纳正在形成的东西。</h2>
        <p>文章放长一点的想法，记录留住没必要写成文章的瞬间。你不必从头读起，选一条顺眼的路就好。</p>
      </div>
      <nav class="nemo-home-guide-links" aria-label="浏览本站">
        <a class="is-reading" href="/archives/">
          <span class="nemo-home-guide-symbol" aria-hidden="true">文</span>
          <span class="nemo-home-guide-detail"><strong>读文章</strong><small>长文、随笔与建站记录</small></span>
          <span class="nemo-home-guide-arrow" aria-hidden="true">↗</span>
        </a>
        <a class="is-records" href="/about/">
          <span class="nemo-home-guide-symbol" aria-hidden="true">片</span>
          <span class="nemo-home-guide-detail"><strong>看记录</strong><small>照片和当时留下的一句话</small></span>
          <span class="nemo-home-guide-arrow" aria-hidden="true">↗</span>
        </a>
        <a class="is-message" href="/message/">
          <span class="nemo-home-guide-symbol" aria-hidden="true">言</span>
          <span class="nemo-home-guide-detail"><strong>留句话</strong><small>无需注册，也可以只打招呼</small></span>
          <span class="nemo-home-guide-arrow" aria-hidden="true">↗</span>
        </a>
      </nav>
    `;
    return guide;
  }

  function createPanel(sidebar) {
    const panel = document.createElement("section");
    panel.className = `nemo-fun-panel${sidebar ? " nemo-fun-panel--sidebar" : ""}`;
    panel.setAttribute(
      "aria-label",
      sidebar ? "文章阅读间歇的随机短句" : "随机审判与小游戏入口"
    );
    panel.innerHTML = `
    <div class="nemo-fun-orb" aria-hidden="true"></div>
    <div class="nemo-fun-copy">
      <span>${sidebar ? "reading break" : "random note"}</span>
      <p data-nemo-verdict aria-live="polite"></p>
    </div>
    <div class="nemo-fun-actions">
      <button type="button" data-nemo-reroll>换一句</button>
      <a href="/games/calibration/">${sidebar ? "去校准" : "进入校准仪"}</a>
    </div>
  `;

    const verdict = panel.querySelector("[data-nemo-verdict]");
    const reroll = panel.querySelector("[data-nemo-reroll]");
    let previousIndex = -1;

    function choose() {
      let nextIndex = Math.floor(Math.random() * lines.length);
      if (lines.length > 1 && nextIndex === previousIndex) {
        nextIndex = (nextIndex + 1) % lines.length;
      }
      previousIndex = nextIndex;
      verdict.textContent = lines[nextIndex];
    }

    reroll.addEventListener("click", choose);
    choose();
    return panel;
  }

  if (isHome && !document.querySelector(".nemo-home-guide")) {
    const target =
      document.querySelector("#main > .archives-outer-wrap") ||
      document.querySelector("#main > .post-wrapper") ||
      document.querySelector("#main > article") ||
      document.querySelector("#main");
    if (target && target.parentNode) {
      const fragment = document.createDocumentFragment();
      fragment.append(createGuide(), createPanel(false));
      target.parentNode.insertBefore(fragment, target);
    }
  }

  const article = document.querySelector("#main > article.h-entry");
  const articleBody = article && article.querySelector(".article-entry");
  const isLongArticle =
    articleBody && articleBody.textContent.replace(/\s+/g, "").length >= 1000;
  const sidebar = document.querySelector("#sidebar .sidebar-wrapper-container.sticky");
  if (
    isLongArticle &&
    sidebar &&
    !sidebar.querySelector(".nemo-fun-panel--sidebar")
  ) {
    sidebar.appendChild(createPanel(true));
  }
})();
