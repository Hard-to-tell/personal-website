(() => {
  let activeYear = "all";

  const entries = () =>
    (Array.isArray(window.__NEMO_GALLERY__) ? window.__NEMO_GALLERY__ : [])
      .filter((entry) => entry && entry.image && entry.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const getYear = (date) => String(date).slice(0, 4);
  const formatDate = (date) => String(date).slice(0, 10).replaceAll("-", ".");

  function createFilter(year, label, onSelect) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nemo-gallery-filter";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(activeYear === year));
    button.addEventListener("click", () => {
      activeYear = year;
      mount();
      onSelect();
    });
    return button;
  }

  function createCard(entry) {
    const item = document.createElement("article");
    item.className = "nemo-gallery-item";
    item.dataset.layout = entry.layout || "portrait";
    item.tabIndex = 0;

    const card = document.createElement("figure");
    card.className = "nemo-gallery-card";

    const frame = document.createElement("div");
    frame.className = "nemo-gallery-image";
    const image = document.createElement("img");
    image.src = entry.image;
    image.alt = entry.note || `记录于 ${formatDate(entry.date)}`;
    image.loading = "lazy";
    image.decoding = "async";
    frame.append(image);

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
    return item;
  }

  function mount() {
    const root = document.querySelector("[data-nemo-gallery]");
    if (!root) return;

    const allEntries = entries();
    const years = [...new Set(allEntries.map((entry) => getYear(entry.date)))].sort(
      (a, b) => b.localeCompare(a)
    );
    if (activeYear !== "all" && !years.includes(activeYear)) activeYear = "all";
    const visible =
      activeYear === "all"
        ? allEntries
        : allEntries.filter((entry) => getYear(entry.date) === activeYear);

    root.replaceChildren();
    const toolbar = document.createElement("div");
    toolbar.className = "nemo-gallery-toolbar";
    const label = document.createElement("span");
    label.textContent = "photo fragments";
    const filters = document.createElement("div");
    filters.className = "nemo-gallery-filters";
    const focusWall = () => root.querySelector(".nemo-gallery-wall")?.focus();
    filters.append(createFilter("all", "全部", focusWall));
    years.forEach((year) => filters.append(createFilter(year, year, focusWall)));
    toolbar.append(label, filters);

    const wall = document.createElement("div");
    wall.className = "nemo-gallery-wall";
    wall.tabIndex = -1;
    visible.forEach((entry) => wall.append(createCard(entry)));

    root.append(toolbar, wall);
  }

  document.addEventListener("DOMContentLoaded", mount);
  window.addEventListener("pjax:complete", mount);
  if (document.readyState !== "loading") mount();
})();
