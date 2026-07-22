(() => {
  let activeMonth = "all";
  let lightbox = null;
  let previousFocus = null;

  const entries = () =>
    (Array.isArray(window.__NEMO_GALLERY__) ? window.__NEMO_GALLERY__ : [])
      .filter((entry) => entry && entry.thumbnail && entry.full && entry.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const getMonth = (date) => String(date).slice(0, 7);
  const formatDate = (date) => String(date).slice(0, 10).replaceAll("-", ".");
  const formatMonth = (month) => {
    const [year, value] = month.split("-");
    return `${year} 年 ${Number(value)} 月`;
  };

  function image(source, className, alt) {
    const element = document.createElement("img");
    element.className = className;
    if (source) element.src = source;
    element.alt = alt;
    element.decoding = "async";
    element.loading = "lazy";
    return element;
  }

  function createLightbox() {
    if (lightbox?.overlay?.isConnected) return lightbox;

    const overlay = document.createElement("div");
    overlay.className = "nemo-gallery-lightbox";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "照片大图");

    const closeButton = document.createElement("button");
    closeButton.className = "nemo-gallery-lightbox-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "关闭大图");
    closeButton.textContent = "×";

    const figure = document.createElement("figure");
    figure.className = "nemo-gallery-lightbox-figure";
    const fullImage = image("", "nemo-gallery-lightbox-image", "");
    fullImage.loading = "eager";
    const caption = document.createElement("figcaption");
    caption.className = "nemo-gallery-lightbox-caption";
    figure.append(fullImage, caption);
    overlay.append(closeButton, figure);
    document.body.append(overlay);

    lightbox = { overlay, closeButton, fullImage, caption };
    closeButton.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (overlay.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButton.focus();
      }
    });
    return lightbox;
  }

  function openLightbox(entry, trigger) {
    const view = createLightbox();
    previousFocus = trigger;
    view.fullImage.src = entry.full;
    view.fullImage.alt = entry.note || `记录于 ${formatDate(entry.date)}`;
    view.caption.replaceChildren();

    if (entry.note) {
      const note = document.createElement("span");
      note.textContent = entry.note;
      view.caption.append(note);
    }
    const date = document.createElement("time");
    date.dateTime = String(entry.date).slice(0, 10);
    date.textContent = formatDate(entry.date);
    view.caption.append(date);

    view.overlay.hidden = false;
    document.documentElement.classList.add("nemo-lightbox-open");
    requestAnimationFrame(() => {
      view.overlay.classList.add("is-visible");
      view.closeButton.focus({ preventScroll: true });
    });
  }

  function closeLightbox() {
    if (!lightbox || lightbox.overlay.hidden) return;
    const { overlay, fullImage } = lightbox;
    overlay.classList.remove("is-visible");
    document.documentElement.classList.remove("nemo-lightbox-open");
    window.setTimeout(() => {
      if (overlay.classList.contains("is-visible")) return;
      overlay.hidden = true;
      fullImage.removeAttribute("src");
    }, 180);
    previousFocus?.focus?.({ preventScroll: true });
    previousFocus = null;
  }

  function createCard(entry) {
    const label = entry.note || `记录于 ${formatDate(entry.date)}`;
    const item = document.createElement("article");
    item.className = "nemo-gallery-item";
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `${label}，查看大图`);
    item.setAttribute("aria-haspopup", "dialog");

    const card = document.createElement("figure");
    card.className = "nemo-gallery-card";
    const frame = document.createElement("div");
    frame.className = "nemo-gallery-image";
    const thumbnail = image(entry.thumbnail, "nemo-gallery-thumb", label);
    frame.append(thumbnail);

    const caption = document.createElement("figcaption");
    caption.className = "nemo-gallery-caption";
    if (entry.note) {
      const note = document.createElement("p");
      note.textContent = entry.note;
      caption.append(note);
    }
    const date = document.createElement("time");
    date.dateTime = String(entry.date).slice(0, 10);
    date.textContent = formatDate(entry.date);
    caption.append(date);
    card.append(frame, caption);
    item.append(card);

    const open = () => {
      openLightbox(entry, item);
    };
    item.addEventListener("click", open);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    return item;
  }

  function mount(restoreFocus = false) {
    const root = document.querySelector("[data-nemo-gallery]");
    if (!root) {
      closeLightbox();
      return;
    }
    const allEntries = entries();
    const months = [...new Set(allEntries.map((entry) => getMonth(entry.date)))].sort(
      (a, b) => b.localeCompare(a)
    );
    if (activeMonth !== "all" && !months.includes(activeMonth)) activeMonth = "all";
    const visible =
      activeMonth === "all"
        ? allEntries
        : allEntries.filter((entry) => getMonth(entry.date) === activeMonth);

    root.replaceChildren();
    if (!allEntries.length) {
      const empty = document.createElement("p");
      empty.className = "nemo-gallery-empty";
      empty.textContent = "这里还没有照片，等下一段时间被留下来。";
      root.append(empty);
      return;
    }
    const toolbar = document.createElement("div");
    toolbar.className = "nemo-gallery-toolbar";
    const label = document.createElement("span");
    label.textContent = `photo fragments · ${visible.length}`;
    const selector = document.createElement("label");
    selector.className = "nemo-gallery-selector";
    selector.textContent = "查看：";
    const select = document.createElement("select");
    select.setAttribute("aria-label", "按年月筛选照片");
    [["all", "全部照片"], ...months.map((month) => [month, formatMonth(month)])].forEach(
      ([value, text]) => select.add(new Option(text, value, false, value === activeMonth))
    );
    select.addEventListener("change", () => {
      activeMonth = select.value;
      mount(true);
    });
    selector.append(select);
    toolbar.append(label, selector);

    const wall = document.createElement("div");
    wall.className = "nemo-gallery-wall";
    visible.forEach((entry) => wall.append(createCard(entry)));
    root.append(toolbar, wall);
    if (restoreFocus) select.focus();
  }

  document.addEventListener("DOMContentLoaded", mount);
  window.addEventListener("pjax:complete", mount);
  if (document.readyState !== "loading") mount();
})();
