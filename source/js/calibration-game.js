(function () {
  const root = document.querySelector("[data-nemo-calibration]");
  if (!root) return;

  const grid = root.querySelector("[data-nemo-grid]");
  const targetEl = root.querySelector("[data-nemo-target]");
  const timeEl = root.querySelector("[data-nemo-time]");
  const mistakesEl = root.querySelector("[data-nemo-mistakes]");
  const bestEl = root.querySelector("[data-nemo-best]");
  const resultEl = root.querySelector("[data-nemo-result]");
  const sizeButtons = Array.from(root.querySelectorAll("[data-nemo-size]"));
  const restartButton = root.querySelector("[data-nemo-restart]");
  const recordKey = "nemo-calibration-best-v1";

  const verdicts = [
    "校准完成。今天的注意力被温柔地归档。",
    "记录通过。你比风暴里的便签更稳定一点。",
    "系统确认：你仍然适合在月光下阅读。",
    "误差可接受。请领取一枚不存在的通行章。",
    "校准结束。书记员决定把你的名字写得更清楚。",
    "完成。风车被正确识别为风车，没有开战。",
    "完成。兔子洞暂时关闭，你安全返回页面。",
    "完成。白鲸没有撞翻你的注意力。",
    "完成。城堡仍在远处，但路线稍微清晰了一点。",
    "完成。猫既在盒子里，也在你的战绩里。",
    "完成。今天的审判改为下午茶。",
    "完成。你成功从标签云里找回了顺序。",
    "完成。月亮批准你继续发呆五分钟。",
    "完成。便签没有飞走，这是少见的胜利。"
  ];

  let size = 5;
  let next = 1;
  let mistakes = 0;
  let startTime = 0;
  let timer = null;
  let finished = false;

  function records() {
    try {
      const value = JSON.parse(window.localStorage.getItem(recordKey) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function updateBest() {
    const best = records()[size];
    bestEl.textContent = best ? `${Number(best.seconds).toFixed(1)}s` : "—";
  }

  function saveResult(seconds) {
    const allRecords = records();
    const previous = allRecords[size];
    const isBest = !previous || seconds < Number(previous.seconds);
    if (isBest) {
      allRecords[size] = { seconds, mistakes };
      try {
        window.localStorage.setItem(recordKey, JSON.stringify(allRecords));
      } catch {
        return false;
      }
    }
    return isBest;
  }

  function shuffle(values) {
    const items = values.slice();
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }

  function updateTime() {
    if (!startTime || finished) return;
    timeEl.textContent = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
  }

  function startClock() {
    if (startTime) return;
    startTime = Date.now();
    updateTime();
    timer = window.setInterval(updateTime, 100);
  }

  function stopClock() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function render() {
    stopClock();
    next = 1;
    mistakes = 0;
    startTime = 0;
    finished = false;
    targetEl.textContent = "1";
    timeEl.textContent = "0.0s";
    mistakesEl.textContent = "0";
    updateBest();
    resultEl.textContent = "从 1 开始。不要急，先看见。";
    grid.style.setProperty("--nemo-grid-size", size);
    grid.innerHTML = "";

    shuffle(Array.from({ length: size * size }, (_, index) => index + 1)).forEach(
      (value) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "nemo-grid-cell";
        cell.textContent = value;
        cell.dataset.value = value;
        cell.setAttribute("aria-label", `数字 ${value}`);
        grid.appendChild(cell);
      }
    );
  }

  grid.addEventListener("click", (event) => {
    const cell = event.target.closest(".nemo-grid-cell");
    if (!cell || finished) return;
    startClock();

    const value = Number(cell.dataset.value);
    if (value !== next) {
      mistakes += 1;
      mistakesEl.textContent = mistakes;
      cell.classList.remove("is-wrong");
      void cell.offsetWidth;
      cell.classList.add("is-wrong");
      resultEl.textContent = `现在要找 ${next}。`;
      return;
    }

    cell.disabled = true;
    cell.classList.add("is-done");
    next += 1;
    targetEl.textContent = next > size * size ? "完成" : next;

    if (next > size * size) {
      finished = true;
      stopClock();
      const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
      const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
      const isBest = saveResult(Number(seconds));
      updateBest();
      resultEl.textContent = `${verdict} 用时 ${seconds}s，误触 ${mistakes} 次。${isBest ? " 新纪录。" : ""}`;
    }
  });

  sizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      size = Number(button.dataset.nemoSize);
      sizeButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });

  restartButton.addEventListener("click", render);

  sizeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.nemoSize) === size));
  });

  render();
})();
