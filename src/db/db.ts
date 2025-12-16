import { Pool } from "pg";
import ENV from "../config/env";
import userTable from "../models/user.model";
import productTable from "../models/product.model";
import orderItemTable from "../models/orderItem.model";
import orderTable from "../models/order.model";
import shippingTable from "../models/shipping.model";
import paymentTable from "../models/payment.model";
import productReviewTable from "../models/productReview.model";

export const pool = new Pool({
  connectionString: `${ENV.DATABASE_URL}`,
});

const initializeDatabase = async () => {
  try {
    await userTable();
    await productTable();
    await orderTable();
    await orderItemTable();
    await shippingTable();
    await paymentTable()
    await productReviewTable();
    console.log("✅ All tables created successfully.");
  } catch (error) {
    console.error("❌ Failed to create tables:", error);
    process.exit(1);
  }
};

export default initializeDatabase;
