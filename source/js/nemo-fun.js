(function () {
  const isHome =
    document.documentElement.classList.contains("nemo-home") ||
    location.pathname.replace(/index\.html$/, "") === "/";
  if (!isHome || document.querySelector(".nemo-fun-panel")) return;

  const target =
    document.querySelector("#main > .archives-outer-wrap") ||
    document.querySelector("#main > .post-wrapper") ||
    document.querySelector("#main > article") ||
    document.querySelector("#main");
  if (!target || !target.parentNode) return;

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

  const panel = document.createElement("section");
  panel.className = "nemo-fun-panel";
  panel.setAttribute("aria-label", "随机审判与小游戏入口");
  panel.innerHTML = `
    <div class="nemo-fun-orb" aria-hidden="true"></div>
    <div class="nemo-fun-copy">
      <span>random note</span>
      <p data-nemo-verdict></p>
    </div>
    <div class="nemo-fun-actions">
      <button type="button" data-nemo-reroll>换一句</button>
      <a href="/games/calibration/">进入校准仪</a>
    </div>
  `;

  const verdict = panel.querySelector("[data-nemo-verdict]");
  const reroll = panel.querySelector("[data-nemo-reroll]");

  function choose() {
    verdict.textContent = lines[Math.floor(Math.random() * lines.length)];
  }

  reroll.addEventListener("click", choose);
  choose();
  target.parentNode.insertBefore(panel, target);
})();
