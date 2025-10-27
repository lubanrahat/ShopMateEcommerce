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
    
});

export { getAllUser, deleteUser, dashboardStats };
