import { pool } from "../db/db";

const orderTable = async () => {
  try {
    
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    const query = `
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL,
        total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
        tax_price DECIMAL(10,2) NOT NULL CHECK (tax_price >= 0),
        shipping_price DECIMAL(10,2) NOT NULL CHECK (shipping_price >= 0),
        order_status VARCHAR(20) DEFAULT 'PROCESSING'
          CHECK (order_status IN ('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
        paid_at TIMESTAMPTZ CHECK (paid_at IS NULL OR paid_at <= CURRENT_TIMESTAMP),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_orders_buyer
          FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    await pool.query(query);
    console.log("✅ Orders table created successfully.");
  } catch (error) {
    console.error("❌ Failed to create Orders table:", error);
    process.exit(1);
  }
};

export default orderTable;

