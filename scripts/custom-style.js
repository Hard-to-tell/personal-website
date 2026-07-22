const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function createAssetVersion() {
  const hash = crypto.createHash("sha256");
  const files = [
    "scripts/custom-style.js",
    "source/css/custom.css",
    "source/js/ambient-player.js",
    "source/js/calibration-game.js",
    "source/js/comment-ux.js",
    "source/js/gallery-wall.js",
    "source/js/home-hero.js",
    "source/js/nemo-fun.js",
    "source/js/site-ux.js",
    "source/js/wallpaper-rotator.js",
    "source/_data/gallery.yml",
  ];

  files.forEach((filename) => {
    const absolute = path.join(hexo.base_dir, filename);
    if (!fs.existsSync(absolute)) return;
    hash.update(filename);
    hash.update(fs.readFileSync(absolute));
  });

  const musicDir = path.join(hexo.source_dir, "music");
  if (fs.existsSync(musicDir)) {
    fs.readdirSync(musicDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"))
      .forEach((entry) => {
        const stat = fs.statSync(path.join(musicDir, entry.name));
        hash.update(entry.name);
        hash.update(String(stat.size));
      });
  }

  return hash.digest("hex").slice(0, 10);
}

const assetVersion = createAssetVersion();
const versionedScript = (filename, defer = true) =>
  `<script${defer ? " defer" : ""} src="${hexo.config.root}js/${filename}?v=${assetVersion}"></script>`;

hexo.extend.filter.register("before_generate", () => {
  const quietOptions = hexo.theme.config.quiet_firework_options;
  if (quietOptions && hexo.theme.config.firework) {
    hexo.theme.config.firework.options = quietOptions;
  }
});

hexo.extend.injector.register(
  "head_end",
  () => {
    const root = JSON.stringify(hexo.config.root);
    return `<script>(()=>{const root=${root};const path=location.pathname.replace(/index\\.html$/,"");const base=root.endsWith("/")?root:root+"/";document.documentElement.classList.toggle("nemo-home",path===root);document.documentElement.classList.toggle("nemo-message",path===base+"message/");})();</script><link rel="stylesheet" href="${hexo.config.root}css/custom.css?v=${assetVersion}">`;
  },
  "default"
);

hexo.extend.injector.register(
  "body_begin",
  '<a class="nemo-skip-link" href="#main">跳到正文</a>',
  "default"
);

hexo.extend.injector.register(
  "body_end",
  () =>
    `${versionedScript("site-ux.js")}${versionedScript("nemo-music-data.js", false)}${versionedScript("ambient-player.js")}`,
  "default"
);

hexo.extend.injector.register(
  "body_end",
  () => `${versionedScript("home-hero.js")}${versionedScript("nemo-fun.js")}`,
  "home"
);

hexo.extend.injector.register(
  "body_end",
  () => `${versionedScript("nemo-fun.js")}${versionedScript("comment-ux.js")}`,
  "post"
);

hexo.extend.injector.register(
  "body_end",
  () =>
    `${versionedScript("comment-ux.js")}${versionedScript("nemo-gallery-data.js", false)}${versionedScript("gallery-wall.js")}`,
  "page"
);

hexo.extend.generator.register("nemo_music_data", () => {
  const musicDir = path.join(hexo.source_dir, "music");
  const supported = new Set([".flac", ".m4a", ".mp3", ".ogg", ".wav"]);
  const tracks = fs.existsSync(musicDir)
    ? fs
        .readdirSync(musicDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .filter((entry) => supported.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => ({
          title: path.basename(entry.name, path.extname(entry.name)),
          src: `${hexo.config.root}music/${encodeURIComponent(entry.name)}`,
        }))
        .sort((left, right) => left.title.localeCompare(right.title, "zh-CN"))
    : [];
  const payload = JSON.stringify(tracks).replace(/</g, "\\u003c");

  return {
    path: "js/nemo-music-data.js",
    data: `window.__NEMO_MUSIC__=${payload};`,
  };
});

hexo.extend.generator.register("nemo_gallery_data", () => {
  const data = hexo.locals.get("data") || {};
  const gallery = Array.isArray(data.gallery) ? data.gallery : [];
  const originalsPrefix = "/images/gallery/originals/";
  const entries = gallery
    .filter((entry) => entry && entry.image && entry.date)
    .map((entry) => {
      const image = String(entry.image);
      const filename = path.posix.basename(image);
      const extension = path.posix.extname(filename);
      const stem = filename.slice(0, -extension.length);
      const isOriginal = image.startsWith(originalsPrefix);

      return {
        thumbnail: isOriginal ? `/images/gallery/thumbs/${stem}.webp` : image,
        full: isOriginal ? `/images/gallery/full/${stem}.webp` : image,
        date: entry.date,
        note: entry.note ? String(entry.note) : "",
      };
    });
  const payload = JSON.stringify(entries).replace(/</g, "\\u003c");

  return {
    path: "js/nemo-gallery-data.js",
    data: `window.__NEMO_GALLERY__=${payload};`,
  };
});

hexo.extend.injector.register(
  "body_end",
  () => {
    const photosDir = path.join(hexo.source_dir, "images", "photos");
    const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
    const maxBytes = 2 * 1024 * 1024;
    const entries = fs.existsSync(photosDir)
      ? fs.readdirSync(photosDir, { withFileTypes: true })
      : [];
    const optimizedStems = new Set(
      entries
        .filter((entry) =>
          [".webp", ".avif"].includes(path.extname(entry.name).toLowerCase())
        )
        .map((entry) => path.basename(entry.name, path.extname(entry.name)))
    );
    const wallpapers = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => supported.has(path.extname(entry.name).toLowerCase()))
      .filter((entry) => {
        const extension = path.extname(entry.name);
        const stem = path.basename(entry.name, extension);
        return (
          [".webp", ".avif"].includes(extension.toLowerCase()) ||
          !optimizedStems.has(stem)
        );
      })
      .filter(
        (entry) => fs.statSync(path.join(photosDir, entry.name)).size <= maxBytes
      )
      .map(
        (entry) =>
          `${hexo.config.root}images/photos/${encodeURIComponent(entry.name)}`
      )
      .sort();

    if (wallpapers.length < 2) return "";

    const data = JSON.stringify(wallpapers).replace(/</g, "\\u003c");
    return `<script>window.__NEMO_WALLPAPERS__=${data};</script>${versionedScript("wallpaper-rotator.js")}`;
  },
  "home"
);

hexo.extend.filter.register("after_render:html", (html) => {
  const labels = [
    ['aria-label="Primary navigation"', 'aria-label="主导航"'],
    ['aria-label="Toggle navigation"', 'aria-label="切换导航"'],
    ['aria-label="Secondary navigation"', 'aria-label="辅助导航"'],
    ['aria-label="Site header"', 'aria-label="网站页眉"'],
    ['aria-label="Mobile navigation"', 'aria-label="移动端导航"'],
    ['aria-label="Language selection"', 'aria-label="语言选择"'],
    ['aria-label="Language menu"', 'aria-label="语言菜单"'],
    ['aria-label="Languages"', 'aria-label="语言列表"'],
    ['aria-label="Page content"', 'aria-label="页面内容"'],
    ['aria-label="Main content"', 'aria-label="主要内容"'],
    ['aria-label="Site footer"', 'aria-label="网站页脚"'],
    ['aria-label="Pagination navigation"', 'aria-label="分页导航"'],
    ['aria-label="Article navigation"', 'aria-label="文章导航"'],
    ['aria-label="Sidebar"', 'aria-label="侧栏"'],
  ];

  labels.forEach(([source, replacement]) => {
    html = html.replaceAll(source, replacement);
  });

  html = html.replace(
    `src="${hexo.config.root}js/calibration-game.js"`,
    `src="${hexo.config.root}js/calibration-game.js?v=${assetVersion}"`
  );

  return html.replace(
    /<img class="reimu-bg"(?![^>]*\balt=)([^>]*)>/g,
    (_tag, attributes) => {
      const suffix = attributes.trimEnd();
      const selfClosing = suffix.endsWith("/");
      const clean = selfClosing ? suffix.slice(0, -1).trimEnd() : suffix;
      return `<img class="reimu-bg"${clean} alt="" aria-hidden="true"${selfClosing ? " /" : ""}>`;
    }
  );
});
