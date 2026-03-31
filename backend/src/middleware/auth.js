const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "quizmaster_secret";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.status(401).json({ error: "未登录" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "无效token" });
  }
  req.user = decoded;
  next();
}

function optionalAuth(req, res, next) {
  const token = req.cookies?.auth_token;
  if (token) {
    req.user = verifyToken(token);
  }
  next();
}

module.exports = { signToken, verifyToken, requireAuth, optionalAuth };
