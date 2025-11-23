import express from "express";
import multer from "multer";
import Booking from "../models/Booking.js";

const router = express.Router();

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });

// Get all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create booking
router.post(
  "/",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "aadharFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        phone,
        email,
        aadharNumber,
        joinDate,
        floor,
        room,
        bed,
        userId,
        amountPaid,
      } = req.body;

      const photo = req.files?.photo?.[0]?.path || "";
      const aadharFile = req.files?.aadharFile?.[0]?.path || "";

      const booking = new Booking({
        name,
        phone,
        email,
        aadharNumber,
        joinDate,
        floor,
        room,
        bed,
        userId,
        amountPaid,
        photo,
        aadharFile,
      });

      await booking.save();

      // Email confirmation


      res.json({ success: true, data: booking });
    } catch (err) {
      console.error("Booking error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);
// ✔ Get available beds for a specific floor + room
router.get("/available", async (req, res) => {
  try {
    const { floor, room } = req.query;

    if (!floor || !room) {
      return res.status(400).json({ success: false, message: "Missing floor or room" });
    }

    // Find existing bookings
    const booked = await Booking.find({ floor, room }).select("bed");

    // roomStructure same as frontend
    const structure = {
      1: [2,2,3,3,2,2],
      2: [2,2,3,3,2,2],
      3: [2,2,3,3,2,2],
      4: [2,2,3,3,2,2],
      5: [2,2,3,3,2,2],
      6: [2,2,3,3]
    };

    const bedsInRoom = structure[floor][room - 1];

    // all beds (1,2,...)
    const allBeds = Array.from({ length: bedsInRoom }, (_, i) => i + 1);

    const bookedBeds = booked.map(b => b.bed);

    const available = allBeds.filter(b => !bookedBeds.includes(b));

    res.json({ success: true, available });
  } catch (err) {
    console.error("AVAILABLE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// ✔ Shift a booking to new floor/room/bed
router.post("/shift", async (req, res) => {
  try {
    const { bookingId, toFloor, toRoom, toBed } = req.body;

    if (!bookingId || !toFloor || !toRoom || !toBed) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    // Check if target bed is free
    const exists = await Booking.findOne({
      floor: toFloor,
      room: toRoom,
      bed: toBed,
    });

    if (exists) {
      return res.status(400).json({ success: false, message: "Bed already booked" });
    }

    const updated = await Booking.findByIdAndUpdate(
      bookingId,
      { floor: toFloor, room: toRoom, bed: toBed },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Shifted successfully", updated });
  } catch (err) {
    console.error("SHIFT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.json({ success: false, message: "Not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export default router;
