import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    altPhone: { type: String }, // ✅ alternate number added
    email: { type: String },
    aadharNumber: { type: String },
    joinDate: { type: Date, required: true },
    floor: { type: String, required: true },
    room: { type: String, required: true },
    bed: { type: String, required: true },
    userId: { type: String },
    amountPaid: { type: Number, default: 0 },
    photo: { type: String },
    aadharFile: { type: String },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
