import { pool } from "../db/db";

const productTable = async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    const query = `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        category VARCHAR(100) NOT NULL,
        ratings DECIMAL(3,2) DEFAULT 0 CHECK (ratings BETWEEN 0 AND 5),
        images JSONB DEFAULT '[]'::JSONB,
        stock INT NOT NULL CHECK (stock >= 0),
        created_by UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_products_user
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    await pool.query(query);
    console.log("✅ Products table created successfully.");
  } catch (error) {
    console.error("❌ Failed to create products table:", error);
    process.exit(1);
  }
};

export default productTable;
