const fs = require("node:fs");
const path = require("node:path");

const publicDir = path.resolve("public");
const origin = "https://exileland.online";
const errors = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function existsForPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }

  const relative = decoded.replace(/^\/+/, "");
  if (!relative) return fs.existsSync(path.join(publicDir, "index.html"));

  const direct = path.join(publicDir, relative);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return true;

  return fs.existsSync(path.join(direct, "index.html"));
}

const requiredRoutes = [
  "index.html",
  "404.html",
  "about/index.html",
  "archives/index.html",
  "friend/index.html",
  "games/calibration/index.html",
  "message/index.html",
  "images/og.png",
];

requiredRoutes.forEach((route) => {
  if (!fs.existsSync(path.join(publicDir, route))) {
    errors.push(`缺少关键页面：${route}`);
  }
});

const htmlFiles = walk(publicDir).filter((filename) => filename.endsWith(".html"));

htmlFiles.forEach((filename) => {
  const relative = path.relative(publicDir, filename).replaceAll("\\", "/");
  const html = fs.readFileSync(filename, "utf8");
  const pageUrl = `${origin}/${relative.replace(/index\.html$/, "")}`;

  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) {
    errors.push(`${relative} 缺少页面语言`);
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(match[0])) {
      errors.push(`${relative} 存在没有 alt 的图片：${match[0].slice(0, 120)}`);
    }
  }

  for (const match of html.matchAll(/\b(?:href|src|data-src)\s*=\s*["']([^"']+)["']/gi)) {
    const value = match[1].trim();
    if (
      !value ||
      value.startsWith("#") ||
      value.startsWith("//") ||
      /^(?:data|mailto|tel|javascript):/i.test(value)
    ) {
      continue;
    }

    let target;
    try {
      target = new URL(value, pageUrl);
    } catch {
      errors.push(`${relative} 包含无法解析的链接：${value}`);
      continue;
    }

    if (target.origin === origin && !existsForPath(target.pathname)) {
      errors.push(`${relative} 指向不存在的站内资源：${value}`);
    }
  }
});

const homepage = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
if (!/<meta name="description" content="[^"]+">/i.test(homepage)) {
  errors.push("首页缺少 description 元数据");
}
if (!/<meta property="og:image" content="https:\/\/exileland\.online\/images\/og\.png">/i.test(homepage)) {
  errors.push("首页没有使用站点专属的分享预览图");
}
if (!/<meta name="twitter:card" content="summary_large_image">/i.test(homepage)) {
  errors.push("首页缺少大图分享卡片元数据");
}
if (/pace(?:\.min)?\.js/i.test(homepage)) {
  errors.push("首页仍加载重复的 Pace 进度库");
}

const publishedPhotoOriginals = walk(path.join(publicDir, "images", "photos")).filter(
  (filename) => path.extname(filename).toLowerCase() === ".jpg"
);
if (publishedPhotoOriginals.length) {
  errors.push(`线上构建仍包含 ${publishedPhotoOriginals.length} 张壁纸 JPG 原图`);
}

if (errors.length) {
  console.error(`站点检查失败，共 ${errors.length} 项：`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`站点检查通过：${htmlFiles.length} 个页面，关键路由与站内资源均有效。`);
}
