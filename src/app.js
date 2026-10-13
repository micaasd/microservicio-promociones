import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import itemsRouter from './routes/items.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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
