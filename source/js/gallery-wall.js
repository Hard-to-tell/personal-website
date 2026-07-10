(() => {
  let activeMonth = "all";

  const entries = () =>
    (Array.isArray(window.__NEMO_GALLERY__) ? window.__NEMO_GALLERY__ : [])
      .filter((entry) => entry && entry.thumbnail && entry.full && entry.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const getMonth = (date) => String(date).slice(0, 7);
  const formatDate = (date) => String(date).slice(0, 10).replaceAll("-", ".");
  const formatMonth = (month) => {
    const [year, value] = month.split("-");
    return `${year}年${Number(value)}月`;
  };

  function createFilter(month, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nemo-gallery-filter";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(activeMonth === month));
    button.addEventListener("click", () => {
      activeMonth = month;
      mount();
    });
    return button;
  }

  function image(source, className, alt) {
    const element = document.createElement("img");
    element.className = className;
    element.src = source;
    element.alt = alt;
    element.decoding = "async";
    return element;
  }

  function createCard(entry) {
    const label = entry.note || `记录于 ${formatDate(entry.date)}`;
    const item = document.createElement("article");
    item.className = "nemo-gallery-item";
    item.tabIndex = 0;
    item.setAttribute("aria-label", label);

    const card = document.createElement("figure");
    card.className = "nemo-gallery-card";
    const frame = document.createElement("div");
    frame.className = "nemo-gallery-image";
    const thumbnail = image(entry.thumbnail, "nemo-gallery-thumb", label);
    const full = image(entry.full, "nemo-gallery-full", "");
    full.addEventListener("load", () => {
      item.style.setProperty(
        "--nemo-gallery-ratio",
        `${full.naturalWidth} / ${full.naturalHeight}`
      );
    });
    frame.append(thumbnail, full);

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

    const toggle = () => item.classList.toggle("is-open");
    item.addEventListener("click", toggle);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
    return item;
  }

  function mount() {
    const root = document.querySelector("[data-nemo-gallery]");
    if (!root) return;
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
    const toolbar = document.createElement("div");
    toolbar.className = "nemo-gallery-toolbar";
    const label = document.createElement("span");
    label.textContent = "photo fragments";
    const filters = document.createElement("div");
    filters.className = "nemo-gallery-filters";
    filters.append(createFilter("all", "全部"));
    months.forEach((month) => filters.append(createFilter(month, formatMonth(month))));
    toolbar.append(label, filters);

    const wall = document.createElement("div");
    wall.className = "nemo-gallery-wall";
    visible.forEach((entry) => wall.append(createCard(entry)));
    root.append(toolbar, wall);
  }

  document.addEventListener("DOMContentLoaded", mount);
  window.addEventListener("pjax:complete", mount);
  if (document.readyState !== "loading") mount();
})();
