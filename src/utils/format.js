/**
 * Formats a promotion document according to the OpenAPI Item schema.
 * Ensures only the schema fields are exposed and nullability is respected.
 * 
 * @param {object} doc - Mongoose document or raw Mongo object
 * @returns {object} Formatted Item
 */
export function formatItem(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    nombre: doc.nombre,
    descuentoPct: doc.descuentoPct,
    categoriaId: doc.categoriaId !== undefined ? doc.categoriaId : null,
    productoId: doc.productoId !== undefined ? doc.productoId : null,
    fechaInicio: doc.fechaInicio,
    fechaFin: doc.fechaFin
  };
}
