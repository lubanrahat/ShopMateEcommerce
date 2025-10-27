import { ErrorHandler } from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";

const getAllUser = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const totalUsersResult = await database.query(
    "SELECT COUNT(*) FROM users WHERE role = $1",
    ["User"]
  );

  const totalUsers = parseInt(totalUsersResult.rows[0].count);

  const users = await database.query(
    "SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    ["User", limit, offset]
  );

  res.status(200).json({
    success: true,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    users: users.rows,
  });
});

const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const deletedUser = await database.query(
    "DELETE FROM users WHERE id = $1 RETURNING *",
    [id]
  );

  if (deletedUser.rows.length === 0) {
    return next(new ErrorHandler("User not found", 404));
  }

  const avatar = deletedUser.rows[0].avatar;

  if (avatar?.public_id) {
    await cloudinary.uploader.destroy(avatar.public_id);
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully.",
    user: deletedUser.rows[0],
  });
});

const dashboardStats = catchAsyncErrors(async (req, res, next) => {
  const today = new Date();
  const todayDate = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split("T")[0];

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );

  const previousMonthStart = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );
  const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // --- Total Revenue All Time ---
  const totalRevenueAllTimeQuery = await database.query(`
    SELECT COALESCE(SUM(total_price), 0) AS total 
    FROM orders 
    WHERE paid_at IS NOT NULL
  `);
  const totalRevenueAllTime = parseFloat(
    totalRevenueAllTimeQuery.rows[0].total
  );

  // --- Total Users ---
  const totalUsersCountQuery = await database.query(`
    SELECT COUNT(*) FROM users WHERE role = 'User'
  `);
  const totalUsersCount = parseInt(totalUsersCountQuery.rows[0].count) || 0;

  // --- Order Status Counts ---
  const orderStatusCountsQuery = await database.query(`
    SELECT order_status, COUNT(*) 
    FROM orders 
    WHERE paid_at IS NOT NULL 
    GROUP BY order_status
  `);

  const orderStatusCounts = {
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  orderStatusCountsQuery.rows.forEach((row) => {
    orderStatusCounts[row.order_status] = parseInt(row.count);
  });

  // --- Today's Revenue ---
  const todayRevenueQuery = await database.query(
    `SELECT COALESCE(SUM(total_price), 0) AS total 
     FROM orders 
     WHERE created_at::date = $1 AND paid_at IS NOT NULL`,
    [todayDate]
  );
  const todayRevenue = parseFloat(todayRevenueQuery.rows[0].total);

  // --- Yesterday's Revenue ---
  const yesterdayRevenueQuery = await database.query(
    `SELECT COALESCE(SUM(total_price), 0) AS total 
     FROM orders 
     WHERE created_at::date = $1 AND paid_at IS NOT NULL`,
    [yesterdayDate]
  );
  const yesterdayRevenue = parseFloat(yesterdayRevenueQuery.rows[0].total);

  // --- Monthly Sales for Line Chart ---
  const monthlySalesQuery = await database.query(`
    SELECT
      TO_CHAR(created_at, 'Mon YYYY') AS month,
      DATE_TRUNC('month', created_at) AS date,
      SUM(total_price) AS totalsales
    FROM orders 
    WHERE paid_at IS NOT NULL
    GROUP BY month, date
    ORDER BY date ASC
  `);

  const monthlySales = monthlySalesQuery.rows.map((row) => ({
    month: row.month,
    totalsales: parseFloat(row.totalsales) || 0,
  }));

  // --- Top 5 Most Sold Products ---
  const topSellingProductsQuery = await database.query(`
    SELECT 
      p.name,
      p.images->0->>'url' AS image,
      p.category,
      p.ratings,
      SUM(oi.quantity) AS total_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.paid_at IS NOT NULL
    GROUP BY p.name, p.images, p.category, p.ratings
    ORDER BY total_sold DESC
    LIMIT 5
  `);
  const topSellingProducts = topSellingProductsQuery.rows;

  // --- Current Month Sales ---
  const currentMonthSalesQuery = await database.query(
    `SELECT COALESCE(SUM(total_price), 0) AS total 
     FROM orders 
     WHERE paid_at IS NOT NULL 
     AND created_at BETWEEN $1 AND $2`,
    [currentMonthStart, currentMonthEnd]
  );
  const currentMonthSales = parseFloat(currentMonthSalesQuery.rows[0].total);

  // --- Products with Low Stock ---
  const lowStockProductsQuery = await database.query(`
    SELECT name, stock 
    FROM products 
    WHERE stock <= 5
  `);
  const lowStockProducts = lowStockProductsQuery.rows;

  // --- Last Month Revenue ---
  const lastMonthRevenueQuery = await database.query(
    `SELECT COALESCE(SUM(total_price), 0) AS total 
     FROM orders
     WHERE paid_at IS NOT NULL 
     AND created_at BETWEEN $1 AND $2`,
    [previousMonthStart, previousMonthEnd]
  );
  const lastMonthRevenue = parseFloat(lastMonthRevenueQuery.rows[0].total);

  // --- Revenue Growth Calculation ---
  let revenueGrowth = "0%";
  if (lastMonthRevenue > 0) {
    const growthRate =
      ((currentMonthSales - lastMonthRevenue) / lastMonthRevenue) * 100;
    revenueGrowth = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(2)}%`;
  }

  // --- New Users This Month ---
  const newUsersThisMonthQuery = await database.query(
    `SELECT COUNT(*) 
     FROM users 
     WHERE created_at >= $1 
     AND role = 'User'`,
    [currentMonthStart]
  );
  const newUsersThisMonth = parseInt(newUsersThisMonthQuery.rows[0].count) || 0;

  // ✅ Final Response
  res.status(200).json({
    success: true,
    message: "Dashboard stats fetched successfully.",
    totalRevenueAllTime,
    todayRevenue,
    yesterdayRevenue,
    totalUsersCount,
    orderStatusCounts,
    monthlySales,
    currentMonthSales,
    topSellingProducts,
    lowStockProducts,
    revenueGrowth,
    newUsersThisMonth,
  });
});

export { getAllUser, deleteUser, dashboardStats };
