(() => {
  const storageKey = "nemo-ambient-enabled";
  let context;
  let master;
  let timer;
  let playing = false;

  function createEngine() {
    if (context) return;
    context = new (window.AudioContext || window.webkitAudioContext)();
    master = context.createGain();
    master.gain.value = 0.055;
    master.connect(context.destination);
  }

  function playTone(frequency, start, duration) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.17, start + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.08);
  }

  function schedule() {
    if (!playing) return;
    const start = context.currentTime + 0.05;
    [220, 329.63, 440, 293.66, 392].forEach((frequency, index) => {
      playTone(frequency, start + index * 1.5, 1.9);
    });
    timer = window.setTimeout(schedule, 8500);
  }

  function setState(button, label) {
    button.setAttribute("aria-pressed", String(playing));
    label.textContent = playing ? "暂停氛围" : "播放氛围";
    button.classList.toggle("is-playing", playing);
  }

  function mount() {
    if (document.querySelector(".nemo-ambient-player")) return;
    const player = document.createElement("div");
    player.className = "nemo-ambient-player";
    player.innerHTML =
      '<button type="button" aria-label="控制背景音乐" aria-pressed="false"><span aria-hidden="true">♫</span><span>播放氛围</span></button>';
    const button = player.querySelector("button");
    const label = button.lastElementChild;
    button.addEventListener("click", async () => {
      createEngine();
      if (playing) {
        playing = false;
        window.clearTimeout(timer);
        localStorage.removeItem(storageKey);
      } else {
        await context.resume();
        playing = true;
        localStorage.setItem(storageKey, "true");
        schedule();
      }
      setState(button, label);
    });
    if (localStorage.getItem(storageKey) === "true") {
      button.title = "浏览器需要点击后才能恢复背景音乐";
    }
    document.body.append(player);
  }

  document.addEventListener("DOMContentLoaded", mount);
  if (document.readyState !== "loading") mount();
})();
