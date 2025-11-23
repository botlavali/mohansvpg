import mongoose from "mongoose";
const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
}, { timestamps: true });
export default mongoose.model("Admin", adminSchema);
