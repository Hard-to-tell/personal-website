# 网站维护手册

这份文档写给以后维护网站的自己。它尽量不假设你懂 Hexo、主题、部署和 Pages CMS，只告诉你“想改某件事时应该点哪里、改哪个文件、注意什么”。

项目位置：

```text
C:\Users\nemos\Desktop\Projects\website
```

线上编辑入口：

```text
https://app.pagescms.org/
```

仓库：

```text
Hard-to-tell/personal-website
```

修改配置、图片或文档后，本地开发服务有时不会自动读到新内容。看不到变化时，先在终端按 `Ctrl + C` 停止服务，再重新运行：

```powershell
npm.cmd run dev
```

## 最常用操作速查

| 想做什么 | 去哪里改 | 最简单做法 |
|---|---|---|
| 在线写文章 | Pages CMS 的“文章” | 新建文章，填标题、时间、正文，保存 |
| 本地写文章 | `source/_posts/` | 复制已有 `.md` 文章，改标题和正文 |
| 换头像 | `source/_data/avatar/avatar.jpg` | 用新 JPG 覆盖同名文件 |
| 换顶部壁纸 | `source/images/photos/` | 放入压缩后的横图 |
| 改站名 | `_config.yml` | 修改 `title` |
| 改导航、主题、留言 | `_config.reimu.yml` | 搜索对应配置项再改 |
| 本地预览 | PowerShell | `npm.cmd run dev` |
| 发布上线 | GitHub | 保存或 push 到 `main` 后自动部署 |

不要直接修改 `public/` 里的文件。`public/` 是 Hexo 构建出来的成品，下次构建会被覆盖。真正的源内容在 `source/`、`_config.yml`、`_config.reimu.yml`、`.pages.yml` 这些文件里。

## 在线写文章

适合平时最省事地写文章，不需要打开代码编辑器。

1. 打开 <https://app.pagescms.org/>。
2. 用 GitHub 登录。
3. 选择仓库 `Hard-to-tell/personal-website`。
4. 左侧选择“文章”。
5. 点击新建文章。
6. 填表：
   - `标题`：文章标题，可以直接写中文。
   - `发布时间`：默认当前时间即可；想控制排序时再改。
   - `分类`：大分类，建议只写 1 个，例如 `日常`、`读书`、`建站`。
   - `标签`：更细的关键词，可以写多个，例如 `Hexo`、`动画`、`摘录`。
   - `摘要`：可选，不会写就留空。
   - `封面`：可选，没有合适图片就留空。
   - `正文`：文章内容。可以直接写，也可以用 Markdown。
7. 点击保存。
8. 保存后 Pages CMS 会把修改提交到 GitHub。
9. GitHub Pages 会自动部署，通常等几十秒到几分钟再刷新网站。

现在新文章文件名会自动生成，类似：

```text
source/_posts/2026-07-09-132501.md
```

你不需要自己填写文件名，也不需要给中文标题想英文 slug。

如果首页只想显示文章前半段，在正文里放这一行：

```markdown
<!-- more -->
```

这行之前的内容会作为首页摘要，点“继续阅读”后才看到后面内容。

## 保存报错怎么办

如果写文章时看到类似：

```text
Invalid extension "" for content "posts".
```

意思是 Pages CMS 保存文章时，算出来的文件扩展名是空的。这个站点的文章必须是 `.md` 文件，否则 Hexo 不会按 Markdown 文章处理。

这次已经把 `.pages.yml` 里的文章文件名规则改成自动时间文件名：

```yaml
filename:
  template: "{year}-{month}-{day}-{hour}{minute}{second}.md"
  field: false
```

修复后，正常情况下不会再因为中文标题或空文件名触发这个报错。

如果 Pages CMS 还报同样错误，按顺序处理：

1. 刷新 Pages CMS 页面。
2. 退出这篇文章，回到“文章”列表后重新新建。
3. 确认仓库里最新 `.pages.yml` 已经包含上面的 `filename` 配置。
4. 如果刚改完配置，等 GitHub 同步几分钟再试。

不要为了绕过这个错误去创建没有后缀的文件。文章文件必须以 `.md` 结尾。

## 本地写文章

文章都在：

```text
source/_posts/
```

每篇文章就是一个 `.md` 文件。最稳的方法是复制已有文章，比如：

```text
source/_posts/hello.md
```

复制后改成一个新的文件名，例如：

