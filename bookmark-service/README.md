# 友链书签管理

友链页公开展示收藏；站长通过 GitHub 登录后，可新增多层书签夹、添加/编辑/移动/删除书签、改名或移动书签夹。只允许删除空书签夹。暂不包含拖拽、批量操作或 Chrome 同步。

## 当前代码与上线开关

网站仍由 GitHub Pages 发布。此目录是**独立的 Netlify API 项目**，不要用它覆盖现有 Twikoo 项目 `keen-sopapillas-38639e`。API 使用 `bookmarks-api.exileland.online`，MongoDB 使用独立数据库 `nemo_bookmarks`，不写留言集合。

`_config.yml` 的 `bookmarks.api_origin` 默认留空。在完成下面配置、迁移和联调前保持为空；页面仍展示旧收藏，点击管理会说明尚未启用。此时不能在线编辑。Pages CMS 的旧书签清单入口已移除，避免启用后产生两份不同数据；原始 `source/_data/friends.yml` 保留作迁移来源和明确标记的离线旧副本。

## 本地检查与预览

在仓库根目录 `C:\Users\nemos\Documents\website\personal-website` 执行：

```powershell
npm.cmd --prefix bookmark-service ci
npm.cmd run test:bookmarks
npm.cmd --prefix bookmark-service run migrate
npm.cmd run verify
npm.cmd run preview:bookmarks
```

检查应全部通过，迁移检查应显示 52 个书签、6 个书签夹。浏览器打开 `http://127.0.0.1:4173/friend/`。此预览只监听本机，点击“管理”会**模拟登录**，书签保存到进程内存，重启即恢复原始收藏，绝不写生产数据库。模拟代码不在 Netlify 函数依赖中。使用 `Ctrl+C` 停止。

## 首次上线顺序

1. 在现有 Netlify 账号内新建独立项目，从 `Hard-to-tell/personal-website` 导入。仓库根目录的 `netlify.toml` 已配置安装命令、发布目录、函数目录和 `/api/*` 路由。不要把 base directory 改为 `bookmark-service`。
2. 将 API 自定义域名设为 `bookmarks-api.exileland.online`，在域名服务商为 `bookmarks-api` 创建指向这个**新项目实际 Netlify 域名**的 CNAME，并等待 HTTPS 证书就绪。不要改网站根域名或留言服务域名。
3. 在 GitHub Settings → Developer settings → OAuth Apps 新建专用 OAuth 应用。主页填 `https://exileland.online/friend/`，回调填 `https://bookmarks-api.exileland.online/auth/callback`。应用只用于身份验证，不申请 repo、email 等权限。保存生成的 Client ID 和 Client Secret 到 Netlify 的私密环境配置。
4. 按 `.env.example` 配置下表变量，并重新部署 API。秘密不能写进前端配置、Git 或聊天。
5. 在受保护的本地环境中配置 `MONGODB_URI` 和 `BOOKMARK_DB`，运行迁移写入。只有 `--apply` 才写数据库；初始化使用 `$setOnInsert`，重复执行不会覆盖在线修改。
6. 访问 API 的 `/api/bookmarks`，确认 52 个书签和 6 个文件夹。再将 `_config.yml` 中 `bookmarks.api_origin` 改成 `https://bookmarks-api.exileland.online`，完成本地构建检查后发布 GitHub Pages。
7. 在线完成下方验收。功能上线以真实 GitHub 登录、数据库保存和跨设备刷新成功为准，本地模拟预览不能代替线上验证。

| Netlify 环境变量 | 值/用途 |
| --- | --- |
| `BOOKMARK_SITE_ORIGIN` | `https://exileland.online` |
| `BOOKMARK_API_ORIGIN` | `https://bookmarks-api.exileland.online` |
| `GITHUB_CLIENT_ID` | 专用 OAuth 应用的 Client ID |
| `GITHUB_CLIENT_SECRET` | 同一应用的秘密，限服务端使用 |
| `GITHUB_ADMIN_ID` | `141892449`，已核对对应 `Hard-to-tell` 的稳定数字编号 |
| `MONGODB_URI` | 现有 Atlas 实例的连接串，数据库用户须有独立书签库的读写权限 |
| `BOOKMARK_DB` | `nemo_bookmarks` |

