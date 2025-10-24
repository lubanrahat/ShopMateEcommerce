class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
  }
}

const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    err = new ErrorHandler(message, 400);
  }
  if (err.name === "JsonWebTokenError") {
    const message = "JSON web Token is invalid, try again";
    err = new ErrorHandler(message, 400);
  }
  if (err.name === "TokenExpiredError") {
    const message = "TokenExpiredError has expired, try again";
    err = new ErrorHandler(message, 400);
  }
  const errorMessage = err.errors
    ? Object.values(err.errors)
        .map((error) => error.message)
        .join(" ")
    : err.message;
  return res.status(err.statusCode).json({
    success: false,
    message: errorMessage,
  });
};

export { ErrorHandler, errorMiddleware };
