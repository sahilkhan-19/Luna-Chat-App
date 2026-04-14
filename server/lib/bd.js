import 'dotenv/config'; 
import mongoose from "mongoose";

//function to connect to the database
export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });
    mongoose.connection.on("error", (err) => {
      console.error("Error connecting to MongoDB:", err);
    });
    await mongoose.connect(`${process.env.MONGODB_URI}/luna`);
    } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    }
};