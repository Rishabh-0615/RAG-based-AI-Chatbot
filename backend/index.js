import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import connectDb from "./database/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;
const normalizeOrigin = (value = "") => {
  const cleaned = value.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");

  if (!cleaned) {
    return "";
  }

  try {
    return new URL(cleaned).origin.toLowerCase();
  } catch {
    return cleaned.toLowerCase();
  }
};

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0) {
      return callback(null, true);
    }

    const requestOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, service: "rag-chatbot-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", chatRoutes);

connectDb().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