本地可将变量保存在被 Git 忽略的 `bookmark-service/.env`，不要覆盖已有配置文件；使用 Node 22 或更新版本。在仓库根目录运行：

```powershell
# 先进行只读迁移检查；成功后再执行下一条。
node bookmark-service/tools/migrate.cjs
node --env-file=bookmark-service/.env bookmark-service/tools/migrate.cjs --apply
```

预期第一次显示“初始化成功”，再次运行显示“目录已经存在，未覆盖任何数据”。迁移失败时不要启用前端开关。

## 接口和保护

- `GET /api/bookmarks`：返回 `{ version, nodes }`，公开只读。节点含 `id/type/parentId/title`，书签另有 `url/note`；数组顺序即创建顺序。
- `PUT /api/bookmarks`：提交 `{ version, operation }`；操作为 `create`（`node`）、`update`（`id/changes`）、`delete`（`id`）。不开放整树覆盖或任意数据库查询。
- `GET /api/auth/login`、`GET /auth/callback`：GitHub OAuth state + PKCE；仅接受配置的用户数字编号。GitHub token 不发送给浏览器，也不保存在数据库或日志。
- `GET /api/session`：返回登录状态，站长会话额外返回 CSRF token；`POST /api/auth/logout` 撤销服务端会话。
- 会话为随机、不透明、7 天有效的 `__Host-` Cookie，设置 Secure、HttpOnly、SameSite=Lax。数据库只保存会话标识的哈希。OAuth 临时状态 10 分钟有效且只能消费一次。数据库 TTL 清理之外，每次读取也检查有效期。
- 写入必须同时通过管理员会话、精确 Origin 和 CSRF 校验。CORS 不接受通配来源。API 必须部署在网站的 HTTPS 子域名，不能直接用 `*.netlify.app` 作为前端地址。
- 数据版本通过 MongoDB 单文档条件更新；过期或竞争写入返回 409。前端保留表单输入，提供刷新目录后再次保存。断网或超时不提示保存成功，恢复后先刷新核对。
- 限制为 5000 个节点、最多 32 层、单次提交 16KB；仅接受不含凭据的 HTTP/HTTPS 链接。空夹删除、循环引用和父目录存在性均由服务端验证。

## 验收与回退

- 未登录能展开文件夹和打开书签，不能修改；其他 GitHub 账号不能获得管理权限。
- 创建“测试夹 → 子夹”，粘贴网址保存，修改名称，移到另一个夹；刷新后仍存在。
- 非空夹不能删除；删除书签要确认，取消不修改；清空后可删除测试文件夹。
- 两个页面同时编辑时后保存者收到冲突提示；刷新目录保留输入，不悄悄覆盖另一页面的新版本。
- 模拟断网、会话过期；检查错误说明和重试。退出后旧 Cookie 不能再次写入。
- 检查 390px 手机布局、深浅主题、键盘 Tab/Escape、站内切换离开友链再返回；无重复绑定和横向溢出。
- 完成线上保存后，用另一设备或无痕窗口刷新，确认公开内容一致。

上线后的书签存在 MongoDB，**日常修改不会写回 GitHub**。定期备份至仓库外的私密目录（命令要求目标文件不存在）：

```powershell
node --env-file=bookmark-service/.env bookmark-service/tools/backup.cjs C:\Users\nemos\Documents\bookmarks-backup.json
```

回退界面时先备份数据库，再把 `bookmarks.api_origin` 留空并重新发布；会显示旧版收藏。不要删除书签数据库，也不要重新导入旧 YAML 覆盖在线数据。数据库故障恢复后可重新启用 API 地址。

实现依据：[GitHub OAuth 官方文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)、[Netlify Functions](https://docs.netlify.com/build/functions/lambda-compatibility/)、[MongoDB 原子更新](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)。
