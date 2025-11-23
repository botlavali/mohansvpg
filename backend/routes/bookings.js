import express from "express";
import multer from "multer";
import Booking from "../models/Booking.js";

const router = express.Router();

/* -----------------------------------
   MULTER FILE UPLOAD
------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

/* -----------------------------------
   ROOM STRUCTURE (2 & 3 SHARING)
------------------------------------- */
const ROOM_STRUCTURE = {
  1: [2, 2, 3, 3, 2, 2],
  2: [2, 2, 3, 3, 2, 2],
  3: [2, 2, 3, 3, 2, 2],
  4: [2, 2, 3, 3, 2, 2],
  5: [2, 2, 3, 3, 2, 2],
  6: [2, 2, 3, 3],
};

/* -----------------------------------
   GET ALL BOOKINGS
------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -----------------------------------
   ROOM STATUS (BOOKED + AVAILABLE)
------------------------------------- */
router.get("/room-status", async (req, res) => {
  try {
    const { floor, room } = req.query;

    const totalBeds = ROOM_STRUCTURE[floor][room - 1];

    const bookedRecords = await Booking.find({
      floor,
      room,
    });

    const bookedBeds = bookedRecords.map((b) => ({
      bed: b.bed,
      name: b.name,
    }));

    const unavailableBedNumbers = bookedBeds.map((b) => b.bed);

    const available = [];
    for (let i = 1; i <= totalBeds; i++) {
      if (!unavailableBedNumbers.includes(i)) available.push(i);
    }

    res.json({
      success: true,
      totalBeds,
      booked: bookedBeds,
      available,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* -----------------------------------
   SHIFT BED
------------------------------------- */
router.post("/shift", async (req, res) => {
  try {
    const { bookingId, toFloor, toRoom, toBed } = req.body;

    const totalBeds = ROOM_STRUCTURE[toFloor][toRoom - 1];

    if (toBed < 1 || toBed > totalBeds) {
      return res.json({ success: false, message: "Invalid bed number" });
    }

    // Check if target bed is occupied
    const isTaken = await Booking.findOne({
      floor: toFloor,
      room: toRoom,
      bed: toBed,
    });

    if (isTaken) {
      return res.json({
        success: false,
        message: "Bed already booked by: " + isTaken.name,
      });
    }

    // Update booking
    await Booking.findByIdAndUpdate(bookingId, {
      floor: toFloor,
      room: toRoom,
      bed: toBed,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* -----------------------------------
   CREATE BOOKING
------------------------------------- */
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

      const totalBeds = ROOM_STRUCTURE[floor][room - 1];

      if (bed < 1 || bed > totalBeds) {
        return res
          .status(400)
          .json({ error: "Invalid bed for this room sharing type" });
      }

      const exists = await Booking.findOne({ floor, room, bed });
      if (exists)
        return res.status(400).json({ error: "Bed already booked" });

      const newBooking = new Booking({
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
        photo: req.files?.photo?.[0]?.path || "",
        aadharFile: req.files?.aadharFile?.[0]?.path || "",
      });

      await newBooking.save();
      res.status(201).json({ success: true, booking: newBooking });
    } catch (err) {
      console.error("Booking creation error:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

/* -----------------------------------
   DELETE BOOKING
------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
