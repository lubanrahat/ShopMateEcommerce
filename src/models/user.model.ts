import { pool } from "../db/db";

const userTable = async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 3),
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(10) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
        avatar JSONB,
        reset_password_token TEXT,
        reset_password_expire TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(query);
    console.log("✅ User table created successfully.");
  } catch (error) {
    console.error("❌ Error creating user table:", error);
  }
};

export default userTable;
