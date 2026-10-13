import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

let db;

async function runTests() {
  console.log('🧪 Iniciando suite de pruebas para Microservicio de Promociones...\n');
  db = await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  try {
    // ==========================================
    // 1. GET /health
    // ==========================================
    console.log('--- 1. Pruebas de GET /health ---');
    const healthRes = await request(app).get('/health');
    assert(healthRes.status === 200, `Health responde 200 (actual: ${healthRes.status})`);
    assert(healthRes.body.status === 'ok', `status es 'ok' (actual: ${healthRes.body.status})`);
    assert(healthRes.body.collection === 'promociones', `collection es 'promociones' (actual: ${healthRes.body.collection})`);
    assert(typeof healthRes.body.service === 'string', `service es un string`);
    assert(healthRes.body.version === '1.0.0', `version es '1.0.0'`);

    // ==========================================
    // 2. GET /items (Listado básico y formato OpenAPI)
    // ==========================================
    console.log('\n--- 2. Pruebas de GET /items (Listado básico) ---');
    const itemsRes = await request(app).get('/items');
    assert(itemsRes.status === 200, `Responde 200`);
    assert(Array.isArray(itemsRes.body.items), `items es un array`);
    assert(itemsRes.body.total === 12, `total es 12 (actual: ${itemsRes.body.total})`);
    assert(itemsRes.body.limit === 20, `limit por defecto es 20`);
    assert(itemsRes.body.offset === 0, `offset por defecto es 0`);
    assert(itemsRes.body.items.length === 12, `Devuelve 12 elementos`);

    // Comprobar ordenamiento por id ascendente
    const ids = itemsRes.body.items.map(item => item.id);
    const sortedIds = [...ids].sort();
    assert(JSON.stringify(ids) === JSON.stringify(sortedIds), `Los elementos están ordenados por id ascendente`);

    // Comprobar esquema Item en el primer elemento
    const item0 = itemsRes.body.items[0];
    assert(item0._id === undefined, `No incluye el campo _id de Mongo`);
    assert(item0.__v === undefined, `No incluye el campo __v de Mongoose`);
    assert(/^PRM[0-9]+$/.test(item0.id), `id cumple con ^PRM[0-9]+$ (${item0.id})`);
    assert(typeof item0.nombre === 'string', `nombre es string`);
    assert(typeof item0.descuentoPct === 'number' && item0.descuentoPct >= 1 && item0.descuentoPct <= 90, `descuentoPct está entre 1 y 90`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(item0.fechaInicio), `fechaInicio tiene formato YYYY-MM-DD`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(item0.fechaFin), `fechaFin tiene formato YYYY-MM-DD`);
    assert((item0.categoriaId !== null && item0.productoId === null) || (item0.categoriaId === null && item0.productoId !== null), `Aplica exactamente a categoriaId o a productoId`);

    // ==========================================
    // 3. Paginación (limit y offset)
    // ==========================================
    console.log('\n--- 3. Pruebas de paginación ---');
    const page1 = await request(app).get('/items?limit=5&offset=0');
    assert(page1.status === 200, `limit=5&offset=0 responde 200`);
    assert(page1.body.items.length === 5, `Devuelve 5 elementos`);
    assert(page1.body.limit === 5 && page1.body.offset === 0, `Metadatos limit=5 y offset=0 correctos`);
    assert(page1.body.total === 12, `total se mantiene en 12 sin verse afectado por la paginación`);

    const page2 = await request(app).get('/items?limit=5&offset=5');
    assert(page2.body.items.length === 5, `Página 2 devuelve 5 elementos`);
    assert(page2.body.items[0].id !== page1.body.items[0].id, `Página 2 tiene elementos distintos a Página 1`);

    const page3 = await request(app).get('/items?limit=5&offset=10');
    assert(page3.body.items.length === 2, `Página 3 devuelve los últimos 2 elementos`);

    const pageBeyond = await request(app).get('/items?limit=5&offset=50');
    assert(pageBeyond.body.items.length === 0, `Offset fuera de rango devuelve array vacío`);
    assert(pageBeyond.body.total === 12, `Total sigue siendo 12`);

    // ==========================================
    // 4. Filtro por categoriaId
    // ==========================================
    console.log('\n--- 4. Pruebas de filtro por categoriaId ---');
    const catRes = await request(app).get('/items?categoriaId=CAT03');
    assert(catRes.status === 200, `categoriaId=CAT03 responde 200`);
    assert(catRes.body.total === 2, `total es 2 para CAT03 (actual: ${catRes.body.total})`);
    assert(catRes.body.items.every(i => i.categoriaId === 'CAT03'), `Todos tienen categoriaId=CAT03`);

    // Case-insensitivity
    const catLowerRes = await request(app).get('/items?categoriaId=cat03');
    assert(catLowerRes.status === 200, `categoriaId=cat03 responde 200`);
    assert(catLowerRes.body.total === 2, `Case-insensitive funciona igual (total: 2)`);

    // Sin coincidencias
    const catEmptyRes = await request(app).get('/items?categoriaId=CAT999');
    assert(catEmptyRes.status === 200, `categoriaId inexistente responde 200`);
    assert(catEmptyRes.body.total === 0 && catEmptyRes.body.items.length === 0, `Devuelve total 0 y lista vacía`);

    // ==========================================
    // 5. Filtro por productoId
    // ==========================================
    console.log('\n--- 5. Pruebas de filtro por productoId ---');
    const prodRes = await request(app).get('/items?productoId=PRD005');
    assert(prodRes.status === 200, `productoId=PRD005 responde 200`);
    assert(prodRes.body.total === 1, `total es 1 para PRD005 (actual: ${prodRes.body.total})`);
    assert(prodRes.body.items[0].productoId === 'PRD005', `El productoId coincide`);

    // Case-insensitivity
    const prodLowerRes = await request(app).get('/items?productoId=prd005');
    assert(prodLowerRes.status === 200, `productoId=prd005 case-insensitive responde 200`);
    assert(prodLowerRes.body.total === 1, `Case-insensitive coincide exactamente`);

    // ==========================================
    // 6. Filtro por vigente y fecha
    // ==========================================
    console.log('\n--- 6. Pruebas de vigente y fecha ---');
    // Para fecha 2026-10-13, hay 7 vigentes y 5 no vigentes
    const vigentesRes = await request(app).get('/items?vigente=true&fecha=2026-10-13');
    assert(vigentesRes.status === 200, `vigente=true responde 200`);
    assert(vigentesRes.body.total === 7, `total vigentes en 2026-10-13 es 7 (actual: ${vigentesRes.body.total})`);
    assert(
      vigentesRes.body.items.every(i => i.fechaInicio <= '2026-10-13' && i.fechaFin >= '2026-10-13'),
      `Cada elemento cumple fechaInicio <= fecha <= fechaFin`
    );

    const noVigentesRes = await request(app).get('/items?vigente=false&fecha=2026-10-13');
    assert(noVigentesRes.status === 200, `vigente=false responde 200`);
    assert(noVigentesRes.body.total === 5, `total no vigentes en 2026-10-13 es 5 (actual: ${noVigentesRes.body.total})`);
    assert(
      noVigentesRes.body.items.every(i => i.fechaInicio > '2026-10-13' || i.fechaFin < '2026-10-13'),
      `Cada elemento no vigente cumple fechaInicio > fecha OR fechaFin < fecha`
    );

    assert(vigentesRes.body.total + noVigentesRes.body.total === 12, `Suma de vigentes y no vigentes es 12`);

    // Combinación de filtros (AND)
    const combRes = await request(app).get('/items?categoriaId=CAT02&vigente=true&fecha=2026-10-13');
    assert(combRes.status === 200, `Filtros combinados con AND responden 200`);
    assert(combRes.body.total === 1, `total es 1 para CAT02 vigente en 2026-10-13`);
    assert(combRes.body.items[0].id === 'PRM001', `Item devuelto es PRM001`);

    // ==========================================
    // 7. Pruebas de Parámetros Inválidos (400 Bad Request)
    // ==========================================
    console.log('\n--- 7. Pruebas de Parámetros Inválidos (HTTP 400) ---');
    const badLimit1 = await request(app).get('/items?limit=0');
    assert(badLimit1.status === 400, `limit=0 responde 400`);
    assert(badLimit1.body.error === 'bad_request', `error es 'bad_request'`);

    const badLimit2 = await request(app).get('/items?limit=101');
    assert(badLimit2.status === 400, `limit=101 responde 400`);
    assert(badLimit2.body.error === 'bad_request', `error es 'bad_request'`);

    const badLimit3 = await request(app).get('/items?limit=abc');
    assert(badLimit3.status === 400, `limit=abc responde 400`);

    const badOffset1 = await request(app).get('/items?offset=-1');
    assert(badOffset1.status === 400, `offset=-1 responde 400`);
    assert(badOffset1.body.error === 'bad_request', `error es 'bad_request'`);

    const badOffset2 = await request(app).get('/items?offset=xyz');
    assert(badOffset2.status === 400, `offset=xyz responde 400`);

    const badCat = await request(app).get('/items?categoriaId=invalid');
    assert(badCat.status === 400, `categoriaId con formato incorrecto responde 400`);

    const badProd = await request(app).get('/items?productoId=1234');
    assert(badProd.status === 400, `productoId con formato incorrecto responde 400`);

    const badVigente = await request(app).get('/items?vigente=quizas');
    assert(badVigente.status === 400, `vigente inválido responde 400`);

    const badFecha1 = await request(app).get('/items?fecha=fecha-mala');
    assert(badFecha1.status === 400, `fecha inválida responde 400`);

    const badFecha2 = await request(app).get('/items?fecha=2026-02-30');
    assert(badFecha2.status === 400, `fecha inexistente (2026-02-30) responde 400`);

    // ==========================================
    // 8. GET /items/:id (Detalle de elemento)
    // ==========================================
    console.log('\n--- 8. Pruebas de GET /items/:id ---');
    const itemDetail = await request(app).get('/items/PRM001');
    assert(itemDetail.status === 200, `GET /items/PRM001 responde 200`);
    assert(itemDetail.body.id === 'PRM001', `id coincide con PRM001`);
    assert(itemDetail.body.nombre === 'Semana del Celular', `nombre es 'Semana del Celular'`);
    assert(itemDetail.body.descuentoPct === 15, `descuentoPct es 15`);
    assert(itemDetail.body.categoriaId === 'CAT02', `categoriaId es CAT02`);
    assert(itemDetail.body.productoId === null, `productoId es null`);
    assert(itemDetail.body._id === undefined, `_id no está expuesto`);

    // Case-insensitivity en id
    const itemDetailLower = await request(app).get('/items/prm001');
    assert(itemDetailLower.status === 200, `GET /items/prm001 responde 200 (case-insensitive)`);
    assert(itemDetailLower.body.id === 'PRM001', `Devuelve el documento PRM001`);

    // 404 para elemento inexistente
    const notFoundRes = await request(app).get('/items/PRM999');
    assert(notFoundRes.status === 404, `GET /items/PRM999 responde 404`);
    assert(notFoundRes.body.error === 'not_found', `error es 'not_found'`);
    assert(notFoundRes.body.message === 'No existe PRM999.', `message es exacto: 'No existe PRM999.'`);

    // ==========================================
    // 9. Rutas no encontradas
    // ==========================================
    console.log('\n--- 9. Pruebas de rutas no encontradas ---');
    const unknownRoute = await request(app).get('/ruta-inexistente');
    assert(unknownRoute.status === 404, `Ruta inexistente responde 404`);
    assert(unknownRoute.body.error === 'not_found', `error es 'not_found'`);

    // ==========================================
    // 10. Página de inicio y OpenAPI YAML
    // ==========================================
    console.log('\n--- 10. Pruebas de Página de Inicio (Landing Page) ---');
    const homeRes = await request(app).get('/');
    assert(homeRes.status === 200, `GET / responde 200`);
    assert(homeRes.headers['content-type'].includes('text/html'), `GET / devuelve text/html`);
    assert(homeRes.text.includes('Microservicio de Promociones'), `HTML contiene el título del microservicio`);
    assert(homeRes.text.includes('Explorador Interactivo'), `HTML contiene la sección interactiva`);

    const yamlRes = await request(app).get('/openapi.yaml');
    assert(yamlRes.status === 200, `GET /openapi.yaml responde 200`);
    assert(yamlRes.text.includes('openapi: 3.0.3'), `GET /openapi.yaml contiene la especificación`);

    console.log(`\n==========================================`);
    console.log(`Resultados: ${passed} pasados, ${failed} fallados.`);
    if (failed > 0) {
      process.exitCode = 1;
    } else {
      console.log('🎉 ¡TODAS LAS PRUEBAS PASARON SATISFACTORIAMENTE!');
    }
  } catch (error) {
    console.error('💥 Error inesperado en suite de pruebas:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

runTests();
