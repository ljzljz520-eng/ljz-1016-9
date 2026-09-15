# 发布运维台（Release Ops Console）

网站发布运维台基础骨架：管理员登录、基于 Session 的会话管理，以及「发布记录 / 环境配置 / 访问日志」三个占位模块，可在此基础上直接扩展真实业务。

## 功能一览

- 管理员登录 / 退出（Session + HttpOnly Cookie，登录成功自动重建会话，退出销毁服务端会话并清理 Cookie）
- 登录限流（每 IP 每分钟 10 次），密码 scrypt 加盐哈希存储
- 控制台三个占位菜单：发布记录、环境配置、访问日志（前后端占位接口已连通）
- 统一 API 响应与错误格式、统一错误处理中间件
- 初始账号脚本（随机密码 / 指定密码 / 强制重置）

## 技术栈

- 后端：Node.js (>= 18) + Express 4 + express-session
- 前端：原生 HTML / CSS / JS（无构建步骤）
- 账号存储：JSON 文件（`data/users.json`，仅存密码哈希，权限 0600）

## 目录结构

```
├── server/               # 后端
│   ├── index.js          # 启动入口
│   ├── app.js            # Express 应用装配
│   ├── config.js         # 配置（自动加载 .env，系统环境变量优先）
│   ├── routes/           # auth（登录/退出/会话）与 modules（三个占位模块）
│   ├── middleware/       # 鉴权、限流、统一错误处理
│   ├── utils/            # 密码哈希、用户存储、ApiError
│   └── views/            # 登录页、控制台页（仅经路由分发，不做静态暴露）
├── public/assets/        # 静态资源（css / js）
├── scripts/init-admin.js # 初始账号脚本
├── data/                 # 运行期数据（users.json，勿提交）
└── .env.example          # 环境变量样例
```

## 快速开始（开发）

```bash
npm install                 # 安装依赖
npm run init:admin          # 创建管理员（默认 admin，打印随机初始密码）
npm run dev                 # 开发模式（文件变更自动重启）
# 打开 http://localhost:3000
```

指定账号密码 / 重置密码：

```bash
node scripts/init-admin.js --username admin --password 'Admin@123'
node scripts/init-admin.js --username admin --password 'NewPass456' --force
```

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 监听端口 |
| `NODE_ENV` | `development` | 生产设为 `production` |
| `SESSION_SECRET` | 内置开发值 | 会话签名密钥，**生产必须修改** |
| `SESSION_TTL_MS` | `7200000` | 会话有效期（毫秒，默认 2 小时） |
| `COOKIE_SECURE` | 生产默认 `true` | 是否仅通过 HTTPS 下发 Cookie |

复制 `.env.example` 为 `.env` 即可被自动加载（系统环境变量优先）。生成密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API 与统一错误格式

所有 `/api/*` 接口返回统一结构，成功：

```json
{ "code": 0, "message": "ok", "data": { } }
```

失败（HTTP 状态码与 `code` 同时非零）：

```json
{ "code": 40100, "message": "未登录或会话已过期", "data": null }
```

| code | HTTP | 含义 |
| --- | --- | --- |
| 0 | 200 | 成功 |
| 40000 | 400 | 请求参数错误 |
| 40100 | 401 | 未登录 / 会话已过期 |
| 40101 | 401 | 用户名或密码错误 |
| 40300 | 403 | 无权限 |
| 40400 | 404 | 资源不存在 |
| 41300 | 413 | 请求体过大 |
| 42900 | 429 | 请求过于频繁 |
| 50000 | 500 | 服务器内部错误 |

接口列表：

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 否 | 登录，body: `{"username","password"}` |
| POST | `/api/auth/logout` | 否 | 退出并销毁会话 |
| GET | `/api/auth/me` | 是 | 当前登录用户 |
| GET | `/api/releases` | 是 | 发布记录（占位） |
| GET | `/api/env-config` | 是 | 环境配置（占位） |
| GET | `/api/access-logs` | 是 | 访问日志（占位） |

页面路由：`/` 登录页（已登录自动跳 `/console`）；`/console` 控制台（未登录跳回 `/`）。

## 生产部署

1. 准备环境变量：

```bash
cp .env.example .env
# 编辑 .env：NODE_ENV=production、SESSION_SECRET=<随机串>、COOKIE_SECURE=true
```

2. 安装依赖、初始化账号并启动：

```bash
npm ci --omit=dev
npm run init:admin
npm start
```

### systemd 单元示例 `/etc/systemd/system/ops-console.service`

```ini
[Unit]
Description=Release Ops Console
After=network.target

[Service]
WorkingDirectory=/opt/ops-console
EnvironmentFile=/opt/ops-console/.env
ExecStart=/usr/bin/node server/index.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now ops-console
```

### Nginx 反向代理示例

```nginx
server {
    listen 443 ssl;
    server_name ops.example.com;
    # ssl_certificate     /etc/nginx/certs/ops.example.com.pem;
    # ssl_certificate_key /etc/nginx/certs/ops.example.com.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

应用已设置 `trust proxy`，可正确识别客户端 IP 与 HTTPS。

### 会话外置存储（多实例 / 重启不丢会话）

默认使用内存 SessionStore，仅适合单进程开发。生产建议 Redis：

```bash
npm install connect-redis redis
```

```js
// server/app.js 中替换 session 配置
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL });
client.connect();
app.use(session({ store: new RedisStore({ client }), /* 其余配置不变 */ }));
```

## 安全说明

- 密码使用 `scrypt` 加盐哈希存储，永不落盘明文
- 登录成功重建 Session（防会话固定）；退出销毁服务端会话并清理 Cookie
- Cookie：`HttpOnly` + `SameSite=Lax`，生产开启 `Secure`
- 登录接口内置限流；所有 `/api` 业务接口强制鉴权
- `data/users.json` 权限 0600，且已在 `.gitignore` 中排除
