# QuizMaster Pro 🧠

知识竞赛平台 — 答题赚金币、冲排行榜、Pro 会员无限畅玩。

## 项目结构

```
├── frontend/                 # Next.js 14 前端（部署到 Vercel）
├── backend/                  # Express.js API（部署到 Fly.io）
├── supabase/migrations/      # PostgreSQL 建表 SQL（在 Supabase 执行）
├── fly.toml                  # Fly.io 应用配置（根目录，构建 backend/Dockerfile）
└── README.md
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14、React 18、Tailwind CSS 3 |
| 后端 | Express 4、node-pg、JWT |
| 数据库 | PostgreSQL（Supabase 托管） |
| 部署 | 前端 Vercel、API Fly.io、数据库 Supabase |

---

## 快速启动（本地）

### 1. 数据库（PostgreSQL）

最简单方式是用根目录 Docker Compose（内置 Postgres）：

```bash
cp docker-compose.env.example .env
# 编辑 .env：JWT_SECRET、ALLOWED_ORIGINS
docker compose up -d --build
```

### 2. 建表并灌入题库

```bash
cd backend
cp .env.example .env
# DATABASE_URL=postgresql://quizmaster:quizmaster@localhost:5433/quizmaster
npm install
npm run db:migrate
npm run seed
```

### 3. 启动后端

```bash
cd backend
npm run dev
# http://localhost:5000/health
```

### 4. 启动前端

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

打开 **http://localhost:3000**。前端只调用 `NEXT_PUBLIC_API_URL` 下的 API，不再内置 Next.js Route Handlers。

---

## 生产部署：Vercel + Fly.io + Supabase

### Supabase

1. 新建项目，在 **SQL Editor** 中执行 `supabase/migrations/001_initial.sql`（或使用 **Table Editor** 等价建表）。
2. 在 **Project Settings → Database** 复制 **Connection string**（URI），端口 **5432**，密码用项目数据库密码。连接串建议带 `?sslmode=require`。

### Fly.io（后端 API）

1. 安装 CLI：[https://fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/)
2. `flyctl auth login`
3. 编辑根目录 `fly.toml`，将 `app = "quizmaster-api"` 改成你的全局唯一应用名。
4. 首次部署（在仓库根目录）：

```bash
flyctl launch --no-deploy --copy-config --dockerfile backend/Dockerfile --name <你的应用名>
flyctl secrets set DATABASE_URL="postgresql://..." JWT_SECRET="..." ALLOWED_ORIGINS="https://你的前端.vercel.app"
flyctl deploy
```

5. 部署后执行一次迁移与种子（可用 **SSH** 或本地指向同一 `DATABASE_URL`）：

```bash
# 本地（设置与 Fly 相同的 DATABASE_URL）
cd backend && npm run db:migrate && npm run seed
```

API 根地址形如：`https://<你的应用名>.fly.dev`。

### Vercel（前端）

1. 导入 Git 仓库，**Root Directory** 选 `frontend`。
2. 环境变量：`NEXT_PUBLIC_API_URL=https://<你的应用名>.fly.dev`（无尾部斜杠）。
3. 部署完成后，将 Fly 的 `ALLOWED_ORIGINS` 更新为 Vercel 生产域名（含 `https://`），再执行 `flyctl secrets set ALLOWED_ORIGINS=...` 或 `flyctl deploy` 前设置。

---

## 环境变量

### 后端（`backend/.env`）

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | Supabase / Postgres 连接 URI |
| `JWT_SECRET` | JWT 签名密钥 |
| `PORT` | 监听端口（默认 5000） |
| `ALLOWED_ORIGINS` | 允许跨域的前端来源，逗号分隔 |
| `NODE_ENV` | `production` 时 Cookie 为 `Secure` + `SameSite=None` |
| `PGSSLMODE` | 可选，设为 `disable` 可关闭 SSL（仅本地无 TLS 的 Postgres） |

### 前端（`frontend/.env.local`）

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_API_URL` | 后端 API 根 URL，生产环境必填 |

### Docker Compose（根目录 `.env`）

| 变量 | 说明 |
|---|---|
| `JWT_SECRET` | JWT 签名 |
| `ALLOWED_ORIGINS` | 前端来源 |
| `BACKEND_PORT` | 后端宿主机端口（默认 5000） |
| `POSTGRES_PORT` | Postgres 宿主机端口（默认 5433） |

---

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册（支持邀请码） |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 获取当前用户信息（含订阅状态、每日次数等） |

### 题库

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/quiz` | 获取题库列表（支持分类/难度筛选） |
| GET | `/api/quiz/play?id=` | 获取题目详情（检查每日次数限制） |
| POST | `/api/quiz/submit` | 提交答题（金币倍率根据订阅等级计算） |

### 订阅 & 会员

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/subscription/plans` | 获取订阅方案 |
| GET | `/api/subscription/status` | 获取订阅状态 |
| POST | `/api/subscription/subscribe` | 订阅（月卡/年卡） |
| POST | `/api/subscription/cancel` | 取消自动续费 |
| POST | `/api/subscription/start-trial` | 开启 3 天 Pro 试用 |
| POST | `/api/subscription/claim-daily-reward` | 领取每日签到奖励 |
| POST | `/api/subscription/use-streak-freeze` | 使用连胜保护卡 |
| POST | `/api/subscription/referral` | 使用邀请码 |

### 其他

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/leaderboard` | 排行榜（积分/金币/场次） |
| GET | `/api/user/stats` | 用户详细统计 |
| POST | `/api/user/coins` | 金币操作 |
| GET | `/health` | 健康检查 |

---

## 商业模式

| 功能 | 免费版 | 月度 Pro（¥18） | 年度 Pro（¥128） |
|---|---|---|---|
| 每日答题次数 | 3 次 | 无限 | 无限 |
| 金币奖励倍率 | 1x | 2x | 3x |
| 每日签到奖励倍率 | 1x | 3x | 3x |
| 连胜保护卡 | 无 | 2 张/月 | 12 张/年 |
| 订阅赠送金币 | — | 500 | 8,000 |
| Pro 专属徽章 | 无 | 有 | 有 |

### 增长引擎

- **每日硬限制 3 次**：最强付费转化驱动
- **每日签到 7 天循环**：日活留存
- **连胜保护卡**：Pro 专属，用户不敢断订阅
- **邀请好友**：邀请人得 300 金币，被邀请人得 200 金币
- **3 天免费试用**：降低首次付费门槛
- **年卡 3 倍 vs 月卡 2 倍**：推动用户选择年卡
- **损失厌恶取消流程**：展示取消后失去的所有特权
