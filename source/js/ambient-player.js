(() => {
  const indexKey = "nemo-music-index";

  const tracks = () =>
    Array.isArray(window.__NEMO_MUSIC__) ? window.__NEMO_MUSIC__ : [];

  function savedIndex(length) {
    const value = Number.parseInt(localStorage.getItem(indexKey), 10);
    return Number.isInteger(value) && value >= 0 && value < length ? value : 0;
  }

  function mount() {
    if (
      window.matchMedia("(max-width: 600px)").matches ||
      document.querySelector(".nemo-ambient-player") ||
      !tracks().length
    ) {
      return;
    }
    const player = document.createElement("div");
    player.className = "nemo-ambient-player";
    player.innerHTML =
      '<button type="button" data-nemo-toggle aria-label="播放">▶</button><button type="button" data-nemo-next aria-label="下一首">⏭</button>';
    const audio = document.createElement("audio");
    audio.hidden = true;
    audio.preload = "none";
    audio.volume = 0.23;
    const toggle = player.querySelector("[data-nemo-toggle]");
    const next = player.querySelector("[data-nemo-next]");
    let index = savedIndex(tracks().length);
    player.prepend(audio);

    function sync() {
      const track = tracks()[index];
      toggle.textContent = audio.paused ? "▶" : "⏸";
      toggle.setAttribute("aria-label", `${audio.paused ? "播放" : "暂停"}：${track.title}`);
      toggle.setAttribute("aria-pressed", String(!audio.paused));
    }

    async function play() {
      try {
        await audio.play();
      } catch {
        toggle.textContent = "播放";
      }
    }

    function select(nextIndex, autoplay) {
      index = nextIndex % tracks().length;
      localStorage.setItem(indexKey, String(index));
      audio.src = tracks()[index].src;
      sync();
      if (autoplay) play();
    }

    toggle.addEventListener("click", () => (audio.paused ? play() : audio.pause()));
    next.addEventListener("click", () => select(index + 1, true));
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", () => select(index + 1, true));
    select(index, false);
    document.body.append(player);
  }

  document.addEventListener("DOMContentLoaded", mount);
  if (document.readyState !== "loading") mount();
})();
