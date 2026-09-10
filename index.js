import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import authRouter from './src/routes/auth.js';
import documentsRouter from './src/routes/documents.js';
import rolesRouter from './src/routes/roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos de la interfaz web
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', authRouter);
app.use('/api', documentsRouter);
app.use('/api', rolesRouter);

// Endpoint de verificación de estado
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor QMS Backend operativo', timestamp: new Date() });
});

// Captura para rutas SPA (fallback al final del pipeline)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 QMS Backend activo en: http://localhost:${PORT}`);
  console.log(`=================================`);
});
