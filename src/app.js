import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRouter from './routes/health.js';
import itemsRouter from './routes/items.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.resolve(__dirname, '../public');
const openApiPath = path.resolve(__dirname, '../promociones.yaml');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

// Landing page
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// OpenAPI Spec file
app.get('/openapi.yaml', (_req, res) => {
  res.sendFile(openApiPath);
});

// Routes
app.use('/health', healthRouter);
app.use('/items', itemsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Ruta no encontrada.'
  });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Unhandled Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.code || 'internal_error',
    message: err.message || 'Error interno del servidor.'
  });
});

export default app;
