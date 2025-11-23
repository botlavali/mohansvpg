// backend/routes/paymentRoutes.js
import express from "express";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import PDFDocument from "pdfkit";

const router = express.Router();

/* ------------------------------------------------------------------
   SAVE MANUAL PAYMENT
   POST /manual
------------------------------------------------------------------ */
router.post("/manual", async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      amount,
      code,
      name,
      phone,
      roomNumber,
      bedNumber,
    } = req.body;

    // Validate admin/payment code
    // Validate admin/payment code — keep same code as frontend
    if (!code || code.trim().toUpperCase() !== "CQNPV5241F0004") {
      return res.status(400).json({ success: false, message: "Invalid admin code" });
    }



    // If userId provided, ensure user exists
    const user = userId ? await User.findById(userId) : null;
    if (userId && !user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    let finalRoom = roomNumber || null;
    let finalBed = bedNumber || null;

    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(400).json({ success: false, message: "Booking not found" });
      }
      finalRoom = `${booking.floor}${String(booking.room).padStart(2, "0")}`;
      finalBed = booking.bed;
    }

    const payment = await Payment.create({
      userId: userId || null,
      bookingId: bookingId || null,
      amount,
      code: code.trim(),
      name: name || (user && (user.name || user.username)) || "Unknown",
      phone: phone || (user && user.phone) || "N/A",
      roomNumber: finalRoom,
      bedNumber: finalBed,
    });

    return res.json({ success: true, payment });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------------------
   USER PAYMENT HISTORY
   GET /user/:id
   Responds with { success: true, payments: [...] }
   Each payment includes populated bookingId and userId (when available)
------------------------------------------------------------------ */
router.get("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ success: false, message: "User id required" });

    const payments = await Payment.find({ userId })
      .populate({ path: "bookingId", select: "floor room bed name photo joinDate amountPaid" })
      .populate({ path: "userId", select: "name username email phone" })
      .sort({ createdAt: -1 });

    // normalize shape: ensure roomNumber/bedNumber exist using booking if missing
    const normalized = payments.map((p) => {
      const obj = p.toObject();
      if ((!obj.roomNumber || !obj.bedNumber) && obj.bookingId) {
        obj.roomNumber = `${obj.bookingId.floor}${String(obj.bookingId.room).padStart(2, "0")}`;
        obj.bedNumber = obj.bookingId.bed;
      }
      return obj;
    });

    return res.json({ success: true, payments: normalized });
  } catch (err) {
    console.error("PAYMENTS LOAD ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ------------------------------------------------------------------
   RECEIPT DOWNLOAD
   GET /:id/receipt
------------------------------------------------------------------ */
router.get("/:id/receipt", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("bookingId")
      .populate("userId");

    if (!payment) return res.status(404).json({ success: false, message: "Not found" });

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${payment._id}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text("S.V PG — Payment Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Receipt ID: ${payment._id}`);
    doc.text(`Date: ${payment.createdAt.toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Payer Details");
    doc.fontSize(12).text(`Name: ${payment.name}`);
    doc.text(`Phone: ${payment.phone}`);
    if (payment.userId) {
      const u = payment.userId;
      doc.text(`User: ${u.name || u.username || u.email}`);
    }
    doc.moveDown();

    doc.fontSize(14).text("Booking / Room");
    doc.fontSize(12).text(`Room: ${payment.roomNumber || (payment.bookingId ? `${payment.bookingId.floor}${String(payment.bookingId.room).padStart(2, "0")}` : "N/A")}`);
    doc.text(`Bed: ${payment.bedNumber || (payment.bookingId ? payment.bookingId.bed : "N/A")}`);
    if (payment.bookingId) doc.text(`Booked Name: ${payment.bookingId.name || "N/A"}`);
    doc.moveDown();

    doc.fontSize(14).text("Payment");
    doc.fontSize(12).text(`Amount: ₹${payment.amount}`);
    doc.text(`Admin Code: ${payment.code}`);

    doc.end();
  } catch (err) {
    console.error("Receipt error:", err);
    return res.status(500).json({ success: false, message: "Receipt generation failed" });
  }
});

/* ------------------------------------------------------------------
   DELETE PAYMENT
   DELETE /:id
------------------------------------------------------------------ */
router.delete("/:id", async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete payment error:", err);
    return res.status(500).json({ success: false, message: "Delete failed" });
  }
});

/* ------------------------------------------------------------------
   ADMIN — GET ALL (GROUPED)
------------------------------------------------------------------ */
router.get("/all", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("bookingId")
      .populate("userId")
      .sort({ createdAt: -1 });

    const grouped = {};

    payments.forEach((p) => {
      const uid = p.userId?._id?.toString() || "unknown";
      if (!grouped[uid]) {
        grouped[uid] = {
          userId: p.userId?._id || null,
          userName: p.userId?.name || p.name || "Unknown",
          phone: p.userId?.phone || p.phone || "N/A",
          payments: [],
          totalAmount: 0,
        };
      }
      grouped[uid].payments.push(p);
      grouped[uid].totalAmount += Number(p.amount || 0);
    });

    return res.json({ success: true, grouped: Object.values(grouped) });
  } catch (err) {
    console.error("PAYMENTS GROUP ERROR:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;
