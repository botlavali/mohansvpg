import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },

    name: { type: String, required: true },
    phone: { type: String, required: true },
    roomNumber: { type: String, required: true },
    bedNumber: { type: Number, required: true },

    amount: { type: Number, required: true },
    code: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
