(() => {
  const normalizePath = (value) => {
    const path = new URL(value, location.origin).pathname.replace(/index\.html$/, "");
    return path === "/" ? path : path.replace(/\/$/, "");
  };

  const currentPath = normalizePath(location.href);
  document
    .querySelectorAll("#main-nav a.main-nav-link-wrap, #mobile-nav a.sidebar-menu-link-dummy")
    .forEach((link) => {
      if (normalizePath(link.href) === currentPath) {
        link.setAttribute("aria-current", "page");
      }
    });

  const article = document.querySelector("#main > article.h-entry .article-entry");
  if (!article || article.textContent.replace(/\s+/g, "").length < 1200) return;

  const progress = document.createElement("div");
  progress.className = "nemo-reading-progress";
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "文章阅读进度");
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "100");
  progress.setAttribute("aria-valuenow", "0");
  progress.innerHTML = '<span aria-hidden="true"></span>';
  document.body.append(progress);

  const bar = progress.querySelector("span");
  let scheduled = false;
  let announcedValue = -1;

  const update = () => {
    scheduled = false;
    const articleTop = article.getBoundingClientRect().top + window.scrollY;
    const start = articleTop - 120;
    const end = articleTop + article.scrollHeight - window.innerHeight + 120;
    const ratio = end <= start ? 1 : (window.scrollY - start) / (end - start);
    const value = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
    bar.style.transform = `scaleX(${value / 100})`;
    progress.classList.toggle("is-active", value > 0 && value < 100);

    const rounded = Math.round(value / 5) * 5;
    if (rounded !== announcedValue) {
      announcedValue = rounded;
      progress.setAttribute("aria-valuenow", String(rounded));
    }
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
})();
