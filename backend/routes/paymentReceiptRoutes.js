// backend/routes/paymentReceiptRoutes.js
import express from "express";
import PDFDocument from "pdfkit";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

const router = express.Router();

/**

 * Generates a simple PDF receipt for the payment with given id
 * Streams PDF directly in response.
 */
router.get("/:id/receipt", async (req, res) => {
  try {
    const paymentId = req.params.id;
    if (!paymentId) return res.status(400).json({ success: false, message: "Payment id required" });

    const payment = await Payment.findById(paymentId)
      .populate("userId", "name phone email")
      .populate("bookingId", "floor room bed");

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    // Prepare filename
    const filename = `receipt-${paymentId}.pdf`;

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    // inline or attachment:
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Create PDF document
    const doc = new PDFDocument({ margin: 40 });

    // Pipe PDF stream to response
    doc.pipe(res);

    // --- Simple Clean Receipt layout (Option A) ---
    doc.fontSize(18).text("S.V PG Hostel for Gents", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).text("-----------------------------------------------------------", { align: "center" });
    doc.moveDown(1);

    // Payment / user fields
    const payerName = payment.userId?.name || "N/A";
    const phone = payment.userId?.phone || "N/A";
    const booking = payment.bookingId;
    const roomText = booking ? `Room ${booking.floor}${String(booking.room).padStart(2, "0")} - Bed ${booking.bed}` : "N/A";

    doc.fontSize(12).text(`Name: ${payerName}`);
    doc.moveDown(0.2);
    doc.text(`Phone: ${phone}`);
    doc.moveDown(0.2);
    doc.text(`Room / Bed: ${roomText}`);
    doc.moveDown(0.2);
    doc.text(`Amount Paid: ₹${payment.amount ?? 0}`);
    doc.moveDown(0.2);
    doc.text(`Payment Code: ${payment.code || "N/A"}`);
    doc.moveDown(0.2);
    doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
    doc.moveDown(1);

    doc.fontSize(10).text("-----------------------------------------------------------", { align: "center" });
    doc.moveDown(0.6);
    doc.fontSize(11).text("Thank you for your payment", { align: "center" });

    // Finalize PDF and end stream
    doc.end();
  } catch (err) {
    console.error("Receipt generation error:", err);
    // If headers not sent yet:
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Server error generating receipt" });
    } else {
      // fallback: close response
      res.end();
    }
  }
});

export default router;
