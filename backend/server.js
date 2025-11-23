import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// ROUTES
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; 

dotenv.config();

// ⭐ CONNECT DB FIRST
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ⭐ REGISTER ROUTES
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);

// ⭐ SERVER TEST
app.get("/", (req, res) => {
  res.send("S.V PG Hostel Server Running ✔");
});

// ⭐ START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
