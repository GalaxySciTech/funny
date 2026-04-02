# QuizMaster Pro 🧠

知识竞赛平台 — 答题赚金币、冲排行榜、Pro 会员无限畅玩。

## 项目结构

```
├── frontend/          # Next.js 14 前端（App Router + Tailwind CSS）
├── backend/           # Express.js 独立后端 API
├── docker-compose.yml # 一键启动 MongoDB + 后端
└── README.md
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14、React 18、Tailwind CSS 3 |
| 后端 | Express 4、Mongoose 8、JWT |
| 数据库 | MongoDB 7 |
| 部署 | Docker Compose / Vercel + VPS |

---

## 快速启动

> **端口说明**：本项目 MongoDB 默认使用 **27018** 端口（而非常见的 27017），避免与服务器上其他项目的 MongoDB 冲突。如果你的 27018 也被占用，修改 `.env` 中的 `MONGO_PORT` 或 `MONGODB_URI` 即可。

### 方式一：纯前端本地开发（最简单）

前端内置了 Next.js API Routes，无需单独启动后端，只需要一个 MongoDB 即可。

```bash
# 1. 启动 MongoDB（映射到 27018 端口，避免与其他项目冲突）
docker run -d -p 27018:27017 --name quizmaster_mongo mongo:7

# 2. 进入前端目录
cd frontend

# 3. 配置环境变量
cp .env.example .env.local
# .env.local 默认已指向 mongodb://localhost:27018/quizmaster，无需修改

# 4. 安装依赖
npm install

# 5. 初始化题库数据（首次运行）
npm run seed

# 6. 启动开发服务器
npm run dev
```

打开浏览器访问 **http://localhost:3000** 即可。

---

### 方式二：前端 + 独立后端（前后端分离）

适用于需要将后端部署到独立服务器的场景。

```bash
# ── 终端 1：启动 MongoDB（27018 端口） ──
docker run -d -p 27018:27017 --name quizmaster_mongo mongo:7

# ── 终端 2：启动后端 ──
cd backend
cp .env.example .env
# .env 默认已指向 mongodb://localhost:27018/quizmaster
npm install
npm run seed    # 首次运行，初始化题库
npm run dev     # 开发模式（nodemon 热重载）

# ── 终端 3：启动前端 ──
cd frontend
cp .env.example .env.local
# 编辑 .env.local，设置：
#   NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

- 前端：**http://localhost:3000**
- 后端：**http://localhost:5000**
- 后端健康检查：**http://localhost:5000/health**

---

### 方式三：Docker Compose（一键生产部署）

```bash
# 1. 配置环境变量
cp docker-compose.env.example .env
# 编辑 .env，设置 JWT_SECRET 和 ALLOWED_ORIGINS
# 默认 MONGO_PORT=27018，如需修改也在此处

# 2. 构建并启动（MongoDB + 后端）
docker compose up -d --build

# 3. 初始化题库（首次部署）
docker compose exec backend node src/scripts/seed.js

# 4. 查看日志
docker compose logs -f backend
```

后端运行在 `http://your-server:5000`，前端单独部署到 Vercel 并设置 `NEXT_PUBLIC_API_URL`。

---

### 端口冲突处理

如果你的服务器上 27018 端口也被占用了，只需两步：

**Docker Compose 方式**：编辑根目录 `.env`

```bash
MONGO_PORT=27019   # 改成任意空闲端口
```

**本地开发方式**：

```bash
# 1. 启动 MongoDB 时换端口
docker run -d -p 27019:27017 --name quizmaster_mongo mongo:7

# 2. 修改对应的环境变量
#    backend/.env 或 frontend/.env.local 中：
MONGODB_URI=mongodb://localhost:27019/quizmaster
```

> **注意**：Docker Compose 内部容器之间的连接始终使用 27017（容器内部端口），`MONGO_PORT` 只影响宿主机映射。后端容器的 `MONGODB_URI` 无需修改。

---

## 环境变量

### 后端（`backend/.env`）

| 变量 | 说明 | 默认值 |
|---|---|---|
| `MONGODB_URI` | MongoDB 连接字符串 | `mongodb://localhost:27018/quizmaster` |
| `JWT_SECRET` | JWT 签名密钥 | `change_me_to_a_random_secret_string` |
| `PORT` | 监听端口 | `5000` |
| `ALLOWED_ORIGINS` | 允许跨域的前端地址（逗号分隔） | `http://localhost:3000` |
| `NODE_ENV` | 运行环境 | `development` |

### 前端（`frontend/.env.local`）

| 变量 | 说明 | 默认值 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | 独立后端地址（留空则使用内置 API Routes） | 空 |
| `MONGODB_URI` | MongoDB 连接字符串（使用内置 API 时需要） | `mongodb://localhost:27018/quizmaster` |
| `JWT_SECRET` | JWT 签名密钥（使用内置 API 时需要） | `change_me_to_a_random_secret_string` |

### Docker Compose（根目录 `.env`）

| 变量 | 说明 | 默认值 |
|---|---|---|
| `JWT_SECRET` | JWT 签名密钥 | `change_me_to_a_long_random_string` |
| `ALLOWED_ORIGINS` | 允许跨域的前端地址 | `https://your-app.vercel.app` |
| `MONGO_PORT` | MongoDB 映射到宿主机的端口 | `27018` |
| `BACKEND_PORT` | 后端映射到宿主机的端口 | `5000` |

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
