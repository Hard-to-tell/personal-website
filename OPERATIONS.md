# 部署、额度与维护手册

更新时间：2026-07-08。平台规则可能变化，额度以各平台控制台和官方文档为准。

## 架构

| 部分 | 服务 | 保存什么 | 当前地址或标识 |
|---|---|---|---|
| 源代码和文章 | GitHub | Git 仓库、Markdown、图片和配置 | `Hard-to-tell/personal-website` |
| 网站前端 | GitHub Pages | Hexo 生成的静态 HTML/CSS/JS | <https://hard-to-tell.github.io/personal-website/> |
| 在线写作 | Pages CMS | 通过 GitHub 修改文章 | <https://app.pagescms.org/> |
| 留言后端 | Netlify Functions | Twikoo 云函数 | `keen-sopapillas-38639e.netlify.app` |
| 留言数据 | MongoDB Atlas | 评论和 Twikoo 配置 | `Cluster0`，默认数据库 `test` |

访问网站时，GitHub Pages 返回静态页面；只有加载或发送留言时，浏览器才调用 Netlify，Netlify 再访问 MongoDB。这里没有一台需要自己开机、升级系统的传统服务器。

## 当前免费额度

### GitHub Pages

- 发布后的网站最大 1GB；
- 源仓库建议不超过 1GB；
- 每月软性带宽限制 100GB；
- 单次部署最长 10 分钟。

官方说明：<https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>

### Netlify

- 新版 Free 计划：每月 300 credits，硬上限，不会自动产生费用；
- 每次生产部署 15 credits；
- 计算：10 credits / GB·小时；
- 带宽：20 credits / GB；
- 请求：每 10,000 次 2 credits；
- Twikoo 函数默认每次最多使用 1GB 内存；
- 同步执行最长 60 秒；
- 普通请求/响应载荷最大 6MB。

达到免费上限时项目会暂停到下个计费周期，不会自动扣款。避免无意义地反复重新部署 Netlify；日常文章发布只部署 GitHub Pages，不消耗 Netlify 生产部署额度。

官方说明：

- <https://www.netlify.com/pricing/>
- <https://docs.netlify.com/build/functions/configuration/>

### MongoDB Atlas Free

- 存储 0.5GB；
- 最多 500 个连接；
- 每秒最多约 100 次读写操作；
- 滚动 7 天内，流入和流出各 10GB；
- 30 天没有连接时可能自动暂停，可在控制台恢复；
- 免费层不能配置内存，也没有自动备份。

这些额度对个人留言板通常足够。官方说明：<https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/>

## 自动部署

向 GitHub 的 `main` 分支推送后，`.github/workflows/pages.yml` 会：

1. 安装依赖；
2. 用 `_config.yml` 和 `_config.pages.yml` 构建；
3. 上传到 GitHub Pages。

查看部署：仓库页面 → `Actions` → `Deploy Hexo site to Pages`。

本地构建成功不等于线上一定成功，最终以 GitHub Actions 绿色完成和线上页面实际响应为准。

## 购买并绑定域名

推荐看续费价格，不只看第一年促销价。`.com` 通用性最好；国内注册商支付和实名认证更方便。

当前托管在境外 GitHub Pages，域名仍需要实名认证，但不使用中国大陆服务器时通常不需要 ICP 备案。参考：<https://cloud.tencent.com/document/product/242/18621/>

买好后按以下流程：

1. 在 GitHub 仓库 `Settings → Pages → Custom domain` 填写域名；
2. 在域名 DNS 控制台添加 `www` 的 `CNAME`，指向 `hard-to-tell.github.io`；
3. 主域名添加 GitHub Pages 的四个 `A` 记录：
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. 修改 `_config.pages.yml`：把 `url` 换成新域名，把 `root` 改为 `/`；
5. DNS 生效后开启 `Enforce HTTPS`；
6. 完整检查首页、文章、图片、留言和 Pages CMS。

GitHub 官方步骤：<https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>

域名过期后可能被别人注册。即使不续费，默认 GitHub Pages 地址和仓库代码仍可保留。

## 密钥与安全

- Netlify 环境变量名：`MONGODB_URI`；值必须标记为 Secret；
- 仓库中只记录变量名，不记录值；
- MongoDB Network Access 当前允许 `0.0.0.0/0`，因为 Netlify 出口 IP 不固定；安全主要依赖强数据库密码；
- Twikoo 管理入口公开不是漏洞，管理操作仍需要管理员密码；
- 管理密码和数据库密码不要复用；
- 密码或连接字符串泄露后，立即在 MongoDB Atlas 重置数据库用户密码，再更新 Netlify Secret 并重新部署。

## 备份与停运

### 代码和文章

GitHub 仓库是主要备份。本地目录也保留一份。重要改动完成后及时提交和推送。

`source/images/photos/` 中两张超过 9MB 的原图由 `_config.yml` 的 `ignore` 排除，不会进入线上构建，但仍会随 Git 仓库保存。

### 留言

留言不在 GitHub，在 MongoDB Atlas 的 `test` 数据库。Free 层没有自动备份，建议每月或重要留言后从 Atlas Data Explorer 导出集合，保存到本地非公开目录。导出文件不要提交到公开仓库，其中可能含访客邮箱。

### 停止运营

- 不续费域名：自定义域名失效，但默认 GitHub Pages 地址仍可用；
- 不再维护 Netlify：静态文章仍在，留言功能会失效；
- MongoDB 长期无访问可能自动暂停，恢复后可继续使用；
- 重新上线时，恢复域名/DNS、Netlify Secret 和 MongoDB Network Access 即可。

## 常见问题

### `npm error ENOENT ... package.json`

终端目录错误：

```powershell
cd C:\Users\nemos\Desktop\Projects\website
npm.cmd run dev
```

### 修改配置后本地页面没变化

停止开发服务，然后：

```powershell
npm.cmd run clean
npm.cmd run dev
```

浏览器再按 `Ctrl + F5`。

### 点击粒子参数变成两套或数值被拼接

Reimu 合并主题配置时会拼接数组。项目使用 `scripts/custom-style.js` 的 `before_generate` 钩子，把 `_config.reimu.yml` 中的 `quiet_firework_options` 整体覆盖到主题配置。修改粒子时保留这个钩子，并在完整构建后检查生成的 `public/index.html`。

### 留言框不出现

依次检查：

1. 直接打开 Netlify 函数地址，是否显示“Twikoo 云函数运行正常”；
2. Netlify 的 `MONGODB_URI` 是否存在；
3. MongoDB 是否有数据库用户；
4. Network Access 是否存在 `0.0.0.0/0`；
5. `_config.reimu.yml` 的 `twikoo.envId` 是否正确；
6. GitHub Actions 是否部署成功。

### Netlify 主页面能开，但函数一直超时

通常是 MongoDB 用户、密码、连接字符串或 Network Access 配置错误，不需要重新创建整个 Netlify 项目。

### 线上还是旧图片或旧光标

先确认 GitHub Actions 已完成，再按 `Ctrl + F5`。网站使用 Service Worker，普通刷新可能仍读到旧缓存。
