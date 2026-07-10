(() => {
  if (!document.documentElement.classList.contains("nemo-home")) return;

  const wallpapers = window.__NEMO_WALLPAPERS__;
  if (!Array.isArray(wallpapers) || wallpapers.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const start = () => {
    const header = document.querySelector("#header");
    const base = header?.querySelector(":scope > img:not(.wallpaper-rotator-layer)");
    if (!header || !base || base.style.visibility === "hidden") return;

    const layer = base.cloneNode(false);
    layer.removeAttribute("fetchpriority");
    layer.alt = "";
    layer.setAttribute("aria-hidden", "true");
    layer.className = "wallpaper-rotator-layer";
    header.insertBefore(layer, header.querySelector("#header-outer"));

    let index = wallpapers.findIndex((url) => base.src.endsWith(url));
    if (index < 0) index = 0;
    const storedIndex = Number.parseInt(
      window.localStorage.getItem("nemo-wallpaper-index"),
      10
    );
    if (Number.isInteger(storedIndex)) index = storedIndex;
    let changing = false;

    const change = () => {
      if (changing || document.hidden) return;
      changing = true;
      const nextIndex = (index + 1) % wallpapers.length;
      const nextUrl = wallpapers[nextIndex];
      const preload = new Image();

      preload.onload = () => {
        layer.src = nextUrl;
        requestAnimationFrame(() => layer.classList.add("is-visible"));
        window.setTimeout(() => {
          base.src = nextUrl;
          index = nextIndex;
          window.localStorage.setItem("nemo-wallpaper-index", String(index));
          layer.classList.remove("is-visible");
          changing = false;
        }, 1300);
      };
      preload.onerror = () => {
        index = nextIndex;
        changing = false;
      };
      preload.src = nextUrl;
    };

    change();
    window.setInterval(change, 300000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