```text
source/_posts/2026-07-09-note.md
```

文件开头的 `---` 到 `---` 之间叫 front matter，用来存标题、时间、分类、标签。示例：

```markdown
---
title: 新文章标题
date: 2026-07-09 13:25:00
categories:
  - 日常
tags:
  - 随笔
description: 这里写一句很短的摘要，也可以留空。
---

这里开始写正文。

<!-- more -->

这里是点进文章后才继续看到的内容。
```

写完后本地预览：

```powershell
cd C:\Users\nemos\Desktop\Projects\website
npm.cmd run dev
```

打开：

```text
http://127.0.0.1:4000/
```

确认没问题后提交：

```powershell
git add .
git commit -m "Add article"
git push
```

## 站名、作者和简介

编辑：

```text
_config.yml
```

常用位置：

```yaml
title: 在流放地
subtitle: ""
description: ""
author: Nemo
language: zh-CN
timezone: Asia/Shanghai
```

一般只需要改：

- `title`：网站名称。
- `subtitle`：副标题，不想显示就留空。
- `description`：网站简介，不想显示就留空。
- `author`：作者名。

改完配置后，建议重启本地服务再看效果。

## 更换头像

头像固定文件：

```text
source/_data/avatar/avatar.jpg
```

最简单做法：准备一张新头像，命名为 `avatar.jpg`，覆盖这个文件。

建议：

- 正方形图片；
- JPG 格式；
- 至少 400x400；
- 文件尽量小于 500KB；
- 人物主体不要贴边，因为网页会显示成圆形头像。

主题里引用头像的位置在：

```text
_config.reimu.yml
```

对应配置：

```yaml
avatar: avatar.jpg
```

如果只是替换同名头像，不需要改这行。

## 顶部壁纸轮换

壁纸目录：

```text
source/images/photos/
```

支持格式：

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.avif`

最简单做法：把新壁纸放进这个目录。构建时会自动扫描，不需要每加一张图就改 JavaScript。

当前规则：

- 每 30 秒切换一次；
- 使用 1.2 秒淡入；
- 浏览器开启“减少动态效果”时不轮换；
- 单张超过 2MB 的图片不参与轮换，避免页面太慢；
- 文件名排序决定轮换顺序；
- 建议横图，比例接近 16:9，宽度 1920px 左右。

如果新图超过 2MB，先压缩再放进来。图片太大会让首页加载很慢。

首张壁纸写在：

```text
_config.reimu.yml
```

相关配置：

```yaml
banner: /images/photos/2a98a3a47c6f1f59a31aad5cda6104f1.webp
cover: /images/photos/2a98a3a47c6f1f59a31aad5cda6104f1.webp
```

如果想指定第一张显示哪张，就把这两行改成同一个新路径。

轮换逻辑文件：

```text
source/js/wallpaper-rotator.js
```

自动扫描和注入逻辑：

```text
scripts/custom-style.js
```

平时换图不需要碰这两个脚本。

## 点击粒子

配置文件：

```text
_config.reimu.yml
```

搜索：

```yaml
firework:
```

完全关闭点击粒子：

```yaml
firework:
  enable: false
```

当前是安静版本：粒子数量少、尺寸小、持续时间短。链接、按钮和输入框不会触发粒子。

安静版参数在：

```yaml
quiet_firework_options:
```

注意：Reimu 默认会把主题配置里的数组拼接起来，而不是完整替换。`scripts/custom-style.js` 里的 `before_generate` 钩子负责用 `quiet_firework_options` 覆盖默认大粒子。不要删除这个钩子。

## 主题颜色

配置文件：

```text
_config.reimu.yml
```

搜索：

```yaml
internal_theme:
```

常用变量：

- `--red-1`：主要强调色；
- `--red-2`：悬停和次级强调；
- `--red-3`：边框和浅强调；
- `--red-4` 到 `--red-6`：逐渐变浅的背景色。

变量名来自 Reimu。即使叫 `red`，也可以填蓝色、绿色或别的颜色。当前网站使用偏暗的蓝色系。

改颜色时建议一次只改一两个值，保存后本地预览。全部一起改会很难判断是哪一项导致效果不好。

## 鼠标指针

文件目录：

```text
source/images/cursor/
```

当前三个指针文件：

- `miku-normal.cur`：普通区域；
- `miku-link.cur`：链接和按钮；
- `miku-text.cur`：文本输入。

配置文件：

```text
_config.reimu.yml
```

对应配置：

```yaml
reimu_cursor:
  enable: true
