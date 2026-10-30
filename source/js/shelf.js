(() => {
  const mounts = () => document.querySelectorAll("[data-nemo-shelf]");
  if (!mounts().length) return;

  const self = document.currentScript?.src || location.href;
  const coverBase = new URL("../images/shelf/", self).href;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  const stars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

  // draw `count` entries at random, preferring ones that are not on screen yet
  function sample(pool, count, current = []) {
    const shown = new Set(current);
    const fresh = pool.filter((entry) => !shown.has(entry));
    const source = fresh.length >= count ? fresh : pool;
    const copy = source.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    // keep one entry per series, so two seasons of the same show never share a draw
    const picked = [];
    const series = new Set();
    for (const entry of copy) {
      const key = [...entry.title].slice(0, 4).join("");
      if (series.has(key)) continue;
      series.add(key);
      picked.push(entry);
      if (picked.length === count) break;
    }
    return picked;
  }

  // a cover with the title set underneath, which shows if the image never arrives
  function cover(src, title, className) {
    const face = el("span", `nemo-cover ${className || ""}`);
    face.append(el("span", "nemo-cover-fallback", title));
    const image = el("img", "no-lightbox");
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    image.addEventListener("load", () => face.classList.add("is-loaded"));
    image.addEventListener("error", () => image.remove());
    image.src = src;
    face.append(image);
    return face;
  }

  function onVisible(node, callback) {
    if (!("IntersectionObserver" in window)) return callback(true);
    new IntersectionObserver((entries) => callback(entries.some((entry) => entry.isIntersecting)), {
      threshold: 0.3,
    }).observe(node);
  }

  function reshuffleButton(label, onClick) {
    const button = el("button", "nemo-shelf-shuffle");
    button.type = "button";
    button.append(el("span", "nemo-shelf-shuffle-mark", "↻"), el("span", "", label));
    button.addEventListener("click", onClick);
    return button;
  }

  // swap a stage's contents behind a short dissolve
  function dissolve(stage, rebuild) {
    if (reduceMotion) return rebuild();
    stage.classList.add("is-leaving");
    setTimeout(() => {
      rebuild();
      stage.classList.remove("is-leaving");
      stage.classList.add("is-entering");
      requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove("is-entering")));
    }, 520);
  }

  /* 影：posters drifting on dark water, one at a time in front */
  function renderFilms(root, data) {
    const count = data.draw?.films || 7;
    const stage = el("div", "nemo-reel");
    stage.setAttribute("role", "group");
    stage.setAttribute("aria-label", "随机抽到的电影，左右方向键切换");
    const track = el("div", "nemo-reel-track");
    stage.append(track, el("span", "nemo-reel-horizon"));
    const caption = el("div", "nemo-reel-caption");
    caption.setAttribute("aria-live", "polite");
    const bar = el("div", "nemo-shelf-bar");
    const previous = el("button", "nemo-shelf-step", "‹");
    previous.type = "button";
    previous.setAttribute("aria-label", "上一部");
    const next = el("button", "nemo-shelf-step", "›");
    next.type = "button";
    next.setAttribute("aria-label", "下一部");
    const counter = el("span", "nemo-shelf-counter");
    bar.append(previous, counter, next, reshuffleButton("换一批", () => dissolve(stage, () => draw())));
    root.append(stage, caption, bar);

    let films = [];
    let cards = [];
    let active = 0;
    let lastTouch = 0;

    function draw() {
      films = sample(data.films, count, films);
      active = Math.floor(films.length / 2);
      cards = films.map((film, index) => {
        const card = el("button", "nemo-reel-card");
        card.type = "button";
        card.setAttribute("aria-label", `${film.title}（${film.year}）`);
        const src = `${coverBase}films/${film.id}.webp`;
        card.append(cover(src, film.title, "nemo-reel-face"), cover(src, "", "nemo-reel-reflection"));
        card.addEventListener("click", () => {
          lastTouch = Date.now();
          if (index === active) window.open(`https://movie.douban.com/subject/${film.id}/`, "_blank", "noopener");
          else select(index);
        });
        return card;
      });
      track.replaceChildren(...cards);
      layout();
    }

    function layout() {
      const narrow = stage.clientWidth < 560;
      const near = narrow ? 92 : 168;
      const step = narrow ? 46 : 82;
      const depth = narrow ? 110 : 150;
      const half = Math.floor(cards.length / 2);
      cards.forEach((card, index) => {
        let offset = index - active;
        if (offset > half) offset -= cards.length;
        if (offset < -half) offset += cards.length;
        const distance = Math.abs(offset);
        const side = Math.sign(offset);
        const x = distance ? side * (near + (distance - 1) * step) : 0;
        const z = distance ? -distance * depth : 40;
        card.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${-side * 42}deg)`;
        card.style.zIndex = String(20 - distance);
        card.style.setProperty("--fade", String(Math.min(distance * 0.2, 0.75)));
        card.classList.toggle("is-active", !distance);
        card.classList.toggle("is-hidden", distance > (narrow ? 2 : 3));
        card.tabIndex = distance ? -1 : 0;
      });
      const film = films[active];
      const inner = el("div", "nemo-reel-caption-inner");
      const title = link(`https://movie.douban.com/subject/${film.id}/`, "nemo-reel-title", film.title);
      const meta = el("p", "nemo-reel-meta");
      meta.append(el("span", "", String(film.year)), el("span", "nemo-shelf-stars", stars(film.rating)));
      inner.append(title, meta);
      if (film.note) inner.append(el("p", "nemo-shelf-note", film.note));
      caption.replaceChildren(inner);
      counter.textContent = `${String(active + 1).padStart(2, "0")} / ${String(films.length).padStart(2, "0")}`;
    }

    function select(index) {
      active = (index + cards.length) % cards.length;
      layout();
    }

    const move = (step) => {
      lastTouch = Date.now();
      select(active + step);
    };
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    stage.addEventListener("keydown", (event) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (!step) return;
      event.preventDefault();
      move(step);
      cards[active].focus();
    });

    let startX = null;
    stage.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
    });
    stage.addEventListener("pointerup", (event) => {
      if (startX === null) return;
      const distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
    });

    let visible = false;
    onVisible(stage, (state) => {
      visible = state;
      stage.classList.toggle("is-awake", state || stage.classList.contains("is-awake"));
    });
    if (!reduceMotion) {
      setInterval(() => {
        if (!visible || Date.now() - lastTouch < 9000 || stage.matches(":hover, :focus-within")) return;
        select(active + 1);
      }, 5200);
    }

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 120);
    });
    draw();
  }

  /* 书：a hand of covers fanned out; the one you point at rises */
  function renderBooks(root, data) {
    const count = data.draw?.books || 6;
    const stage = el("div", "nemo-fan");
    const hand = el("div", "nemo-fan-hand");
    stage.append(hand);
    const caption = el("div", "nemo-fan-caption");
    caption.setAttribute("aria-live", "polite");
    const bar = el("div", "nemo-shelf-bar");
    bar.append(reshuffleButton("换一批", () => dissolve(stage, () => draw())));
    root.append(stage, caption, bar);

    let books = [];
    let cards = [];
    let active = 0;

    function describe(book) {
      const inner = el("div", "nemo-fan-caption-inner");
      inner.append(
        link(`https://book.douban.com/subject/${book.id}/`, "nemo-fan-title", `《${book.title}》`),
        el("span", "nemo-fan-by", book.by),
        el("span", "nemo-shelf-stars", stars(book.rating))
      );
      if (book.note) inner.append(el("p", "nemo-shelf-note", book.note));
      caption.replaceChildren(inner);
    }

    function lift(index) {
      active = index;
      cards.forEach((card, i) => card.classList.toggle("is-up", i === index));
      describe(books[index]);
    }

    function draw() {
      books = sample(data.books, count, books);
      const middle = (books.length - 1) / 2;
      cards = books.map((book, index) => {
        const card = link(`https://book.douban.com/subject/${book.id}/`, "nemo-fan-card");
        card.setAttribute("aria-label", `《${book.title}》 ${book.by}`);
        card.style.setProperty("--i", String(index - middle));
        card.append(cover(`${coverBase}books/${book.id}.webp`, book.title, "nemo-fan-face"));
        card.addEventListener("mouseenter", () => lift(index));
        card.addEventListener("focus", () => lift(index));
        // first tap on a touch screen lifts the book, the second opens it
        card.addEventListener("click", (event) => {
          if (index === active && card.classList.contains("is-up")) return;
          event.preventDefault();
          lift(index);
        });
        return card;
      });
      hand.replaceChildren(...cards);
      lift(Math.floor(Math.random() * books.length));
    }

    onVisible(stage, (state) => state && stage.classList.add("is-awake"));
    draw();
  }

  /* 音：a record player with the latest liked songs */
  function renderMusic(root, data) {
    const music = data.music;
    const tracks = music.tracks;
    const deck = el("div", "nemo-deck");
    const player = el("div", "nemo-deck-player");
    const disc = el("span", "nemo-deck-disc");
    const label = el("span", "nemo-deck-label");
    const labelImage = el("img", "no-lightbox");
    labelImage.alt = "";
    label.append(labelImage);
    disc.append(el("span", "nemo-deck-grooves"), label, el("span", "nemo-deck-sheen"));
    const sleeve = el("span", "nemo-deck-sleeve");
    const arm = el("span", "nemo-deck-arm");
    player.append(disc, sleeve, arm);
    const now = el("div", "nemo-deck-now");
    now.setAttribute("aria-live", "polite");
    const side = el("div", "nemo-deck-side");
    side.append(el("p", "nemo-deck-heading", "最近收藏的十首"));
    const list = el("ol", "nemo-deck-list");
    side.append(list, link(music.playlist, "nemo-deck-more", "整张歌单 ↗"));
    const stage = el("div", "nemo-deck-stage");
    stage.append(player, now);
    deck.append(stage, side);
    root.append(deck);

    const coverOf = (track) => `${coverBase}music/${track.id}.webp`;
    const rows = tracks.map((track, index) => {
      const row = el("li");
      const button = el("button", "nemo-deck-track");
      button.type = "button";
      button.append(
        el("span", "nemo-deck-index", String(index + 1).padStart(2, "0")),
        el("span", "nemo-deck-title", track.title),
        el("span", "nemo-deck-by", track.by),
        el("span", "nemo-deck-eq")
      );
      button.addEventListener("click", () => play(index));
      row.append(button);
      list.append(row);
      return button;
    });

    let current = -1;
    let swapTimer = 0;
    function play(index) {
      if (index === current) return;
      const first = current < 0;
      current = index;
      const track = tracks[index];
      rows.forEach((row, i) => row.setAttribute("aria-current", i === index ? "true" : "false"));
      const show = () => {
        sleeve.replaceChildren(cover(coverOf(track), track.title, "nemo-deck-cover"));
        labelImage.src = coverOf(track);
        const inner = el("div", "nemo-deck-now-inner");
        inner.append(
          el("p", "nemo-deck-now-title", track.title),
          el("p", "nemo-deck-now-by", `${track.by} · ${track.album}`),
          link(`https://music.163.com/#/song?id=${track.id}`, "nemo-deck-listen", "去网易云听 ↗")
        );
        now.replaceChildren(inner);
        player.classList.add("is-playing");
      };
      clearTimeout(swapTimer);
      if (first || reduceMotion) return show();
      player.classList.remove("is-playing");
      swapTimer = setTimeout(show, 650);
    }

    onVisible(deck, (state) => deck.classList.toggle("is-awake", state));
    play(Math.floor(Math.random() * tracks.length));
  }

  function renderSource(root, data) {
    root.append(
      `书影只取打了四星、五星的，每次打开随机抽一些；整理于 ${String(data.updated).replaceAll("-", ".")}，来自`,
      link(data.douban, "", "豆瓣"),
      "与",
      link(data.music.playlist, "", "网易云音乐"),
      "。"
    );
  }

  const renderers = { films: renderFilms, books: renderBooks, music: renderMusic, source: renderSource };

  // stages measure themselves, so a shelf inside a closed panel waits until the panel opens
  function mount() {
    const data = window.__NEMO_SHELF__;
    if (!data) return;
    mounts().forEach((root) => {
      const render = renderers[root.dataset.nemoShelf];
      if (!render || root.dataset.mounted || root.closest("[hidden]")) return;
      root.dataset.mounted = "true";
      render(root, data);
    });
  }

  /* 记录: photos, films, books and music folded into one switcher */
  function setupRecord(record) {
    const panels = [...record.querySelectorAll(":scope > [data-panel]")];
    if (!panels.length) return;
    const bar = el("div", "nemo-record-tabs");
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "记录的种类");
    const glow = el("span", "nemo-record-tabs-glow");
    glow.setAttribute("aria-hidden", "true");
    const tabs = panels.map((panel, index) => {
      const tab = el("button", "nemo-record-tab", panel.dataset.label);
      tab.type = "button";
      tab.id = `nemo-record-tab-${panel.dataset.panel}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `nemo-record-panel-${panel.dataset.panel}`);
      panel.id = `nemo-record-panel-${panel.dataset.panel}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      tab.addEventListener("click", () => open(index, true));
      tab.addEventListener("keydown", (event) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const next = (index + step + tabs.length) % tabs.length;
        tabs[next].focus();
        open(next, true);
      });
      return tab;
    });
    bar.append(glow, ...tabs);
    record.prepend(bar);

    let current = -1;
    function place() {
      const tab = tabs[current];
      if (!tab) return;
      glow.style.width = `${tab.offsetWidth}px`;
      glow.style.transform = `translateX(${tab.offsetLeft}px)`;
    }
    function open(index, remember) {
      if (index === current) return;
      current = index;
      tabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
      });
      panels[index].classList.remove("is-shown");
      requestAnimationFrame(() => panels[index].classList.add("is-shown"));
      place();
      if (remember) {
        const hash = index ? `#${panels[index].dataset.panel}` : location.pathname + location.search;
        history.replaceState(null, "", hash);
      }
      if (window.__NEMO_SHELF__) mount();
      else loadData();
    }

    const fromHash = panels.findIndex((panel) => `#${panel.dataset.panel}` === location.hash);
    open(Math.max(fromHash, 0), false);
    window.addEventListener("resize", place);
    if (document.fonts?.ready) document.fonts.ready.then(place);
  }

  let loading = false;
  function loadData() {
    if (window.__NEMO_SHELF__) return mount();
    if (loading) return;
    loading = true;
    const script = document.createElement("script");
    script.src = self.replace(/shelf\.js/, "nemo-shelf-data.js");
    script.addEventListener("load", mount);
    document.body.append(script);
  }

  const record = document.querySelector("[data-nemo-record]");
  if (record) setupRecord(record);
  else loadData();
})();
