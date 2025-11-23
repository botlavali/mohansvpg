import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // ✅ Validate all fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user instance
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
    });

    // ✅ Save user to DB
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Register Error:", error.message);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};
