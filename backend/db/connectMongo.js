import mongoose from "mongoose";

const connectMongo = async () => {
    try {

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("Db connected");

    } catch(err) {
        console.error("error connecting to db");
        process.exit(1);
    }
}

export default connectMongo;