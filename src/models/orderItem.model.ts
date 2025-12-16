import { pool } from "../db/db";

const orderItemTable = async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    const query = `
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        image TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_order_items_order
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `;

    await pool.query(query);
    console.log("✅ Order Items table created successfully.");
  } catch (error) {
    console.error("❌ Failed to create Order Items table:", error);
    process.exit(1);
  }
};

export default orderItemTable;
