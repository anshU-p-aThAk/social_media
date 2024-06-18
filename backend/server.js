import express from "express";
import authRoutes from "./routes/auth.route.js"
import dotenv from "dotenv";
import connectMongo from "./db/connectMongo.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true })) // to parse form data

app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(port, () => {
    console.log("Server is running");
    connectMongo();
})