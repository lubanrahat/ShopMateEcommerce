import app from "./app.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

const PORTS = process.env.PORTS || 8000;

app.listen(PORTS, () => {
  console.log(`Server is running on port: ${PORTS}`);
});
