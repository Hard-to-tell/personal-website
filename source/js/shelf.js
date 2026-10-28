(() => {
  const mounts = () => document.querySelectorAll("[data-nemo-shelf]");
  if (!mounts().length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  // star positions as [x%, y%] on a wide sky; narrow screens swap the axes
  const STARS = [
    [7, 64], [18, 36], [30, 54], [41, 22], [52, 46],
    [61, 74], [70, 44], [80, 20], [91, 42], [84, 76],
  ];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function link(href, className, text) {
    const node = el("a", className, text);
    node.href = href;
    node.target = "_blank";
    node.rel = "noopener";
    return node;
  }

  const formatDate = (date) => String(date).replaceAll("-", ".");
  const stars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);
  const hash = (text) =>
    [...String(text)].reduce((value, char) => (value * 31 + char.codePointAt(0)) >>> 0, 7);

  function renderStats(root, data) {
    const items = [
      ["看过", data.stats.films, "部"],
      ["读过", data.stats.books, "本"],
      ["想读", data.stats.wish, "本"],
      ["喜欢", data.stats.songs, "首"],
    ];
    items.forEach(([label, value, unit]) => {
      const item = el("div", "nemo-shelf-stat");
      const number = el("strong", "", String(value));
      item.append(el("span", "", label), number, el("span", "", unit));
      root.append(item);
    });
  }

  function renderSky(root, data) {
    const films = data.films.slice(0, STARS.length);
    const sky = el("div", "nemo-sky");
    const canvas = el("canvas", "nemo-sky-canvas");
    canvas.setAttribute("aria-hidden", "true");
    const list = el("ol", "nemo-sky-stars");
    list.setAttribute("aria-label", "十部影视");
    const card = el("div", "nemo-sky-card");
    card.setAttribute("aria-live", "polite");
    sky.append(canvas, list);
    root.append(sky, card);

    const buttons = films.map((film, index) => {
      const item = el("li");
      const button = el("button", "nemo-star");
      button.type = "button";
      button.setAttribute("aria-label", `${NUMERALS[index]}：${film.title}`);
      button.append(el("i"), el("span", "nemo-star-num", NUMERALS[index]), el("span", "nemo-star-name", film.short || film.title));
      item.append(button);
      list.append(item);
      return button;
    });

    let active = -1;
    function select(index) {
      if (index === active) return;
      active = index;
      buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
      const film = films[index];
      const inner = el("div", "nemo-sky-card-inner");
      inner.append(
        el("span", "nemo-sky-card-num", `${String(index + 1).padStart(2, "0")} / ${String(films.length).padStart(2, "0")}`),
        el("h3", "", film.title),
        el("p", "nemo-sky-card-meta", [film.year, film.by].filter(Boolean).join(" · "))
      );
      if (film.note) inner.append(el("p", "nemo-sky-card-note", film.note));
      inner.append(link(`https://movie.douban.com/subject/${film.id}/`, "nemo-sky-card-link", "豆瓣条目 ↗"));
      card.replaceChildren(inner);
      draw.highlight = index;
    }

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => select(index));
      button.addEventListener("mouseenter", () => select(index));
      button.addEventListener("focus", () => select(index));
      button.addEventListener("keydown", (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        buttons[(index + step + buttons.length) % buttons.length].focus();
      });
    });

    const draw = createSky(sky, canvas, buttons);
    select(0);
  }

  function createSky(sky, canvas, buttons) {
    const context = canvas.getContext("2d");
    const state = { highlight: 0, progress: reduceMotion ? 1 : 0, started: reduceMotion, dust: [], width: 0, height: 0 };
    let frame = 0;

    function layout() {
      const narrow = sky.clientWidth < 620;
      sky.classList.toggle("is-narrow", narrow);
      buttons.forEach((button, index) => {
        const [x, y] = narrow ? [STARS[index][1], STARS[index][0]] : STARS[index];
        button.parentElement.style.left = `${x}%`;
        button.parentElement.style.top = `${y}%`;
      });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      state.width = sky.clientWidth;
      state.height = sky.clientHeight;
      canvas.width = Math.round(state.width * ratio);
      canvas.height = Math.round(state.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      let seed = 17;
      const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const count = Math.round((state.width * state.height) / 2600);
      state.dust = Array.from({ length: count }, () => ({
        x: random() * state.width,
        y: random() * state.height,
        r: random() * 0.9 + 0.2,
        a: random() * 0.45 + 0.08,
        t: random() * Math.PI * 2,
      }));
    }

    function points() {
      return buttons.map((button) => {
        const item = button.parentElement;
        return [item.offsetLeft, item.offsetTop];
      });
    }

    function render(time) {
      const { width, height } = state;
      context.clearRect(0, 0, width, height);
      state.dust.forEach((dot) => {
        const twinkle = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(time / 1400 + dot.t);
        context.fillStyle = `rgba(214, 222, 236, ${dot.a * twinkle})`;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        context.fill();
      });

      const path = points();
      const segments = path.length - 1;
      const drawn = state.progress * segments;
      context.lineWidth = 1;
      for (let i = 0; i < segments; i += 1) {
        const amount = Math.max(0, Math.min(1, drawn - i));
        if (!amount) break;
        const [x1, y1] = path[i];
        const [x2, y2] = path[i + 1];
        const lit = i === state.highlight || i + 1 === state.highlight;
        context.strokeStyle = lit ? "rgba(217, 185, 140, 0.55)" : "rgba(217, 185, 140, 0.2)";
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x1 + (x2 - x1) * amount, y1 + (y2 - y1) * amount);
        context.stroke();
      }
    }

    function loop(time) {
      frame = 0;
      if (state.started && state.progress < 1) state.progress = Math.min(1, state.progress + 0.012);
      render(time);
      if (!reduceMotion && visible) frame = requestAnimationFrame(loop);
    }

    let visible = false;
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };
    new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        state.started = true;
        sky.classList.add("is-lit");
        wake();
      }
    }, { threshold: 0.25 }).observe(sky);

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        layout();
        wake();
      }, 120);
    });

    layout();
    wake();
    return {
      set highlight(index) {
        state.highlight = index;
        wake();
      },
    };
  }

  function renderRecent(root, data) {
    const list = el("ol", "nemo-recent");
    data.recent.forEach((entry) => {
      const item = el("li", "nemo-recent-item");
      item.dataset.kind = entry.kind;
      const head = el("div", "nemo-recent-head");
      head.append(el("time", "nemo-recent-date", formatDate(entry.date)));
      const title = entry.url ? link(entry.url, "nemo-recent-title", entry.title) : el("span", "nemo-recent-title", entry.title);
      const body = el("div", "nemo-recent-body");
      body.append(el("span", "nemo-recent-kind", entry.kind), title);
      if (entry.by) body.append(el("span", "nemo-recent-by", entry.by));
      if (entry.rating) {
        const rating = el("span", "nemo-recent-rating", stars(entry.rating));
        rating.setAttribute("aria-label", `${entry.rating} 星`);
        body.append(rating);
      }
      if (entry.note) body.append(el("p", "nemo-recent-note", entry.note));
      item.append(head, body);
      list.append(item);
    });
    root.append(list);
  }

  function renderBooks(root, data) {
    const caption = el("p", "nemo-books-caption", "把指针停在书脊上，看看是谁写的。");
    caption.setAttribute("aria-live", "polite");
    const rows = [
      ["读过 · 五星", data.books.read, "read"],
      ["在读", data.books.reading, "reading"],
      ["想读", data.books.wish, "wish"],
    ];
    const tones = ["#1c2a3e", "#2a2236", "#1d302d", "#35261f", "#232f3f", "#2d2a1b", "#31202a", "#1a2533", "#2b3330"];

    rows.forEach(([label, books, kind]) => {
      if (!books?.length) return;
      const shelf = el("div", `nemo-books-shelf is-${kind}`);
      shelf.append(el("p", "nemo-books-label", `${label}  ${books.length}`));
      const row = el("div", "nemo-books-row");
      books.forEach((book) => {
        const seed = hash(book.title);
        const length = [...book.title].length;
        const spine = link(`https://book.douban.com/subject/${book.id}/`, "nemo-spine");
        spine.style.setProperty("--h", `${Math.max(150, length * 15 + 46) + (seed % 26)}px`);
        spine.style.setProperty("--w", `${30 + (seed % 4) * 4}px`);
        spine.style.setProperty("--tone", tones[seed % tones.length]);
        spine.setAttribute("aria-label", `《${book.title}》 ${book.by || ""}`);
        spine.append(el("span", "nemo-spine-title", book.title));
        const describe = () => {
          caption.textContent = `《${book.title}》${book.by ? ` · ${book.by}` : ""}${book.note ? ` · “${book.note}”` : ""}`;
        };
        spine.addEventListener("mouseenter", describe);
        spine.addEventListener("focus", describe);
        row.append(spine);
      });
      shelf.append(row);
      root.append(shelf);
    });
    root.append(caption);
  }

  function renderMusic(root, data) {
    const music = data.music;
    const grid = el("ol", "nemo-records");
    music.tracks.forEach((track) => {
      const item = el("li", "nemo-record");
      const anchor = link(`https://music.163.com/#/song?id=${track.id}`, "nemo-record-link");
      const sleeve = el("span", "nemo-record-sleeve");
      const cover = el("img");
      cover.alt = "";
      cover.loading = "lazy";
      cover.decoding = "async";
      cover.referrerPolicy = "no-referrer";
      cover.addEventListener("error", () => sleeve.classList.add("is-missing"));
      cover.src = `https://p2.music.126.net/${track.cover}?param=240y240`;
      sleeve.append(el("span", "nemo-record-disc"), cover);
      const text = el("span", "nemo-record-text");
      text.append(el("span", "nemo-record-title", track.title), el("span", "nemo-record-by", track.by));
      anchor.append(sleeve, text);
      item.append(anchor);
      grid.append(item);
    });

    const artists = el("div", "nemo-artists");
    artists.append(el("p", "nemo-artists-label", "歌单里出现最多的名字"));
    const max = Math.max(...music.artists.map(([, count]) => count));
    const bars = el("ol", "nemo-artist-bars");
    music.artists.forEach(([name, count]) => {
      const row = el("li");
      row.style.setProperty("--share", `${(count / max) * 100}%`);
      row.append(el("span", "nemo-artist-name", name), el("span", "nemo-artist-bar"), el("span", "nemo-artist-count", String(count)));
      bars.append(row);
    });
    artists.append(bars, link(music.playlist, "nemo-artists-more", `整张「${music.name}」${data.stats.songs} 首 ↗`));
    root.append(grid, artists);
  }

  function renderSource(root, data) {
    root.append(
      `手动整理于 ${formatDate(data.updated)}，来自`,
      link(data.douban, "", "豆瓣"),
      "与",
      link(data.music.playlist, "", "网易云音乐"),
      "。"
    );
  }

  const renderers = { stats: renderStats, sky: renderSky, recent: renderRecent, books: renderBooks, music: renderMusic, source: renderSource };

  function mount() {
    const data = window.__NEMO_SHELF__;
    if (!data) return;
    mounts().forEach((root) => {
      const render = renderers[root.dataset.nemoShelf];
      if (!render || root.dataset.mounted) return;
      root.dataset.mounted = "true";
      render(root, data);
    });
  }

  if (window.__NEMO_SHELF__) {
    mount();
    return;
  }
  const self = document.currentScript?.src || "";
  const script = document.createElement("script");
  script.src = self.replace(/shelf\.js/, "nemo-shelf-data.js");
  script.addEventListener("load", mount);
  document.body.append(script);
})();
