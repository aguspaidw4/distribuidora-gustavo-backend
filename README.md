# Distribuidora Gustavo — Backend

API REST para la gestión de la distribuidora: usuarios, productos, pedidos, pagos, stock, compras y reportes. Construida con NestJS, TypeORM y MySQL.

## Tecnologías

- **NestJS 11** + **TypeScript** — Framework y tipado
- **TypeORM** — ORM con soporte para MySQL
- **MySQL 8** — Base de datos relacional
- **Passport.js + JWT** — Autenticación
- **bcrypt** — Hash de contraseñas
- **PDFKit** — Generación de PDFs (reportes/remitos)
- **class-validator** — Validación de DTOs
- **Jest** — Testing unitario y e2e

## Requisitos previos

- Node.js 20+
- npm 9+
- MySQL 8 (o Docker)

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run start:dev

# Build de producción
npm run build

# Producción
npm run start:prod
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=distribuidora_user
DB_PASSWORD=tu_password
DB_NAME=distribuidora_db

JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES=7d
```

## Base de datos con Docker

El proyecto incluye un `docker-compose.yml` con MySQL 8 preconfigurado:

```bash
# Levantar solo la base de datos
docker-compose up -d distribuidora_mysql
```

Credenciales por defecto (solo para desarrollo):
- Base de datos: `distribuidora_db`
- Usuario: `distribuidora_user`
- Puerto: `3306`

> **Nota:** `synchronize: true` está habilitado — TypeORM sincroniza el esquema automáticamente. Desactivar en producción.

## Estructura del proyecto

```
src/
├── auth/                  # Login, JWT strategy, guards y decoradores de roles
├── users/                 # CRUD de usuarios y entidad User
├── products/              # CRUD de productos con precios por unidad/tira/caja
├── categories/            # Categorías de productos
├── suppliers/             # Proveedores
├── customers/             # Clientes vinculados a usuarios
├── orders/                # Pedidos y detalle de pedidos
├── payments/              # Pagos asociados a pedidos
├── stock/                 # Movimientos de stock
├── purchases/             # Compras a proveedores
├── dashboard/             # Métricas y resumen para el panel principal
├── reports/               # Generación de reportes en PDF
├── app.module.ts          # Módulo raíz con configuración de TypeORM y ConfigModule
└── main.ts                # Bootstrap, CORS, ValidationPipe global
```

## Autenticación y roles

**Endpoint de login:**
```http
POST /auth/login
Content-Type: application/json

{ "email": "admin@ejemplo.com", "password": "password123" }
```

Respuesta:
```json
{ "access_token": "<jwt>" }
```

El JWT contiene: `{ sub: userId, email, role }`

**Roles disponibles:**

| Rol    | Descripción                                              |
|--------|----------------------------------------------------------|
| ADMIN  | Acceso completo                                          |
| OWNER  | Gestión operativa (productos, stock, compras, pedidos)  |
| CLIENT | Acceso solo a sus propios pedidos                        |

Las rutas protegidas usan `@UseGuards(JwtAuthGuard, RolesGuard)` y `@Roles('ADMIN', 'OWNER')`.

## Modelo de datos principal

```
User ──< Customer ──< Order ──< OrderDetail >── Product
                        │
                        └──< Payment

Product ──< StockMovement
Product >── Category
Product >── Supplier
Purchase >── Supplier
```

**Producto:** soporta precios múltiples (unidad, tira, caja) con margen de ganancia configurable (default 30%).

**Tipo fiscal del usuario:** `CONSUMIDOR_FINAL | MONOTRIBUTISTA | RESPONSABLE_INSCRIPTO`

## Scripts disponibles

```bash
npm run start:dev    # Desarrollo con watch
npm run build        # Compilar a dist/
npm run start:prod   # Producción
npm run test         # Tests unitarios
npm run test:e2e     # Tests end-to-end
npm run test:cov     # Cobertura de tests
npm run lint         # ESLint con auto-fix
npm run format       # Prettier
```

## Docker

```bash
# Construir imagen del backend
docker build -t distribuidora-backend .

# Correr en puerto 3000
docker run -p 3000:3000 --env-file .env distribuidora-backend
```

## CORS

En desarrollo, el backend acepta requests de `http://localhost:5173` (Vite dev server). Modificar en `main.ts` para otros orígenes.