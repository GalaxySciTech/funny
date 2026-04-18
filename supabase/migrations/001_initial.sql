-- QuizMaster schema for Supabase (PostgreSQL)
-- Apply in Supabase SQL Editor or via: npm run db:migrate (from backend)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  coins INTEGER NOT NULL DEFAULT 100,
  total_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  level INTEGER NOT NULL DEFAULT 1,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,

  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  subscription_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'monthly', 'yearly')),
  subscription_auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  total_premium_days INTEGER NOT NULL DEFAULT 0,

  daily_plays_used INTEGER NOT NULL DEFAULT 0,
  daily_plays_date TEXT NOT NULL DEFAULT '',

  daily_reward_day INTEGER NOT NULL DEFAULT 0,
  daily_reward_last_claimed TEXT NOT NULL DEFAULT '',
  daily_reward_streak INTEGER NOT NULL DEFAULT 0,

  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users (id) ON DELETE SET NULL,
  referral_count INTEGER NOT NULL DEFAULT 0,

  loyalty_points INTEGER NOT NULL DEFAULT 0,
  loyalty_tier TEXT NOT NULL DEFAULT 'bronze'
    CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'diamond')),

  streak_freeze_count INTEGER NOT NULL DEFAULT 0,
  streak_freeze_used_at TIMESTAMPTZ,

  trial_used BOOLEAN NOT NULL DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_total_score ON users (total_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_coins ON users (coins DESC);
CREATE INDEX IF NOT EXISTS idx_users_games_played ON users (games_played DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL
    CHECK (category IN (
      'science', 'history', 'geography', 'sports',
      'entertainment', 'technology', 'food', 'animals'
    )),
  difficulty TEXT NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_per_question INTEGER NOT NULL DEFAULT 20,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  max_reward INTEGER NOT NULL DEFAULT 50,
  play_count INTEGER NOT NULL DEFAULT 0,
  thumbnail TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🧠',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_active ON quizzes (is_active, play_count DESC);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions (user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT NOT NULL DEFAULT '',

  amount_paid NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  payment_method TEXT NOT NULL DEFAULT 'simulated',
  transaction_id TEXT NOT NULL DEFAULT '',

  renewal_count INTEGER NOT NULL DEFAULT 0,
  last_renewal_date TIMESTAMPTZ,
  discount_applied TEXT NOT NULL DEFAULT '',
  original_amount NUMERIC NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions (user_id, status, created_at DESC);
