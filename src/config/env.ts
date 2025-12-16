import dotenv from "dotenv";
import path from "node:path";

dotenv.config({path: path.join(process.cwd(),".env")})

const ENV = {
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL
}

export default ENV;