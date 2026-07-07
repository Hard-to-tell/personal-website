# 网站修改速查

## 常用内容

站名、昵称和简介在 `_config.yml`：

```yaml
title: 在流放地
subtitle: ""
description: ""
author: Nemo
```

## 主题颜色

打开 `_config.reimu.yml`，搜索 `internal_theme`。

- `--red-1` 是主要强调色。
- `--red-2` 是悬停和次级强调色。
- `--red-3` 是边框和浅色强调。
- `--red-4` 到 `--red-6` 是越来越浅的背景色。
- 变量名称来自 Reimu 主题；即使名称带 `red`，也可以填写任意颜色。

修改后重启本地服务器即可看到效果。

## 横幅

当前横幅文件：

`source/images/site-banner.jpg`

主题引用位置在 `_config.reimu.yml`：

```yaml
banner: /images/site-banner.jpg
cover: /images/site-banner.jpg
```

可以用同名图片直接替换，也可以修改这里的路径。

## 头像

当前头像文件：

`source/_data/avatar/avatar.svg`

主题引用位置：

```yaml
avatar: avatar.svg
```

## 写文章

本地文章位于 `source/_posts`。部署到 GitHub 后，可以使用根目录的 `.pages.yml` 接入 Pages CMS，在浏览器中编辑文章。

## 本地预览

```powershell
cd C:\Users\nemos\Desktop\Projects\website
npm.cmd run dev
```

访问 `http://127.0.0.1:4000/`。
