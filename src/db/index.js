// src/db/connectDB.js

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `\n✅ MongoDB connected to DB "${DB_NAME}" at host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("❌ MongoDB Connection error:", error?.message);
    process.exit(1);
  }
};

export default connectDB;
