require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const leaderboardRoutes = require("./routes/leaderboard");
const userRoutes = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/user", userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "服务器内部错误" });
});

app.use((req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`QuizMaster backend running on port ${PORT}`);
  });
});
