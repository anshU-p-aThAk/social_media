import express from "express";
import authRoutes from "./routes/auth.route.js"
import dotenv from "dotenv";

import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js"
import { v2 as cloudinary } from "cloudinary";
import connectMongo from "./db/connectMongo.js";


dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true })) // to parse form data

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);


app.listen(port, () => {
    console.log("Server is running");
    connectMongo();
})