# QuizMaster — 独立后端 (Express.js + MongoDB)

将前端部署到 Vercel 后，使用本目录的独立后端服务器来处理所有数据库请求。

## 目录结构

```
backend/
├── src/
│   ├── index.js          # 应用入口
│   ├── db.js             # MongoDB 连接
│   ├── middleware/
│   │   └── auth.js       # JWT 鉴权中间件
│   ├── models/
│   │   ├── User.js
│   │   ├── Quiz.js
│   │   └── GameSession.js
│   ├── routes/
│   │   ├── auth.js       # /api/auth/*
│   │   ├── quiz.js       # /api/quiz/*
│   │   ├── leaderboard.js
│   │   └── user.js       # /api/user/*
│   └── scripts/
│       └── seed.js       # 初始化题库数据
├── .env.example          # 环境变量模板
├── Dockerfile
└── package.json
```

## 快速启动（Docker Compose，推荐）

项目根目录有 `docker-compose.yml`，一键启动 MongoDB + 后端：

```bash
# 1. 在项目根目录创建 .env 文件（参考 docker-compose.env.example）
cp docker-compose.env.example .env
# 编辑 .env，填写 JWT_SECRET 和 ALLOWED_ORIGINS

# 2. 构建并启动
docker compose up -d --build

# 3. 初始化题库（可选，首次部署时执行）
docker compose exec backend node src/scripts/seed.js
```

后端将在 `http://your-server-ip:5000` 运行。

## 本地开发启动

```bash
cd backend
cp .env.example .env
# 编辑 .env，确保 MONGODB_URI 指向本地 MongoDB

npm install
npm run dev      # 使用 nodemon 热重载
# 或
npm start        # 直接启动
```

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `MONGODB_URI` | MongoDB 连接字符串 | `mongodb://localhost:27017/quizmaster` |
| `JWT_SECRET` | JWT 签名密钥（生产环境请使用强随机字符串） | `some_random_string` |
| `PORT` | 监听端口 | `5000` |
| `ALLOWED_ORIGINS` | 允许跨域的前端地址（逗号分隔） | `https://your-app.vercel.app` |
| `NODE_ENV` | 运行环境 | `production` |

## API 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 获取当前用户 |
| GET | `/api/quiz` | 获取题库列表 |
| GET | `/api/quiz/play?id=` | 获取单个题库（完整题目） |
| POST | `/api/quiz/submit` | 提交答题结果 |
| GET | `/api/leaderboard` | 排行榜 |
| GET | `/api/user/stats` | 用户统计（需登录） |
| POST | `/api/user/coins` | 金币操作（需登录） |
| GET | `/health` | 健康检查 |

## 部署到服务器

### 方式一：Docker Compose（推荐）

```bash
# 服务器上
git clone <your-repo>
cd <repo-root>
cp docker-compose.env.example .env
nano .env   # 填写 JWT_SECRET 和 ALLOWED_ORIGINS

docker compose up -d --build

# 查看日志
docker compose logs -f backend
```

### 方式二：直接用 Node.js

```bash
cd backend
npm install --production
cp .env.example .env
nano .env   # 填写所有环境变量

# 使用 pm2 守护进程
npm install -g pm2
pm2 start src/index.js --name quizmaster-backend
pm2 save
pm2 startup
```

### 配置 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 前端配置

部署后，在 Vercel 项目设置中添加环境变量：

```
NEXT_PUBLIC_API_URL=https://api.your-server.com
```

同时确保后端 `.env` 中 `ALLOWED_ORIGINS` 包含你的 Vercel 前端地址：

```
ALLOWED_ORIGINS=https://your-app.vercel.app
```
