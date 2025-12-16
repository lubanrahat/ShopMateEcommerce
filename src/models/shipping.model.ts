import { pool } from "../db/db";

const shippingTable = async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    const query = `
      CREATE TABLE IF NOT EXISTS shipping_info (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_shipping_order
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `;

    await pool.query(query);
    console.log("✅ Shipping Info table created successfully.");
  } catch (error) {
    console.error("❌ Failed to create Shipping Info table:", error);
    process.exit(1);
  }
};

export default shippingTable;
