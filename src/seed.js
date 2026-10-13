import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from './config/db.js';
import { Promocion } from './models/Promocion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  try {
    await connectDB();

    const seedPath = path.resolve(__dirname, '../promociones.json');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Archivo de semilla no encontrado en: ${seedPath}`);
    }

    const data = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    console.log(`Leídos ${data.length} elementos de ${seedPath}`);

    for (const item of data) {
      await Promocion.updateOne(
        { id: item.id },
        { $set: item },
        { upsert: true }
      );
    }

    console.log(`✅ Base de datos sincronizada con éxito (${data.length} promociones).`);
  } catch (error) {
    console.error('❌ Error al ejecutar seed:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

seed();
