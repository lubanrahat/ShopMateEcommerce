import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const ENV = {
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DASHBOARD_URL: process.env.DASHBOARD_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  COOKIE_EXPIRES_IN: process.env.COOKIE_EXPIRES_IN,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  SMTP_SERVICE: process.env.SMTP_SERVICE,
  SMTP_MAIL: process.env.SMTP_MAIL,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLOUDINARY_CLIENT_NAME: process.env.CLOUDINARY_CLIENT_NAME,
  CLOUDINARY_CLIENT_API: process.env.CLOUDINARY_CLIENT_API,
  CLOUDINARY_CLIENT_SECRET: process.env.CLOUDINARY_CLIENT_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_FRONTEND_KEY: process.env.STRIPE_FRONTEND_KEY,
};

export default ENV;