```

恢复系统默认指针：

```yaml
reimu_cursor:
  enable: false
```

当前素材来自《HATSUNE MIKU: COLORFUL STAGE!》官网提供的 Virtual Singer Static Cursor。更换素材前要确认可以使用。

## 页面位置

这些不是普通文章，而是固定页面：

| 页面 | 文件 |
|---|---|
| 关于 | `source/about/index.md` |
| 友链 | `source/friend/index.md` |
| 留言板说明 | `source/message/index.md` |

可以在 Pages CMS 里直接编辑，也可以本地改 Markdown 文件。

留言功能由 Twikoo 提供，后端地址在：

```text
_config.reimu.yml
```

搜索：

```yaml
twikoo:
```

当前 `twikoo.envId` 可以公开。不能公开的是 MongoDB 连接字符串、数据库密码、Netlify/GitHub token。

## 本地预览和构建

进入项目目录：

```powershell
cd C:\Users\nemos\Desktop\Projects\website
```

第一次运行或依赖变化后：

```powershell
npm.cmd install
```

本地预览：

```powershell
npm.cmd run dev
```

打开：

```text
http://127.0.0.1:4000/
```

停止本地预览：在终端按 `Ctrl + C`。

清理缓存并完整构建：

```powershell
npm.cmd run clean
npm.cmd run build
```

查看当前改了什么：

```powershell
git status
```

如果看到 `Could not read package.json`，通常是终端不在项目目录。先执行上面的 `cd` 命令。

## 不要碰什么

这些规则主要是避免把网站弄坏或泄露密钥：

- 不要把 MongoDB 密码或完整 `MONGODB_URI` 写进代码、文章、截图或聊天。
- 不要公开 Netlify、GitHub、MongoDB 的 token、secret、password。
- 不要直接修改 `public/` 作为源内容；它是构建产物，会被覆盖。
- 不要随便删除 `_config.yml`、`_config.reimu.yml`、`.pages.yml`。
- 不要删除 `source/_posts/`，这里是文章。
- 不要删除 `source/about/`、`source/friend/`、`source/message/`，这里是固定页面。
- 不要上传特别大的图片；壁纸尽量压到 2MB 以下。
- 不确定某个文件能不能删时，先不要删，查清楚再动。

## 推荐增加的内容板块

优先推荐低维护内容。原因很简单：个人网站最怕新增一个很复杂的板块，做完以后没有精力长期更新。

### 站点日志

记录网站每次改了什么，不需要写长文。

例子：

```markdown
## 2026-07-09

- 修复 Pages CMS 写文章保存失败。
- 把维护文档改得更详细。
- 调整文章文件名规则。
```

适合放在一篇长期更新的文章里，也可以以后做成单独页面。

### 书影音 / 游戏清单

维护成本低，也能体现个人兴趣。

每条只需要：

- 名称；
- 年份；
- 类型；
- 状态：想看、在看、看完、搁置；
- 一句话感想。

先用普通文章写就够了，不急着做复杂数据库。

### 收藏夹

保存喜欢的网页、工具、文章、视频、资源站。

建议每条都写一句“为什么收藏”，否则以后自己也想不起来。

格式示例：

```markdown
- [Pages CMS](https://pagescms.org/)：这个网站用来在线写文章。
- [Hexo](https://hexo.io/)：当前博客生成器。
```

### 照片墙（记录页）

照片墙在 `/about/`，导航上显示为“记录”。照片、日期和一句话存放在：

```text
source/_data/gallery.yml
```

平时只需要打开 Pages CMS，选择“照片墙”：新建一项后直接上传 JPG、PNG 或 WebP 原图，填写日期；“一句话”可留空。页面按月份筛选，保存后 GitHub Pages 会自动完成两步：

- 生成方形 WebP 缩略图，用在散乱叠放的照片墙；
- 生成压缩的原比例 WebP，鼠标移到照片上或手机点一下时显示，并同时出现文字和日期。

原图仅保存于仓库，不会直接发布到网站；无需在电脑上运行图片处理脚本。部署通常需要几十秒到几分钟，完成后刷新“记录”页即可。

### 留言精选 / 提问箱

等留言板真正有人用之后，可以整理一些有意思的留言或问题。

这个属于互动增强，维护成本比前几个高。建议后置，不要一开始就做复杂功能。
