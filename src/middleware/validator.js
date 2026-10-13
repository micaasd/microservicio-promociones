/**
 * Validates query parameters for GET /items
 */
export function validateListItems(req, res, next) {
  const { categoriaId, productoId, vigente, fecha, limit, offset } = req.query;

  // Validate limit
  if (limit !== undefined) {
    if (typeof limit !== 'string' || !/^-?\d+$/.test(limit.trim())) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El parámetro limit debe estar entre 1 y 100.'
      });
    }
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El parámetro limit debe estar entre 1 y 100.'
      });
    }
  }

  // Validate offset
  if (offset !== undefined) {
    if (typeof offset !== 'string' || !/^-?\d+$/.test(offset.trim())) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El parámetro offset debe ser un número entero mayor o igual a 0.'
      });
    }
    const offsetNum = Number(offset);
    if (!Number.isInteger(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El parámetro offset debe ser un número entero mayor o igual a 0.'
      });
    }
  }

  // Validate categoriaId pattern: ^CAT[0-9]+$ (case-insensitive for flexible matching)
  if (categoriaId !== undefined) {
    if (typeof categoriaId !== 'string' || !/^CAT[0-9]+$/i.test(categoriaId.trim())) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El parámetro categoriaId debe cumplir el formato ^CAT[0-9]+$.'
      });
    }
  }

  // Validate productoId pattern: ^PRD[0-9]+$ (case-insensitive for flexible matching)
  if (productoId !== undefined) {
    if (typeof productoId !== 'string' || !/^PRD[0-9]+$/i.test(productoId.trim())) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El parámetro productoId debe cumplir el formato ^PRD[0-9]+$.'
      });
    }
  }

  // Validate vigente boolean: "true" or "false"
  if (vigente !== undefined) {
    const vLower = typeof vigente === 'string' ? vigente.trim().toLowerCase() : '';
    if (vLower !== 'true' && vLower !== 'false') {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El parámetro vigente debe ser true o false.'
      });
    }
  }

  // Validate fecha date format: YYYY-MM-DD
  if (fecha !== undefined) {
    if (typeof fecha !== 'string' || !isValidDateFormat(fecha.trim())) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'El parámetro fecha debe tener un formato válido YYYY-MM-DD.'
      });
    }
  }

  next();
}

/**
 * Helper to validate calendar date YYYY-MM-DD
 */
function isValidDateFormat(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return false;
  }
  const [year, month, day] = str.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
