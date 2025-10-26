import { ErrorHandler } from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";

const createProduct = catchAsyncErrors(async (req, res, next) => {
  const { name, description, price, category, stock } = req.body;
  const created_by = req.user?.id;

  if (!name || !description || !price || !category || !stock) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  let updatedImages = [];

  if (req.files && req.files.images) {
    const images = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    for (const image of images) {
      const result = await cloudinary.uploader.upload(image.tempFilePath, {
        folder: "Ecommerce_Product_Images",
        width: 1000,
        crop: "scale",
      });

      updatedImages.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }
  }

  const product = await database.query(
    `INSERT INTO products 
      (name, description, price, category, stock, images, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
    [
      name,
      description,
      price,
      category,
      stock,
      JSON.stringify(updatedImages),
      created_by,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    product: product.rows[0],
  });
});

const fetchAllProducts = catchAsyncErrors(async (req, res, next) => {
  const { availability, price, category, ratings, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];
  let index = 1;

  // Availability filter
  if (availability === "in-stock") {
    conditions.push(`p.stock > 5`);
  } else if (availability === "limited") {
    conditions.push(`p.stock > 0 AND p.stock <= 5`);
  } else if (availability === "out-of-stock") {
    conditions.push(`p.stock = 0`);
  }

  // Price filter
  if (price) {
    const [minPrice, maxPrice] = price.split("-");
    if (minPrice && maxPrice) {
      conditions.push(`p.price BETWEEN $${index} AND $${index + 1}`);
      values.push(minPrice, maxPrice);
      index += 2;
    }
  }

  //Category filter
  if (category) {
    conditions.push(`p.category ILIKE $${index}`);
    values.push(`%${category}%`);
    index++;
  }

  //Ratings filter
  if (ratings) {
    conditions.push(`p.ratings >= $${index}`);
    values.push(ratings);
    index++;
  }

  //Search filter
  if (search) {
    conditions.push(
      `(p.name ILIKE $${index} OR p.description ILIKE $${index})`
    );
    values.push(`%${search}%`);
    index++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  //Get total products count
  const totalProductsResult = await database.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values
  );
  const totalProducts = parseInt(totalProductsResult.rows[0].count);

  //Pagination parameters
  values.push(limit, offset);

  //Fetch main products list
  const query = `
    SELECT 
      p.*, 
      COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT $${index} OFFSET $${index + 1};
  `;

  const result = await database.query(query, values);

  //Fetch newly added products (last 30 days)
  const newProductsQuery = `
    SELECT 
      p.*, 
      COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 8;
  `;
  const newProductResult = await database.query(newProductsQuery);

  //Fetch top rated products
  const topRatedQuery = `
    SELECT 
      p.*, 
      COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.ratings >= 4.5
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 8;
  `;
  const topRatedResult = await database.query(topRatedQuery);

  //Send response
  res.status(200).json({
    success: true,
    totalProducts,
    products: result.rows,
    newProducts: newProductResult.rows,
    topRatedProducts: topRatedResult.rows,
  });
});

const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { name, description, price, category, stock } = req.body;

  if (!name || !description || !price || !category || !stock) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const result = await database.query(
    `UPDATE products 
     SET name = $1, description = $2, price = $3, category = $4, stock = $5 
     WHERE id = $6 
     RETURNING *`,
    [name, description, price, category, stock, productId]
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    updatedProduct: result.rows[0],
  });
});

const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const images = product.rows[0].images;

  const deleteResult = await database.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [productId]
  );

  if (deleteResult.rows.length === 0) {
    return next(new ErrorHandler("Failed to delete product.", 500));
  }

  if (images && Array.isArray(images) && images.length > 0) {
    for (const image of images) {
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully.",
    deletedProduct: deleteResult.rows[0],
  });
});

const fetchSingleProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const result = await database.query(
    `
        SELECT p.*,
        COALESCE(
        json_agg(
        json_build_object(
            'review_id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'reviewer', json_build_object(
            'id', u.id,
            'name', u.name,
            'avatar', u.avatar
            )) 
        ) FILTER (WHERE r.id IS NOT NULL), '[]') AS reviews
         FROM products p
         LEFT JOIN reviews r ON p.id = r.product_id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE p.id  = $1
         GROUP BY p.id`,
    [productId]
  );

  res.status(200).json({
    success: true,
    message: "Product fetched successfully.",
    product: result.rows[0],
  });
});

const postProductReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    return next(new ErrorHandler("Please provide rating and comment.", 400));
  }

  const purchaseCheckQuery = `
    SELECT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN payments p ON p.order_id = o.id
    WHERE o.buyer_id = $1
      AND oi.product_id = $2
      AND p.payment_status = 'Paid'
    LIMIT 1;
  `;

  const { rows } = await database.query(purchaseCheckQuery, [
    req.user.id,
    productId,
  ]);

  if (rows.length === 0) {
    return res.status(403).json({
      success: false,
      message: "You can only review a product you've purchased.",
    });
  }

  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);

  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found!", 404));
  }

  await database.query("BEGIN");

  try {
    const existingReview = await database.query(
      "SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2",
      [productId, req.user.id]
    );

    let review;
    if (existingReview.rows.length > 0) {
      review = await database.query(
        "UPDATE reviews SET rating = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *",
        [rating, comment, productId, req.user.id]
      );
    } else {
      review = await database.query(
        "INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
        [productId, req.user.id, rating, comment]
      );
    }

    const allReviews = await database.query(
      "SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1",
      [productId]
    );

    const newAvgRating = parseFloat(allReviews.rows[0].avg_rating).toFixed(1);

    const updatedProduct = await database.query(
      "UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *",
      [newAvgRating, productId]
    );

    await database.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Review posted.",
      review: review.rows[0],
      product: updatedProduct.rows[0],
    });
  } catch (error) {
    await database.query("ROLLBACK");
    next(error);
  }
});

export {
  createProduct,
  fetchAllProducts,
  updateProduct,
  deleteProduct,
  fetchSingleProduct,
  postProductReview,
};
