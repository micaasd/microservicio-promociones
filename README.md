# Microservicio de Promociones

Microservicio REST de solo lectura para la gestión y consulta de la colección `promociones`, implementado en **Node.js (ES Modules)**, **Express** y **MongoDB Atlas** (vía **Mongoose**) en cumplimiento con la especificación OpenAPI 3.0.3 provista (`promociones.yaml`).

---

## 📋 Reglas del Negocio y Especificación OpenAPI

- **Colección:** `promociones`
- **Solo lectura:** Expone únicamente las rutas `GET /health`, `GET /items` y `GET /items/:id`.
- **Ordenamiento:** `GET /items` retorna los elementos **ordenados por `id` ascendente**, con paginación `limit` y `offset`.
- **Total:** El campo `total` indica la cantidad total de elementos que cumplen los filtros, sin verse afectado por la paginación.
- **Filtros combinados con AND:** Los filtros de texto (`categoriaId`, `productoId`) comparan por igualdad exacta sin distinguir mayúsculas ni minúsculas.
- **Vigencia:** Con `vigente=true` devuelve promociones donde `fechaInicio <= fecha <= fechaFin`; con `vigente=false`, las demás. Si no se provee `fecha`, se utiliza la fecha actual en UTC (`YYYY-MM-DD`).
- **Validaciones y Respuestas de Error:**
  - Errores de validación (tipo, rango, valor fuera de enum o patrón) devuelven código **400** en formato `{ "error": "bad_request", "message": "<detalle>" }`.
  - Recursos no encontrados por ID devuelven **404** en formato `{ "error": "not_found", "message": "No existe <id>." }`.

---

## 🗄️ Base de Datos (MongoDB Atlas)

- **Cluster:** `MSPromociones`
- **Base de datos:** `MS-Promociones`
- **Colección:** `promociones`
- **URI de conexión:**
  ```env
  MONGODB_URI=mongodb+srv://francosassola_db_user:uUvLHASVqtP57uP4@mspromociones.a6qnbsi.mongodb.net/MS-Promociones?appName=MSPromociones
  ```

---

## 📁 Estructura del Proyecto

```text
Microservicios/
├── .env                  # Variables de entorno locales
├── .env.example          # Plantilla de variables de entorno
├── package.json          # Dependencias y scripts del proyecto
├── promociones.json      # Semilla inicial con los 12 registros
├── promociones.yaml      # Especificación formal OpenAPI 3.0.3
├── README.md             # Documentación del microservicio
├── src/
│   ├── app.js            # Configuración de Express, middlewares y rutas
│   ├── index.js          # Punto de entrada principal y levantamiento del servidor
│   ├── seed.js           # Script para poblar la base de datos desde promociones.json
│   ├── config/
│   │   └── db.js         # Módulo de conexión y desconexión a MongoDB Atlas
│   ├── middleware/
│   │   └── validator.js  # Validación de parámetros query según contrato OpenAPI
│   ├── models/
│   │   └── Promocion.js  # Modelo de datos Mongoose para promociones
│   ├── routes/
│   │   ├── health.js     # Endpoint GET /health
│   │   └── items.js      # Endpoints GET /items y GET /items/:id
│   └── utils/
│       └── format.js     # Formateador de respuestas conforme al schema Item
└── test/
    └── test.js           # Suite de pruebas automatizadas (78 aserciones)
```

---

## 🚀 Instalación y Ejecución

### 1. Variables de Entorno

El archivo `.env` ya se encuentra configurado con las credenciales de MongoDB Atlas:

```env
PORT=3000
MONGODB_URI=mongodb+srv://francosassola_db_user:uUvLHASVqtP57uP4@mspromociones.a6qnbsi.mongodb.net/MS-Promociones?appName=MSPromociones
SERVICE_NAME=grupo-03-promociones
```

### 2. Poblar la Base de Datos (Seed)

Para sincronizar la base de datos con los datos del archivo `promociones.json`:

```bash
npm run seed
```

### 3. Iniciar el Servidor

Modo producción:
```bash
npm start
```

Modo desarrollo (recarga automática con Node `--watch`):
```bash
npm run dev
```

El servidor estará escuchando en `http://localhost:3000`.

---

## 🧪 Pruebas Automatizadas

El proyecto incluye una suite de pruebas exhaustiva que valida todos los requisitos del contrato OpenAPI:

```bash
npm test
```

Cubre:
1. `GET /health`: Estado del servicio y base de datos (código 200, status `ok`, collection `promociones`).
2. `GET /items`: Paginación por defecto (`limit=20`, `offset=0`), orden ascendente por `id` y validación estricta de campos sin exponer `_id`.
3. Paginación: Comportamiento correcto de `limit` y `offset`.
4. Filtro `categoriaId`: Búsqueda exacta y case-insensitive (`^CAT[0-9]+$`).
5. Filtro `productoId`: Búsqueda exacta y case-insensitive (`^PRD[0-9]+$`).
6. Filtro `vigente` y `fecha`: Evaluación de `fechaInicio <= fecha <= fechaFin` y su complemento.
7. Validaciones HTTP 400 (`bad_request`): Rangos de `limit` (1-100), `offset` (>=0), sintaxis de IDs, booleanos y fechas.
8. `GET /items/:id`: Búsqueda existente (200), case-insensitivity y 404 (`not_found`, `No existe <id>.`).

---

## 📡 Rutas Disponibles

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Verifica el estado del microservicio y la conexión a MongoDB Atlas |
| `GET` | `/items` | Lista de promociones con soporte para filtros (`categoriaId`, `productoId`, `vigente`, `fecha`, `limit`, `offset`) |
| `GET` | `/items/:id` | Detalle de una promoción por su identificador (ej: `PRM001`) |
