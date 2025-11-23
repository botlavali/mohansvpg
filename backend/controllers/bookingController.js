// backend/controllers/bookingController.js
import Booking from "../models/Booking.js";

export const createBooking = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      floor,
      room,
      bed,
      aadharNumber,
      emergency,
      joinDate,
      userId,
    } = req.body;

    // multer stores files in req.files
    const photo = req.files?.photo?.[0]?.path || "";
    const aadharFile = req.files?.aadharFile?.[0]?.path || "";

    const booking = new Booking({
      userId,
      name,
      phone,
      email,
      floor: Number(floor),
      room: Number(room),
      bed: Number(bed),
      aadharNumber,
      emergency,
      joinDate,
      photo,
      aadharFile,
    });

    await booking.save();
    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    console.error("❌ Booking creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("❌ Fetch bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Booking not found" });
    res.json(updated);
  } catch (error) {
    console.error("❌ Update booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (error) {
    console.error("❌ Delete booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
