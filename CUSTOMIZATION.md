# 网站修改速查

这份文档只回答“以后自己怎么改”。修改配置或图片后，本地开发服务有时不会自动读取新配置；看不到变化时，停止服务并重新运行 `npm.cmd run dev`。

## 站名、昵称和简介

编辑 `_config.yml`：

```yaml
title: 在流放地
subtitle: ""
description: ""
author: Nemo
```

网站简介目前有意留空。

## 更换头像

固定位置：

```text
source/_data/avatar/avatar.jpg
```

以后只要用新图片覆盖这个同名文件，不需要修改代码。建议：

- 正方形图片；
- JPG 格式；
- 至少 400×400；
- 文件尽量小于 500KB；
- 人物主体不要贴边，网页会显示为圆形。

主题引用位于 `_config.reimu.yml`：

```yaml
avatar: avatar.jpg
```

## 顶部壁纸轮换

壁纸目录：

```text
source/images/photos/
```

支持 JPG、JPEG、PNG、WebP、AVIF。构建时会自动扫描目录，不需要每增加一张图就修改 JavaScript。

当前规则：

- 每 30 秒切换一次；
- 使用 1.2 秒淡入；
- 浏览器开启“减少动态效果”时不轮换；
- 单张超过 2MB 的图片不参与轮换，避免页面太慢；
- 文件名排序决定轮换顺序；
- 建议横图，比例接近 16:9，宽度 1920px 左右。

当前两张超过 9MB 的原图仍保存在仓库中，并通过 `_config.yml` 的 `ignore` 排除出线上网站。添加新壁纸前请确认自己拥有使用权；如果新图超过 2MB，先压缩再使用。

首张壁纸同时写在 `_config.reimu.yml` 的 `banner` 和 `cover` 中。更换首张时需要修改这两个路径。

轮换逻辑：`source/js/wallpaper-rotator.js`。自动扫描和注入：`scripts/custom-style.js`。

## 点击粒子

开关位于 `_config.reimu.yml` 的 `firework`，小粒子参数位于同文件的 `quiet_firework_options`。

当前是安静版本：6 个、2–5px、400–650ms；链接、按钮和输入框不会触发。完全关闭：

```yaml
firework:
  enable: false
```

注意：Reimu 默认会把主题配置中的数组拼接起来，而不是完整替换。`scripts/custom-style.js` 中的 `before_generate` 钩子负责用 `quiet_firework_options` 覆盖默认大粒子；不要删除这个钩子。

## 主题颜色

打开 `_config.reimu.yml`，搜索 `internal_theme`。

- `--red-1`：主要强调色；
- `--red-2`：悬停和次级强调；
- `--red-3`：边框和浅强调；
- `--red-4` 至 `--red-6`：逐渐变浅的背景色。

变量名来自 Reimu，即使叫 `red` 也可以填写蓝色。当前使用偏暗的蓝色系。

## 鼠标指针

文件位于 `source/images/cursor/`：

- `miku-normal.cur`：普通区域；
- `miku-link.cur`：链接和按钮；
- `miku-text.cur`：文本输入。

素材来自《HATSUNE MIKU: COLORFUL STAGE!》官网提供的 Virtual Singer Static Cursor。对应配置是 `_config.reimu.yml` 的 `reimu_cursor`。将 `enable` 改为 `false` 可恢复系统指针。

## 写文章

### 在线编辑

打开 <https://app.pagescms.org/>，登录 GitHub，选择 `Hard-to-tell/personal-website`。保存文章会提交到 GitHub，并自动部署网站。

### 本地编辑

文章位于 `source/_posts/`，格式是 Markdown。完成后提交：

```powershell
git add .
git commit -m "Add article"
git push
```

## 页面位置

- 关于：`source/about/index.md`
- 友链：`source/friend/index.md`
- 留言板说明：`source/message/index.md`

留言功能由 Twikoo 提供，后端地址在 `_config.reimu.yml` 的 `twikoo.envId`。该地址可以公开；不能公开的是 MongoDB 连接字符串。
