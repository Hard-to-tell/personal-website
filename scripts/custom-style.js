const fs = require("node:fs");
const path = require("node:path");

hexo.extend.filter.register("before_generate", () => {
  const quietOptions = hexo.theme.config.quiet_firework_options;
  if (quietOptions && hexo.theme.config.firework) {
    hexo.theme.config.firework.options = quietOptions;
  }
});

hexo.extend.injector.register(
  "head_end",
  () => `<link rel="stylesheet" href="${hexo.config.root}css/custom.css">`,
  "default"
);

hexo.extend.injector.register(
  "body_end",
  () => {
    const photosDir = path.join(hexo.source_dir, "images", "photos");
    const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
    const maxBytes = 2 * 1024 * 1024;
    const wallpapers = fs.existsSync(photosDir)
      ? fs
          .readdirSync(photosDir, { withFileTypes: true })
          .filter((entry) => entry.isFile())
          .filter((entry) => supported.has(path.extname(entry.name).toLowerCase()))
          .filter((entry) => fs.statSync(path.join(photosDir, entry.name)).size <= maxBytes)
          .map(
            (entry) =>
              `${hexo.config.root}images/photos/${encodeURIComponent(entry.name)}`
          )
          .sort()
      : [];

    if (wallpapers.length < 2) return "";

    const data = JSON.stringify(wallpapers).replace(/</g, "\\u003c");
    return `<script>window.__NEMO_WALLPAPERS__=${data};</script><script defer src="${hexo.config.root}js/wallpaper-rotator.js"></script>`;
  },
  "default"
);
