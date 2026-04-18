const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const {
  findUserByEmail,
  findUserByReferralCode,
  createUser,
  updateUserById,
} = require("../repos");
const { signToken } = require("../middleware/auth");
const { getEffectivePremium, resetDailyPlaysIfNeeded } = require("../domain/user");
const { toClientUser } = require("../serializers/user");

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 60 * 60 * 24 * 7 * 1000,
  path: "/",
};

function userToAuthJson(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    coins: user.coins,
    level: user.level,
    referralCode: user.referral_code,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, email, password, referralCode } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "请填写所有字段" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "密码至少6位" });
    }

    const existing = await client.query(
      `SELECT 1 FROM users WHERE lower(email) = lower($1) OR username = $2 LIMIT 1`,
      [email, username]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: "用户名或邮箱已被使用" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await client.query("BEGIN");

    let user = await createUser(pool, client, {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      coins: 200,
      badges: [{ name: "新手", icon: "🌟", earnedAt: new Date().toISOString() }],
    });

    if (referralCode) {
      const referrer = await findUserByReferralCode(pool, referralCode, user.id);
      if (referrer) {
        user = await updateUserById(pool, client, user.id, {
          referredBy: referrer.id,
          coins: user.coins + 200,
        });
        await client.query(
          `UPDATE users SET coins = coins + 300, referral_count = referral_count + 1,
            loyalty_points = loyalty_points + 50, updated_at = now() WHERE id = $1`,
          [referrer.id]
        );
      }
    }

    await client.query("COMMIT");

    const token = signToken({ userId: user.id, username: user.username });
    res.cookie("auth_token", token, COOKIE_OPTIONS);
    return res.json({
      success: true,
      user: userToAuthJson(user),
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    return res.status(500).json({ error: "服务器错误" });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "请填写邮箱和密码" });
    }

    const user = await findUserByEmail(pool, email);
    if (!user) {
      return res.status(401).json({ error: "邮箱或密码错误" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "邮箱或密码错误" });
    }

    const token = signToken({ userId: user.id, username: user.username });

    res.cookie("auth_token", token, COOKIE_OPTIONS);
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        level: user.level,
        totalScore: user.total_score,
        streak: user.streak,
        isPremium: getEffectivePremium(user),
        subscriptionPlan: user.subscription_plan,
        referralCode: user.referral_code,
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

    let user = await findUserById(pool, decoded.userId);
    if (!user) return res.json({ user: null });

    if (resetDailyPlaysIfNeeded(user)) {
      await pool.query(
        `UPDATE users SET daily_plays_used = 0, daily_plays_date = $2, updated_at = now() WHERE id = $1`,
        [user.id, new Date().toISOString().split("T")[0]]
      );
      user = await findUserById(pool, decoded.userId);
    }

    return res.json({ user: toClientUser(user) });
  } catch (err) {
    console.error(err);
    return res.json({ user: null });
  }
});

module.exports = router;
