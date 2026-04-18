import 'dotenv/config';
import mongoose from "mongoose";

//function to connect to the database
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Set it to your full Mongo connection string (include database name), e.g. mongodb://localhost:27017/luna");
    process.exit(1);
  }
  try {
    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });
    mongoose.connection.on("error", (err) => {
      console.error("Error connecting to MongoDB:", err);
    });
    await mongoose.connect(uri);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};