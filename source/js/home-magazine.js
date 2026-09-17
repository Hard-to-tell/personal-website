(() => {
  if (!document.documentElement.classList.contains("nemo-home")) return;

  const main = document.querySelector("#main");
  const posts = main ? [...main.querySelectorAll(":scope > .post-wrapper")] : [];
  if (!main || !posts.length) return;

  const normalizePath = (value) => {
    const path = new URL(value, location.origin).pathname.replace(/index\.html$/, "");
    return path.endsWith("/") ? path : `${path}/`;
  };
  const config = window.__NEMO_HOME__ || {};
  const featuredPath = normalizePath(config.featuredPath || "/");
  const featured =
    posts.find((post) => {
      const link = post.querySelector(".post-link");
      return link && normalizePath(link.href) === featuredPath;
    }) || posts[0];
  const remaining = posts.filter((post) => post !== featured);

  const heading = (eyebrow, title, link) => {
    const header = document.createElement("header");
    header.className = "nemo-section-heading";
    header.innerHTML = `<p>${eyebrow}</p><h2>${title}</h2>${
      link ? `<a href="${link.href}">${link.label}<span aria-hidden="true"> →</span></a>` : ""
    }`;
    return header;
  };

  main.classList.add("nemo-magazine");
  featured.classList.add("nemo-featured-post");
  main.replaceChildren();

  const featuredSection = document.createElement("section");
  featuredSection.className = "nemo-featured";
  featuredSection.append(heading("FEATURED", "推荐"), featured);
  main.append(featuredSection);

  if (remaining.length) {
    const recent = document.createElement("section");
    recent.className = "nemo-recent";
    recent.append(heading("NOTES", "近来写下", { href: "/archives/", label: "查看归档" }));
    const list = document.createElement("div");
    list.className = "nemo-recent-list";
    remaining.forEach((post) => list.append(post));
    recent.append(list);
    main.append(recent);
  }

  const gallery = Array.isArray(config.gallery) ? config.gallery : [];
  if (gallery.length) {
    const photos = document.createElement("section");
    photos.className = "nemo-home-photos";
    photos.append(heading("FRAGMENTS", "最近的记录", { href: "/about/", label: "全部照片" }));
    const strip = document.createElement("div");
    strip.className = "nemo-home-photo-strip";
    gallery.forEach((item) => {
      const link = document.createElement("a");
      link.href = "/about/";
      link.className = "nemo-home-photo";
      const image = document.createElement("img");
      image.src = item.thumbnail;
      image.alt = item.note || `${item.date} 的照片记录`;
      image.loading = "lazy";
      const caption = document.createElement("span");
      const time = document.createElement("time");
      time.textContent = item.date;
      caption.append(time);
      if (item.note) {
        const note = document.createElement("b");
        note.textContent = item.note;
        caption.append(note);
      }
      link.append(image, caption);
      strip.append(link);
    });
    photos.append(strip);
    main.append(photos);
  }
})();
