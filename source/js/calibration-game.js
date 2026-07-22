(function () {
  const root = document.querySelector("[data-nemo-calibration]");
  if (!root) return;

  const grid = root.querySelector("[data-nemo-grid]");
  const targetEl = root.querySelector("[data-nemo-target]");
  const timeEl = root.querySelector("[data-nemo-time]");
  const mistakesEl = root.querySelector("[data-nemo-mistakes]");
  const bestEl = root.querySelector("[data-nemo-best]");
  const resultEl = root.querySelector("[data-nemo-result]");
  const leaderboardList = root.querySelector("[data-nemo-leaderboard-list]");
  const leaderboardEmpty = root.querySelector("[data-nemo-leaderboard-empty]");
  const leaderboardMode = root.querySelector("[data-nemo-leaderboard-mode]");
  const sizeButtons = Array.from(root.querySelectorAll("[data-nemo-size]"));
  const restartButton = root.querySelector("[data-nemo-restart]");
  const legacyRecordKey = "nemo-calibration-best-v1";
  const leaderboardKey = "nemo-calibration-leaderboard-v1";
  const leaderboardLimit = 5;
  const modeNames = {
    4: "访客 4×4",
    5: "书记员 5×5",
    6: "观测者 6×6",
  };

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
    "完成。便签没有飞走，这是少见的胜利。",
  ];

  let size = 5;
  let next = 1;
  let mistakes = 0;
  let startTime = 0;
  let timer = null;
  let finished = false;

  function readObject(key) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function compareRecords(left, right) {
    return (
      Number(left.seconds) - Number(right.seconds) ||
      Number(left.mistakes) - Number(right.mistakes) ||
      Number(left.playedAt || 0) - Number(right.playedAt || 0)
    );
  }

  function validRecord(record) {
    if (!record || typeof record !== "object") return null;
    const seconds = Number(record.seconds);
    const recordMistakes = Number(record.mistakes);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    return {
      seconds,
      mistakes:
        Number.isFinite(recordMistakes) && recordMistakes >= 0
          ? Math.floor(recordMistakes)
          : 0,
      playedAt: Number(record.playedAt) || 0,
    };
  }

  function leaderboards() {
    const stored = readObject(leaderboardKey);
    const legacy = readObject(legacyRecordKey);
    const result = {};

    Object.keys(modeNames).forEach((mode) => {
      const entries = Array.isArray(stored[mode])
        ? stored[mode].map(validRecord).filter(Boolean)
        : [];
      const legacyEntry = validRecord(legacy[mode]);
      if (!entries.length && legacyEntry) entries.push(legacyEntry);
      result[mode] = entries.sort(compareRecords).slice(0, leaderboardLimit);
    });

    return result;
  }

  function writeLeaderboards(records) {
    try {
      window.localStorage.setItem(leaderboardKey, JSON.stringify(records));
      return true;
    } catch {
      return false;
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return "旧记录";
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
    }).format(new Date(timestamp));
  }

  function renderLeaderboard(records = leaderboards()) {
    const entries = records[size] || [];
    leaderboardMode.textContent = modeNames[size];
    leaderboardList.replaceChildren();

    entries.forEach((record, index) => {
      const item = document.createElement("li");
      const rank = document.createElement("span");
      const result = document.createElement("span");
      const time = document.createElement("strong");
      const detail = document.createElement("small");

      rank.className = "nemo-leaderboard-rank";
      rank.textContent = String(index + 1).padStart(2, "0");
      time.textContent = `${record.seconds.toFixed(1)}s`;
      detail.textContent = `误触 ${record.mistakes} · ${formatDate(record.playedAt)}`;
      result.append(time, detail);
      item.append(rank, result);
      leaderboardList.appendChild(item);
    });

    leaderboardList.hidden = entries.length === 0;
    leaderboardEmpty.hidden = entries.length > 0;
  }

  function updateBest(records = leaderboards()) {
    const best = records[size] && records[size][0];
    bestEl.textContent = best ? `${best.seconds.toFixed(1)}s` : "—";
  }

  function saveResult(seconds) {
    const records = leaderboards();
    const previousBest = records[size] && records[size][0];
    const entry = { seconds, mistakes, playedAt: Date.now() };
    const ranked = [...(records[size] || []), entry].sort(compareRecords);
    records[size] = ranked.slice(0, leaderboardLimit);
    const rank = records[size].indexOf(entry) + 1;
    const isBest = !previousBest || compareRecords(entry, previousBest) < 0;
    writeLeaderboards(records);
    return { records, rank, isBest };
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
    const records = leaderboards();
    updateBest(records);
    renderLeaderboard(records);
    resultEl.textContent = "从 1 开始。不用急，先看见。";
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
      const seconds = Number(((Date.now() - startTime) / 1000).toFixed(1));
      const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
      const saved = saveResult(seconds);
      updateBest(saved.records);
      renderLeaderboard(saved.records);
      const rankMessage = saved.rank ? ` 本机排行第 ${saved.rank}。` : "";
      resultEl.textContent = `${verdict} 用时 ${seconds.toFixed(1)}s，误触 ${mistakes} 次。${saved.isBest ? " 新纪录。" : ""}${rankMessage}`;
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
    button.setAttribute(
      "aria-pressed",
      String(Number(button.dataset.nemoSize) === size)
    );
  });

  render();
})();
