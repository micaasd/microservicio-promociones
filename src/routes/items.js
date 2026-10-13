import express from 'express';
import { Promocion } from '../models/Promocion.js';
import { validateListItems } from '../middleware/validator.js';
import { formatItem } from '../utils/format.js';

const router = express.Router();

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /items
 * Lista de promociones con filtros, ordenadas por id ascendente y paginadas.
 */
router.get('/', validateListItems, async (req, res, next) => {
  try {
    const { categoriaId, productoId, vigente, fecha, limit, offset } = req.query;

    const andConditions = [];

    // Filtro por categoriaId (igualdad exacta sin distinguir mayúsculas)
    if (categoriaId !== undefined) {
      andConditions.push({
        categoriaId: { $regex: `^${escapeRegex(categoriaId.trim())}$`, $options: 'i' }
      });
    }

    // Filtro por productoId (igualdad exacta sin distinguir mayúsculas)
    if (productoId !== undefined) {
      andConditions.push({
        productoId: { $regex: `^${escapeRegex(productoId.trim())}$`, $options: 'i' }
      });
    }

    // Filtro por vigente
    if (vigente !== undefined) {
      const isVigente = vigente.trim().toLowerCase() === 'true';
      const evalDate = fecha ? fecha.trim() : new Date().toISOString().slice(0, 10);

      if (isVigente) {
        andConditions.push({
          fechaInicio: { $lte: evalDate },
          fechaFin: { $gte: evalDate }
        });
      } else {
        andConditions.push({
          $or: [
            { fechaInicio: { $gt: evalDate } },
            { fechaFin: { $lt: evalDate } }
          ]
        });
      }
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const parsedLimit = limit !== undefined ? Number(limit) : 20;
    const parsedOffset = offset !== undefined ? Number(offset) : 0;

    const total = await Promocion.countDocuments(filter);
    const docs = await Promocion.find(filter)
      .sort({ id: 1 })
      .skip(parsedOffset)
      .limit(parsedLimit)
      .lean();

    const items = docs.map(formatItem);

    return res.status(200).json({
      items,
      total,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /items/:id
 * Detalle de una promoción por id.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await Promocion.findOne({
      id: { $regex: `^${escapeRegex(id.trim())}$`, $options: 'i' }
    }).lean();

    if (!doc) {
      return res.status(404).json({
        error: 'not_found',
        message: `No existe ${id}.`
      });
    }

    return res.status(200).json(formatItem(doc));
  } catch (error) {
    next(error);
  }
});

export default router;
