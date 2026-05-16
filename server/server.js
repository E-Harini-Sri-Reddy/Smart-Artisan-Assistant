import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js"; // Added the new orders route import

// Middleware Imports
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// 1. IMPROVED CORS: Ensure your Vite frontend (port 5173) is explicitly allowed
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

// 2. REQUEST PARSING: Essential for reading JSON from Google Auth fetch calls
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. LOGGING: Helpful for debugging 404s or 500s in the terminal
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 4. API ROUTES
app.use("/api/auth", authRoutes); // This handles the /api/auth/google endpoint
app.use("/api/payments", paymentRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes); // Mounted to match your MoneyFlow.jsx calls

// Root Route
app.get("/", (req, res) => {
  res.send("Smart Artisan Assistant API is Running...");
});

// 5. ERROR HANDLING
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 6. START SERVER with a check for the Google Client ID
app.listen(PORT, () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn("⚠️ WARNING: GOOGLE_CLIENT_ID is not defined in .env file!");
  }
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});