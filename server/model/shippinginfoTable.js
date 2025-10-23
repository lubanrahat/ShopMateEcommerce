import database from "../database/db.js";
export async function createShippingInfoTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS shipping_info (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID NOT NULL UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `;
    await database.query(query);
    console.log("✅ Shipping Info table created successfully.");
  } catch (error) {
    console.error("❌ Failed to create Shipping Info table:", error);
    process.exit(1);
  }
}
