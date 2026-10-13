import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'MS-Promociones'
    });
    console.log(' Conectado exitosamente a MongoDB Atlas (Base de datos: MS-Promociones)');
    return mongoose.connection;
  } catch (error) {
    console.error(' Error conectando a MongoDB Atlas:', error.message);
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}
