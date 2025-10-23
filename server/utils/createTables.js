import { createUserTable } from "../model/userTable.js";
import { createProductsTable } from "../model/productTable.js";
import { createOrdersTable } from "../model/ordersTable.js";
import { createOrderItemTable } from "../model/orderItemsTable.js";
import { createShippingInfoTable } from "../model/shippinginfoTable.js";
import { createPaymentsTable } from "../model/paymentsTable.js";
import { createProductReviewsTable } from "../model/productReviewsTable.js";

export const createTables = async () => {
  try {
    await createUserTable();
    await createProductsTable();
    await createProductReviewsTable();
    await createOrdersTable();
    await createOrderItemTable();
    await createShippingInfoTable();
    await createPaymentsTable();
    console.log("✅ All tables created successfully.");
  } catch (error) {
    console.error("❌ Failed to create tables:", error);
    process.exit(1);
  }
};
