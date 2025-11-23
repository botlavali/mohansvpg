import express from "express";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

const router = express.Router();

/* ----------------------------------
   SIMPLE ADMIN LOGIN
------------------------------------ */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const ADMIN_EMAIL = "mohansvpg@gmail.com";
  const ADMIN_PASSWORD = "Mohansvpg@123";

  if (email !== ADMIN_EMAIL)
    return res.status(400).json({ success: false, message: "Admin not found" });

  if (password !== ADMIN_PASSWORD)
    return res.status(400).json({ success: false, message: "Incorrect password" });

  const token = jwt.sign(
    { id: "ADMIN", role: "admin" },
    process.env.ADMIN_JWT_SECRET || "AdminSecretKey",
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    message: "Admin login success",
    token,
    admin: { name: "Admin", email: ADMIN_EMAIL }
  });
});

/* ----------------------------------
   ADMIN AUTH MIDDLEWARE
------------------------------------ */
function adminAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const token = header.split(" ")[1];
    jwt.verify(token, process.env.ADMIN_JWT_SECRET || "AdminSecretKey");
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/* ----------------------------------
   ADMIN OVERVIEW (DASHBOARD)
------------------------------------ */
router.get("/overview", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalPayments = await Payment.countDocuments();

    const totalAmountAgg = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalRevenue = totalAmountAgg.length ? totalAmountAgg[0].total : 0;

    res.json({
      success: true,
      totalUsers,
      totalBookings,
      totalPayments,
      totalRevenue
    });
  } catch (err) {
    console.error("Overview Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
