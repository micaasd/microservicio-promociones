import dotenv from 'dotenv';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Microservicio de promociones escuchando en http://localhost:${PORT}`);
      console.log(`📡 GET /health -> Estado del servicio`);
      console.log(`🏷️ GET /items  -> Listado de promociones`);
    });

    const shutdown = async (signal) => {
      console.log(`\n🛑 Recibido ${signal}. Cerrando servidor gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('✅ Servidor finalizado.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Error al iniciar el microservicio:', error);
    process.exit(1);
  }
}

startServer();
