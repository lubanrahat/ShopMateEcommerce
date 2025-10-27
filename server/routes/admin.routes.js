import express from "express";
import {
  isAuthenticated,
  authorizedRoles,
} from "../middlewares/authMiddleware.js";
import {
  dashboardStats,
  deleteUser,
  getAllUser,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get(
  "/getallusers",
  isAuthenticated,
  authorizedRoles("Admin"),
  getAllUser
);

router.delete(
  "/delete/:id",
  isAuthenticated,
  authorizedRoles("Admin"),
  deleteUser
);

router.get(
  "/fetch/dashboard-stats",
  isAuthenticated,
  authorizedRoles("Admin"),
  dashboardStats
);

export default router;
