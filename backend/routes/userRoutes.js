import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      phone,
      password: hashed
    });

    await newUser.save();

    res.json({
      success: true,
      message: "Registration successful",
      user: {
        _id: newUser._id,        // ✔ FIXED
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone
      }
    });


  } catch (err) {
    console.log("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & Password required" });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ message: "Invalid password" });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,          // ✔ FIXED
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });


  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
