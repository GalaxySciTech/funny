require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : { rejectUnauthorized: false },
});

const quizData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "quizData.json"), "utf8")
);

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM quizzes");
    console.log("Cleared existing quizzes");

    for (const q of quizData) {
      await client.query(
        `INSERT INTO quizzes (
          title, description, category, difficulty, questions,
          time_per_question, is_premium, entry_fee, max_reward, play_count,
          thumbnail, emoji, is_active
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          q.title,
          q.description || "",
          q.category,
          q.difficulty || "medium",
          JSON.stringify(q.questions || []),
          q.timePerQuestion ?? 20,
          q.isPremium ?? false,
          q.entryFee ?? 0,
          q.maxReward ?? 50,
          q.playCount ?? 0,
          q.thumbnail || "",
          q.emoji || "🧠",
          q.isActive !== false,
        ]
      );
    }
    console.log(`Seeded ${quizData.length} quizzes`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
