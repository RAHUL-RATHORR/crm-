// CRM Server v1.0.3 - Final Paper Details Sync
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { readCache, writeCache, enqueueRequest, processQueue } from './utils/syncManager.js';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ENV
dotenv.config({ path: path.join(__dirname, ".env") });

// Debug
console.log("------------------------------------------");
console.log(`📡 ENV CHECK: ${process.env.MONGO_URI ? 'MONGO_URI set' : 'MONGO_URI missing'}`);
console.log(`📡 PORT: ${process.env.PORT || '5011 (default)'}`);
console.log("------------------------------------------");

// Routes
import jobCardRoutes from "./routes/jobCardRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import challanRoutes from "./routes/challanRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paperStockRoutes from "./routes/paperStockRoutes.js";
import statementRoutes from "./routes/statementRoutes.js";
import estimateRoutes from "./routes/estimateRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import recentDeletedRoutes from "./routes/recentDeletedRoutes.js";
import { seedStaffAndRoles } from "./utils/seedStaff.js";
import { reconcilePaperStockFromJobs } from "./utils/paperStockDeduction.js";

const app = express();
app.use(cors());
app.use(express.json());

/* ================= OFFLINE SYNC MIDDLEWARE ================= */
app.use((req, res, next) => {
  // Only apply offline sync in the Desktop App context and for API routes
  if (process.env.IS_ELECTRON !== 'true' || !req.path.startsWith('/api') || req.headers['x-offline-sync']) {
    return next();
  }

  // If connected, intercept GET responses to cache them
  if (mongoose.connection.readyState === 1) {
    if (req.method === 'GET') {
      const originalSend = res.send;
      res.send = function (data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            writeCache(req.originalUrl, JSON.parse(data));
          } catch (err) {} // Ignore parse errors
        }
        originalSend.apply(res, arguments);
      };
    }
    return next();
  }

  // Mongoose is Disconnected
  if (req.method === 'GET') {
    const cachedData = readCache(req.originalUrl);
    if (cachedData) {
      return res.status(200).json(cachedData);
    } else {
      // Send empty array or object as fallback based on typical responses
      return res.status(200).json([]);
    }
  } else {
    // POST, PUT, DELETE
    const queuedResponse = enqueueRequest(req);
    if (queuedResponse) {
      return res.status(200).json(queuedResponse);
    } else {
      return res.status(500).json({ error: "Offline mode: Failed to enqueue request." });
    }
  }
});

/* ================= DB CONNECT ================= */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB Connected Successfully");
        await seedStaffAndRoles();
        console.log("✅ Staff roles seeded");
        const reconciled = await reconcilePaperStockFromJobs();
        if (reconciled > 0) {
            console.log(`🔁 Reconciled ${reconciled} paper stock record(s) from job cards`);
        }
    } catch (error) {
        console.error("❌ MongoDB Error:", error.message);
    }
};

/* ================= ROUTES ================= */
app.use("/api/jobcard", jobCardRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/challan", challanRoutes);
app.use("/api/payment-type", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/paper-stock", paperStockRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/estimate", estimateRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/recent-deleted", recentDeletedRoutes);

// API Test Route (Internal)
app.get("/api/health", (req, res) => {
    res.json({
        status: "Active",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        message: "CRM API running stable 🚀"
    });
});

app.get('/ping', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is alive'
    });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

/* ================= STATIC FILES & SPA ROUTING ================= */
const distPath = path.join(__dirname, "..", "dist");

// Serve static assets
app.use(express.static(distPath));

// SPA fallback (Express 4 + 5 compatible — avoids invalid "*" route on Express 5)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }

  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Frontend build not found. Please run 'npm run build'.");
    }
  });
});

/* ================= SERVER START ================= */
const startServer = (port) => {
    const host = process.env.HOST || '0.0.0.0';
    const server = app.listen(port, host, () => {
        console.log(`🚀 Server running on ${host}:${port}`);
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE" && process.env.NODE_ENV !== 'production') {
            console.warn(`⚠️ Port ${port} busy, trying ${port + 1}`);
            startServer(port + 1);
        } else {
            console.error("Critical Server Error:", err);
            process.exit(1);
        }
    });

    process.on("SIGINT", () => { server.close(); process.exit(); });
    process.on("SIGTERM", () => { server.close(); process.exit(); });
};

/* ================= INIT ================= */
const PORT = process.env.PORT || 5011;

connectDB();      // ✅ ONLY ONE TIME
startServer(PORT);

if (process.env.IS_ELECTRON === 'true') {
  setInterval(() => {
    processQueue(mongoose);
  }, 10000);
}