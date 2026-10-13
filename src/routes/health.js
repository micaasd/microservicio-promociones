import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const isDbReady = mongoose.connection.readyState === 1;

    if (!isDbReady) {
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'Base de datos no conectada.'
      });
    }

    // Ping MongoDB to ensure cluster is responsive
    await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      status: 'ok',
      service: process.env.SERVICE_NAME || 'grupo-03-promociones',
      collection: 'promociones',
      version: '1.0.0'
    });
  } catch (error) {
    return res.status(503).json({
      error: 'service_unavailable',
      message: `Error al verificar estado de la base de datos: ${error.message}`
    });
  }
});

export default router;
