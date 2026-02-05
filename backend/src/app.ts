import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import {
  generalLimiter,
  authLimiter,
  apiLimiter,
  helmetMiddleware,
  sanitizeInput,
  validateContentType,
  errorHandler,
} from "./middleware/security.js";

import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import partRoutes from "./routes/partRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import adminUsersRoutes from "./routes/adminUsers.routes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import suppliersRoutes from "./routes/suppliersRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmetMiddleware());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(generalLimiter);
app.use(validateContentType);
app.use(sanitizeInput);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminUsersRoutes);
app.use("/api/users", apiLimiter, userRoutes);

app.use("/api/orders", apiLimiter, orderRoutes);
app.use("/api/notifications", apiLimiter, notificationRoutes);
app.use("/api/customers", apiLimiter, customerRoutes);
app.use("/api/vehicles", apiLimiter, vehicleRoutes);
app.use("/api/appointments", apiLimiter, appointmentRoutes);
app.use("/api/parts", apiLimiter, partRoutes);
app.use("/api/invoices", apiLimiter, invoiceRoutes);
app.use("/api/messages", apiLimiter, messageRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);
app.use("/api/suppliers", apiLimiter, suppliersRoutes);
app.use("/api/schedule", apiLimiter, scheduleRoutes);

app.use(errorHandler);

export default app;
