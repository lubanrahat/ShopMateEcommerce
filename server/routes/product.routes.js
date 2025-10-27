import express from "express";
import {
  authorizedRoles,
  isAuthenticated,
} from "../middlewares/authMiddleware.js";
import {
  createProduct,
  deleteProduct,
  deleteReview,
  fetchAllProducts,
  fetchSingleProduct,
  postProductReview,
  updateProduct,
} from "../controllers/product.controller.js";

const router = express.Router();

router.post(
  "/admin/create",
  isAuthenticated,
  authorizedRoles("Admin"),
  createProduct
);

router.get("/", fetchAllProducts);

router.put(
  "/admin/update/:productId",
  isAuthenticated,
  authorizedRoles("Admin"),
  updateProduct
);

router.delete(
  "/admin/delete/:productId",
  isAuthenticated,
  authorizedRoles("Admin"),
  deleteProduct
);

router.get(
  "/singleProduct/:productId",
  isAuthenticated,
  authorizedRoles("Admin"),
  fetchSingleProduct
);

router.put("/post-new/review/:productId", isAuthenticated, postProductReview);

router.delete("/delete/review/:productId", isAuthenticated, deleteReview);

export default router;
