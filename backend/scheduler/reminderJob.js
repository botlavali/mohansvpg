// backend/scheduler/reminderJob.js
import cron from "node-cron";
import Booking from "../models/Booking.js";
import { sendWhatsAppMessage } from "../services/whatsappService.js";

export function startMonthlyReminderJob() {
  // every day at 09:00
  cron.schedule("0 9 * * *", async () => {
    try {
      const now = new Date();
      const day = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      // run only in last 5 days (inclusive)
      if (day < daysInMonth - 4) return;

      const bookings = await Booking.find({ phone: { $exists: true, $ne: "" } });
      if (!bookings.length) return;

      console.log(`📅 Reminder job — sending to ${bookings.length} bookings`);

      for (const b of bookings) {
        const roomNo = `${b.floor}${String(b.room).padStart(2, "0")}`;
        const msg = `📅 Reminder from S.V PG:
Dear ${b.name}, your stay payment/renewal is due soon.
Room: ${roomNo}, Bed: ${b.bed}.
Please renew before month-end. Thank you!`;
        try {
          await sendWhatsAppMessage({ to: b.phone, message: msg });
          console.log(`✅ Reminder sent to ${b.phone}`);
        } catch (e) {
          console.warn(`⚠️ Failed reminder for ${b.phone}:`, e.message || e);
        }
      }
    } catch (err) {
      console.error("❌ Reminder job error:", err);
    }
  });
}
