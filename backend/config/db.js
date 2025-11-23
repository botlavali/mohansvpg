import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URL;

    if (!uri) {
      console.error("❌ ERROR: MONGO_URL missing in .env file");
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
