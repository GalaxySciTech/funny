# QuizMaster API

Express 后端，连接 **PostgreSQL**（生产环境使用 Supabase）。

配置与运行说明见仓库根目录 [README.md](../README.md)。

### 常用命令

```bash
npm install
npm run db:migrate   # 执行 supabase/migrations/001_initial.sql 中的建表语句
npm run seed         # 写入题库数据
npm run dev          # 开发
```

环境变量见 `backend/.env.example`。
