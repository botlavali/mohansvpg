const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  beds: [{ number: Number, isBooked: { type: Boolean, default: false } }],
});

module.exports = mongoose.model("Room", roomSchema);
