const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : { rejectUnauthorized: false },
  max: 10,
});

async function connectDB() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    const safe = connectionString.replace(/:[^:@/]+@/, ":****@");
    console.log("PostgreSQL connected:", safe);
  } catch (err) {
    console.error("PostgreSQL connection error:", err.message);
    process.exit(1);
  }
}

module.exports = { pool, connectDB };
