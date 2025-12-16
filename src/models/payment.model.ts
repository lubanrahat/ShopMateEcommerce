import { pool } from "../db/db";

const paymentTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS payments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID NOT NULL UNIQUE,
        payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('Online')),
        payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('Paid', 'Pending', 'Failed')),
        payment_intent_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `;

    await pool.query(query);
    console.log("✅ Payments table created successfully.");
  } catch (error) {
    console.error("❌ Failed to create Payments table:", error);
    process.exit(1);
  }
};

export default paymentTable;
