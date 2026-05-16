import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";

// Middleware Imports
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ES module path resolution equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. CORS CONFIGURATION
const allowedOrigins = [
  "http://localhost:5173",
  "https://smart-artisan-assistant-bn96.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// 2. REQUEST PARSING
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. LOGGING
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 4. SERVE FRONTEND STATIC ASSETS FIRST (For Production Environments)
if (process.env.NODE_ENV === "production" || process.env.PORT) {
  app.use(express.static(path.join(__dirname, "../client/dist")));
}

// 5. API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);

// 6. SPA FALLBACK ROUTING
if (process.env.NODE_ENV === "production" || process.env.PORT) {
  // FIXED: Changed '*' to '*path' to support Express 5 / path-to-regexp parsing safely
  app.get("*path", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
} else {
  // Fallback Root Route for local development API testing
  app.get("/", (req, res) => {
    res.send("Smart Artisan Assistant API is Running in development mode...");
  });
}

// 7. ERROR HANDLING MIDDLEWARES
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 8. START SERVER
app.listen(PORT, () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn("⚠️ WARNING: GOOGLE_CLIENT_ID is not defined in .env file!");
  }
  console.log(
    `Server running in ${process.env.NODE_ENV || "production"} mode on port ${PORT}`,
  );
});
