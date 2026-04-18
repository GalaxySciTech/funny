const {
  getEffectivePremium,
  getDailyPlayLimit,
  getCoinMultiplier,
  resetDailyPlaysIfNeeded,
  isSubscriptionActive,
  isTrialActive,
} = require("./domain/user");

function mapUserRow(row) {
  if (!row) return null;
  return {
    ...row,
    badges: Array.isArray(row.badges) ? row.badges : JSON.parse(row.badges || "[]"),
  };
}

function stripQuizQuestionsForList(questions) {
  if (!questions) return [];
  return questions.map((q) => ({
    question: q.question,
    options: q.options,
    points: q.points,
  }));
}

function quizRowToApi(row, { full = false } = {}) {
  if (!row) return null;
  const questions =
    typeof row.questions === "string"
      ? JSON.parse(row.questions)
      : row.questions || [];
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    questions: full ? questions : stripQuizQuestionsForList(questions),
    timePerQuestion: row.time_per_question,
    isPremium: row.is_premium,
    entryFee: row.entry_fee,
    maxReward: row.max_reward,
    playCount: row.play_count,
    thumbnail: row.thumbnail,
    emoji: row.emoji,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findUserByEmail(pool, email) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  );
  return mapUserRow(rows[0]);
}

async function findUserById(pool, id) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return mapUserRow(rows[0]);
}

async function findUserByReferralCode(pool, code, excludeId) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE referral_code = $1 AND id <> $2 LIMIT 1`,
    [code.toUpperCase(), excludeId]
  );
  return mapUserRow(rows[0]);
}

async function createUser(pool, client, data) {
  const referralCode =
    data.username.toUpperCase().slice(0, 4) +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const { rows } = await client.query(
    `INSERT INTO users (
      username, email, password, coins, badges, referral_code
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
    RETURNING *`,
    [
      data.username,
      data.email.toLowerCase(),
      data.password,
      data.coins ?? 200,
      JSON.stringify(data.badges || []),
      referralCode,
    ]
  );
  return mapUserRow(rows[0]);
}

async function updateUserById(pool, client, userId, patch) {
  const sets = [];
  const vals = [];
  let i = 1;
  const add = (col, val, jsonb = false) => {
    sets.push(jsonb ? `${col} = $${i++}::jsonb` : `${col} = $${i++}`);
    vals.push(val);
  };

  const map = {
    coins: "coins",
    totalScore: "total_score",
    gamesPlayed: "games_played",
    gamesWon: "games_won",
    streak: "streak",
    maxStreak: "max_streak",
    lastPlayedAt: "last_played_at",
    level: "level",
    badges: "badges",
    isPremium: "is_premium",
    premiumUntil: "premium_until",
    subscriptionPlan: "subscription_plan",
    subscriptionAutoRenew: "subscription_auto_renew",
    totalPremiumDays: "total_premium_days",
    dailyPlaysUsed: "daily_plays_used",
    dailyPlaysDate: "daily_plays_date",
    dailyRewardDay: "daily_reward_day",
    dailyRewardLastClaimed: "daily_reward_last_claimed",
    dailyRewardStreak: "daily_reward_streak",
    referredBy: "referred_by",
    referralCount: "referral_count",
    loyaltyPoints: "loyalty_points",
    loyaltyTier: "loyalty_tier",
    streakFreezeCount: "streak_freeze_count",
    streakFreezeUsedAt: "streak_freeze_used_at",
    trialUsed: "trial_used",
    trialEndsAt: "trial_ends_at",
  };

  for (const [k, col] of Object.entries(map)) {
    if (k in patch) {
      let v = patch[k];
      if (k === "badges" && v !== undefined) {
        add(col, JSON.stringify(v), true);
        continue;
      }
      add(col, v);
    }
  }

  if (sets.length === 0) return findUserById(pool, userId);

  vals.push(userId);
  const q = `UPDATE users SET ${sets.join(", ")}, updated_at = now() WHERE id = $${i} RETURNING *`;
  const { rows } = await client.query(q, vals);
  return mapUserRow(rows[0]);
}

async function listQuizzes(pool, filter) {
  const cond = ["is_active = TRUE"];
  const params = [];
  let p = 1;
  if (filter.category) {
    cond.push(`category = $${p++}`);
    params.push(filter.category);
  }
  if (filter.difficulty) {
    cond.push(`difficulty = $${p++}`);
    params.push(filter.difficulty);
  }
  const { rows } = await pool.query(
    `SELECT * FROM quizzes WHERE ${cond.join(" AND ")} ORDER BY play_count DESC, created_at DESC LIMIT 20`,
    params
  );
  return rows.map((r) => quizRowToApi(r, { full: false }));
}

async function findQuizById(pool, id) {
  const { rows } = await pool.query(`SELECT * FROM quizzes WHERE id = $1`, [id]);
  return rows[0] ? quizRowToApi(rows[0], { full: true }) : null;
}

async function findQuizRowRaw(pool, id) {
  const { rows } = await pool.query(`SELECT * FROM quizzes WHERE id = $1`, [id]);
  if (!rows[0]) return null;
  const row = rows[0];
  row.questions =
    typeof row.questions === "string"
      ? JSON.parse(row.questions)
      : row.questions;
  return row;
}

async function incrementQuizPlayCount(client, quizId) {
  await client.query(
    `UPDATE quizzes SET play_count = play_count + 1, updated_at = now() WHERE id = $1`,
    [quizId]
  );
}

async function createGameSession(client, data) {
  const { rows } = await client.query(
    `INSERT INTO game_sessions (
      user_id, quiz_id, score, correct_answers, total_questions, time_taken, coins_earned, answers
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    RETURNING *`,
    [
      data.userId,
      data.quizId,
      data.score,
      data.correctAnswers,
      data.totalQuestions,
      data.timeTaken,
      data.coinsEarned,
      JSON.stringify(data.answers),
    ]
  );
  return rows[0];
}

async function listRecentSessions(pool, userId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT gs.*,
      q.title as quiz_title, q.category as quiz_category, q.emoji as quiz_emoji
    FROM game_sessions gs
    JOIN quizzes q ON q.id = gs.quiz_id
    WHERE gs.user_id = $1
    ORDER BY gs.completed_at DESC
    LIMIT $2`,
    [userId, limit]
  );
  return rows.map((r) => ({
    _id: r.id,
    userId: r.user_id,
    quizId: r.quiz_id,
    score: r.score,
    correctAnswers: r.correct_answers,
    totalQuestions: r.total_questions,
    timeTaken: r.time_taken,
    coinsEarned: r.coins_earned,
    answers:
      typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers,
    completedAt: r.completed_at,
    quizId_populated: {
      title: r.quiz_title,
      category: r.quiz_category,
      emoji: r.quiz_emoji,
    },
  }));
}

