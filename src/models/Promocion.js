import mongoose from 'mongoose';

const promocionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^PRM[0-9]+$/
    },
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    descuentoPct: {
      type: Number,
      required: true,
      min: 1,
      max: 90
    },
    categoriaId: {
      type: String,
      default: null,
      trim: true
    },
    productoId: {
      type: String,
      default: null,
      trim: true
    },
    fechaInicio: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    fechaFin: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    }
  },
  {
    collection: 'promociones',
    versionKey: false
  }
);

export const Promocion = mongoose.models.Promocion || mongoose.model('Promocion', promocionSchema, 'promociones');
