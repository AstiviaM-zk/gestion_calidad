import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load .env relative to backend directory regardless of execution context
dotenv.config({ path: path.join(__dirname, ".env") });

import authRouter from "./src/routes/auth.js";
import documentsRouter from "./src/routes/documents.js";
import rolesRouter from "./src/routes/roles.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRouter);
app.use("/api", documentsRouter);
app.use("/api", rolesRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor QMS Backend activo (Vite + Vue 3)", timestamp: new Date() });
});

// Middleware global de manejo de errores HTTP
app.use((err, req, res, next) => {
  console.error("❌ Error no controlado:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Error interno del servidor"
  });
});

app.use((req, res) => {
  const distIndex = path.join(__dirname, "dist", "index.html");
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.sendFile(path.join(__dirname, "index.html"));
  }
});

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 QMS Backend activo en: http://localhost:" + PORT);
  console.log("🔑 GOOGLE_CLIENT_ID cargado:", process.env.GOOGLE_CLIENT_ID ? "SÍ (" + process.env.GOOGLE_CLIENT_ID.slice(0, 15) + "...)" : "NO");
  console.log("=================================");
});
