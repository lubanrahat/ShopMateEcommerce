import app from "./app";
import ENV from "./config/env";
import initializeDatabase from "./db/db";

const PORT = ENV.PORT ?? 8080;

initializeDatabase();

app.listen(PORT,() => {
    console.log(`Server is running port ${PORT}`)
})