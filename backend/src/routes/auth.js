const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 60 * 60 * 24 * 7 * 1000,
  path: "/",
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "请填写所有字段" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "密码至少6位" });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existingUser) {
      return res.status(409).json({ error: "用户名或邮箱已被使用" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      coins: 200,
      badges: [{ name: "新手", icon: "🌟", earnedAt: new Date() }],
    });

    const token = signToken({ userId: user._id, username: user.username });

    res.cookie("auth_token", token, COOKIE_OPTIONS);
    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        level: user.level,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "请填写邮箱和密码" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "邮箱或密码错误" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "邮箱或密码错误" });
    }

    const token = signToken({ userId: user._id, username: user.username });

    res.cookie("auth_token", token, COOKIE_OPTIONS);
    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        level: user.level,
        totalScore: user.totalScore,
        streak: user.streak,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "服务器错误" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", { path: "/" });
  return res.json({ success: true });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.json({ user: null });

    const { verifyToken } = require("../middleware/auth");
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ user: null });

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.json({ user: null });

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        level: user.level,
        totalScore: user.totalScore,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        streak: user.streak,
        badges: user.badges,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error(err);
    return res.json({ user: null });
  }
});

module.exports = router;
