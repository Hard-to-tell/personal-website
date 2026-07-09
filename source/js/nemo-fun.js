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
    "随机结果：适合阅读、发呆、整理一个小念头。"
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
