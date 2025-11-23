// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Resolve dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ROUTES
import usersRouter from "./routes/users.js";
import bookingsRouter from "./routes/bookings.js";
import paymentsRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";

const app = express();

/* --------------------------------------------------
   HELMET FIX FOR IMAGES
-------------------------------------------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* --------------------------------------------------
   CORS — PRODUCTION + LOCAL DEVELOPMENT
-------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://mohansvpg-frontend.onrender.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Allow valid origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Block invalid origins
      return callback(new Error("CORS blocked for origin: " + origin));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Handle preflight everywhere
app.options("*", cors());

/* --------------------------------------------------
   BODY PARSER
-------------------------------------------------- */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

/* --------------------------------------------------
   STATIC FILES
-------------------------------------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* --------------------------------------------------
   ROUTES
-------------------------------------------------- */
app.use("/users", usersRouter);
app.use("/bookings", bookingsRouter);
app.use("/payments", paymentsRouter);
app.use("/admin", adminRouter);

/* --------------------------------------------------
   HEALTH CHECK
-------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({ success: true, message: "SV PG Backend Running" });
});

/* --------------------------------------------------
   MONGODB CONNECTION
-------------------------------------------------- */
const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 5000;

if (!MONGO_URL) {
  console.error("❌ ERROR: MONGO_URL missing in Render Environment");
  process.exit(1);
}

async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGO_URL);
    console.log("📦 MongoDB Connected → " + conn.connection.host);

    app.listen(PORT, () => {
      console.log(`🚀 Server Running → http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    console.log("Retrying in 3 seconds...");
    setTimeout(connectDB, 3000);
  }
}

connectDB();
