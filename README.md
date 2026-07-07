# 在流放地

Nemo 的个人网站。它是一个以文章为主、带公开留言板的静态博客，视觉方向是安静的二次元风格。

## 当前状态

- 线上网站：<https://hard-to-tell.github.io/personal-website/>
- GitHub 仓库：<https://github.com/Hard-to-tell/personal-website>
- 在线文章编辑：<https://app.pagescms.org/>
- 前端：Hexo 8 + Reimu 1.12
- 托管：GitHub Pages
- 留言：Twikoo + Netlify Functions + MongoDB Atlas
- 访客不需要注册账号；填写昵称和邮箱即可留言

## 第一次在本地运行

在 PowerShell 中执行：

```powershell
cd C:\Users\nemos\Desktop\Projects\website
npm.cmd install
npm.cmd run dev
```

然后打开 <http://127.0.0.1:4000/>。

以后依赖没有变化时，不需要重复执行 `npm.cmd install`，直接运行：

```powershell
npm.cmd run dev
```

停止本地服务：在终端按 `Ctrl + C`。

## 常用命令

```powershell
# 本地预览
npm.cmd run dev

# 清理缓存后完整构建
npm.cmd run clean
npm.cmd run build

# 查看改动
git status
```

出现 `Could not read package.json` 时，通常是终端不在项目目录。先执行上面的 `cd` 命令。

## 主要目录

| 位置 | 用途 |
|---|---|
| `source/_posts/` | Markdown 文章 |
| `source/about/` | 关于页面 |
| `source/friend/` | 友链页面 |
| `source/message/` | 留言板页面 |
| `source/_data/avatar/avatar.jpg` | 站长头像，直接替换同名文件即可 |
| `source/images/photos/` | 顶部轮换壁纸 |
| `source/css/custom.css` | 自定义视觉效果 |
| `source/js/wallpaper-rotator.js` | 壁纸轮换逻辑 |
| `_config.yml` | Hexo 基础配置 |
| `_config.reimu.yml` | Reimu 主题和留言配置 |
| `_config.pages.yml` | GitHub Pages 线上地址配置 |
| `.pages.yml` | Pages CMS 在线编辑配置 |

## 继续阅读

- [CUSTOMIZATION.md](CUSTOMIZATION.md)：换头像、壁纸、颜色、光标，写文章
- [OPERATIONS.md](OPERATIONS.md)：部署架构、免费额度、域名、安全、备份和排错
- [REQUIREMENTS.md](REQUIREMENTS.md)：当前需求、设计偏好和暂不实现的功能

## 安全规则

- 不要把 MongoDB 密码或完整 `MONGODB_URI` 写进代码、截图或聊天。
- `MONGODB_URI` 只保存在 Netlify 的 Secret 环境变量中。
- 密钥一旦泄露，立即去对应平台重置；仅仅删除聊天内容不够。
- GitHub 仓库保存代码和文章，MongoDB 单独保存留言，二者要分别备份。
