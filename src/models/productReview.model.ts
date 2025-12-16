import { pool } from "../db/db";

const productReviewTable = async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    const query = `
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL,
        user_id UUID NOT NULL,
        rating NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 0 AND 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_reviews_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

        CONSTRAINT fk_reviews_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

        CONSTRAINT unique_user_product_review
          UNIQUE (product_id, user_id)
      );
    `;

    await pool.query(query);
    console.log("✅ Product Reviews table created successfully.");
  } catch (error) {
    console.error("❌ Failed to create Product Reviews table:", error);
    process.exit(1);
  }
};

export default productReviewTable;
