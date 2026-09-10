import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import "dotenv/config";
import authRouter from "./src/routes/auth.js";
import documentsRouter from "./src/routes/documents.js";
import rolesRouter from "./src/routes/roles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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
  console.log("=================================");
});