async function leaderboardUsers(pool, type) {
  const orderBy =
    type === "coins"
      ? "coins DESC"
      : type === "games"
        ? "games_played DESC"
        : "total_score DESC";

  const { rows } = await pool.query(
    `SELECT id, username, total_score, coins, games_played, games_won, streak, level,
      badges, is_premium, premium_until, subscription_plan, loyalty_tier, trial_ends_at
    FROM users ORDER BY ${orderBy} LIMIT 50`
  );

  return rows.map((u) => {
    const user = mapUserRow(u);
    return {
      _id: user.id,
      username: user.username,
      totalScore: user.total_score,
      coins: user.coins,
      gamesPlayed: user.games_played,
      gamesWon: user.games_won,
      streak: user.streak,
      level: user.level,
      badges: user.badges,
      isPremium: getEffectivePremium(user),
      loyaltyTier: user.loyalty_tier,
      subscriptionPlan: user.subscription_plan,
    };
  });
}

async function findActiveSubscription(pool, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (!rows[0]) return null;
  const s = rows[0];
  return {
    _id: s.id,
    userId: s.user_id,
    plan: s.plan,
    status: s.status,
    startDate: s.start_date,
    endDate: s.end_date,
    autoRenew: s.auto_renew,
    cancelledAt: s.cancelled_at,
    cancelReason: s.cancel_reason,
    amountPaid: s.amount_paid,
    currency: s.currency,
    transactionId: s.transaction_id,
    renewalCount: s.renewal_count,
    lastRenewalDate: s.last_renewal_date,
    discountApplied: s.discount_applied,
    originalAmount: s.original_amount,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

async function createSubscriptionRow(client, data) {
  const { rows } = await client.query(
    `INSERT INTO subscriptions (
      user_id, plan, status, start_date, end_date, amount_paid, original_amount, currency, transaction_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      data.userId,
      data.plan,
      data.status || "active",
      data.startDate,
      data.endDate,
      data.amountPaid,
      data.originalAmount,
      data.currency || "CNY",
      data.transactionId,
    ]
  );
  const s = rows[0];
  return {
    _id: s.id,
    userId: s.user_id,
    plan: s.plan,
    status: s.status,
    startDate: s.start_date,
    endDate: s.end_date,
    amountPaid: s.amount_paid,
    currency: s.currency,
    transactionId: s.transaction_id,
  };
}

async function cancelLatestActiveSubscription(client, userId, reason) {
  await client.query(
    `UPDATE subscriptions SET
      auto_renew = FALSE,
      cancelled_at = now(),
      cancel_reason = $2,
      updated_at = now()
    WHERE id = (
      SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1
    )`,
    [userId, reason || ""]
  );
}

module.exports = {
  mapUserRow,
  quizRowToApi,
  findUserByEmail,
  findUserById,
  findUserByReferralCode,
  createUser,
  updateUserById,
  incrementUserFields,
  listQuizzes,
  findQuizById,
  findQuizRowRaw,
  incrementQuizPlayCount,
  createGameSession,
  listRecentSessions,
  leaderboardUsers,
  findActiveSubscription,
  createSubscriptionRow,
  cancelLatestActiveSubscription,
  getEffectivePremium,
  getDailyPlayLimit,
  getCoinMultiplier,
  resetDailyPlaysIfNeeded,
  isSubscriptionActive,
  isTrialActive,
};

