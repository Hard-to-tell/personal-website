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

## 菜单图标

首页、归档、关于和友链页的图标位于 `source/images/icons`，对应关系在 `_config.reimu.yml` 的 `menu` 中。可以直接替换同名 SVG，也可以改成其他图片路径。

## 鼠标指针

鼠标指针位于 `source/images/cursor`：

- `nemo-default.svg`：普通指针
- `nemo-pointer.svg`：链接和按钮
- `nemo-text.svg`：文本输入

对应路径在 `_config.reimu.yml` 的 `reimu_cursor` 中。将 `enable` 改为 `false` 可以恢复系统默认指针。

## 写文章

本地文章位于 `source/_posts`。部署到 GitHub 后，可以使用根目录的 `.pages.yml` 接入 Pages CMS，在浏览器中编辑文章。

网页编辑入口：`https://app.pagescms.org/`

第一次使用需要登录 GitHub、安装 Pages CMS GitHub App，并选择 `Hard-to-tell/personal-website`。保存文章后会直接提交到 GitHub，随后自动部署网站。

## 留言板

留言页面位于 `source/message/index.md`。评论使用 Twikoo；后端部署完成后，把 Netlify 地址填到 `_config.reimu.yml` 的 `twikoo.envId` 即可启用。

## 本地预览

```powershell
cd C:\Users\nemos\Desktop\Projects\website
npm.cmd run dev
```

访问 `http://127.0.0.1:4000/`。
