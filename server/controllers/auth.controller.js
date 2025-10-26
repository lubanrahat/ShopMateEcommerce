import { ErrorHandler } from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import bcrypt from "bcryptjs";
import { sendToken } from "../utils/jwtToken.js";
import { generateResetPasswordToken } from "../utils/generateResetPasswordToken.js";
import { generateEmailTemplate } from "../utils/generateForgotPasswordEmailTemplate.js";
import { sendMaile } from "../utils/sendMail.js";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  if (password.length < 8 || password.length > 16) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400)
    );
  }

  const isAlreadyRegistered = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (isAlreadyRegistered.rows.length > 0) {
    return next(new ErrorHandler("Email already registered", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await database.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, email, hashedPassword]
  );

  sendToken(user.rows[0], 201, "User registered successfully", res);
});

const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const user = await database.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid email or password", 400));
  }

  const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid email or password", 400));
  }

  sendToken(user.rows[0], 200, "User logged in successfully", res);
});

const getUser = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const { frontendUrl } = req.query;

  const userResult = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  const user = userResult.rows[0];
  const { resetToken, hashedToken, resetPasswordExpireTime } =
    generateResetPasswordToken();

  await database.query(
    `UPDATE users 
     SET reset_password_token = $1, 
         reset_password_expire = to_timestamp($2) 
     WHERE email = $3`,
    [hashedToken, resetPasswordExpireTime / 1000, email]
  );

  const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}`;
  const message = generateEmailTemplate(resetPasswordUrl);

  try {
    await sendMaile({
      email: user.email,
      subject: "Ecommerce Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    await database.query(
      `UPDATE users 
       SET reset_password_token = NULL, 
           reset_password_expire = NULL 
       WHERE email = $1`,
      [user.email]
    );

    console.error("Failed to send email:", error.message);

    return next(
      new ErrorHandler(
        "Failed to send password recovery email. Please try again later.",
        500
      )
    );
  }
});

const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const userResult = await database.query(
    `SELECT * FROM users 
     WHERE reset_password_token = $1 
       AND reset_password_expire > NOW()`,
    [resetPasswordToken]
  );

  if (userResult.rows.length === 0) {
    return next(new ErrorHandler("Invalid or expired reset token.", 400));
  }

  const user = userResult.rows[0];
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match.", 400));
  }

  if (
    password?.length < 8 ||
    password?.length > 16 ||
    confirmPassword?.length < 8 ||
    confirmPassword?.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await database.query(
    `UPDATE users 
     SET password = $1, 
         reset_password_token = NULL, 
         reset_password_expire = NULL 
     WHERE id = $2 
     RETURNING *`,
    [hashedPassword, user.id]
  );

  sendToken(updatedUser.rows[0], 200, "Password reset successfully", res);
});

const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const isPasswordMatch = await bcrypt.compare(
    currentPassword,
    req.user.password
  );

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Current password is incorrect.", 401));
  }

  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("New passwords do not match.", 400));
  }

  if (newPassword.length < 8 || newPassword.length > 16) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await database.query("UPDATE users SET password = $1 WHERE id = $2", [
    hashedPassword,
    req.user.id,
  ]);

  res
    .status(200)
    .cookie("token", "", { expires: new Date(0), httpOnly: true })
    .json({
      success: true,
      message: "Password updated successfully. Please log in again.",
    });
});

const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, email } = req.body;

  if (
    !name ||
    !email ||
    name.trim().length === 0 ||
    email.trim().length === 0
  ) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  let avatarData = {};

  if (req.files && req.files.avatar) {
    const { avatar } = req.files;

    if (req.user?.avatar?.public_id) {
      await cloudinary.uploader.destroy(req.user.avatar.public_id);
    }

    const newProfileImage = await cloudinary.uploader.upload(
      avatar.tempFilePath,
      {
        folder: "Ecommerce_Avatars",
        width: 150,
        crop: "scale",
      }
    );

    avatarData = {
      public_id: newProfileImage.public_id,
      url: newProfileImage.secure_url,
    };
  }

  let user;

  if (Object.keys(avatarData).length === 0) {
    user = await database.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [name, email, req.user.id]
    );
  } else {
    user = await database.query(
      "UPDATE users SET name = $1, email = $2, avatar = $3 WHERE id = $4 RETURNING *",
      [name, email, avatarData, req.user.id]
    );
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: user.rows[0],
  });
});

export {
  register,
  login,
  getUser,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateProfile,
};
