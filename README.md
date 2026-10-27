# Boxes

API de inventario en NestJS, Prisma y PostgreSQL.

## Requisitos

- Node.js
- pnpm
- PostgreSQL en marcha

## Inicializar

Clona el repositorio y entra a la carpeta:

```bash
git clone <url-del-repositorio> boxes
cd boxes
pnpm install
cp .env.example .env
```

En `.env`, apunta `DATABASE_URL` a tu Postgres y cambia `JWT_SECRET`. La base indicada en esa URL tiene que existir. El ejemplo usa la base `postgres` de un servidor local.

```bash
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm seed
pnpm start:dev
```

La API queda en [http://localhost:3000](http://localhost:3000). `prisma generate` crea el cliente, que no está en el repositorio. `migrate deploy` aplica las migraciones. `pnpm seed` carga las tasas y cuotas SAT, las unidades de inventario, las claves SAT, los roles `admin`, `operador` y `cajero`, la caja `Caja 1` y el admin inicial.

Entra con `POST /auth/login`:

```json
{
  "email": "admin@boxes.local",
  "password": "4dm1n1str4t0r"
}
```

El email y la contraseña salen de `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en `.env.example`. La respuesta trae `access_token`. El resto de las rutas piden `Authorization: Bearer <token>`.

La colección de Postman está en `postman/boxes.postman_collection.json`. Importala y ejecuta primero **Auth / Login**: guarda el token y las demás peticiones lo envían.

## Importar productos desde Excel

`GET /productos/plantilla` descarga un `.xlsx` con la hoja `productos` y otra de instrucciones. `POST /productos/importacion` recibe ese archivo en el campo `archivo` (`multipart/form-data`).

La primera fila son los nombres de columna, los mismos del alta de un producto. `es_servicio` y `activo` aceptan sí/no, verdadero/falso o 1/0. Los impuestos van separados por coma (`1,3`). Máximo 500 filas y 2 MB. Si una fila falla, no se guarda ninguna. La respuesta `201` trae `creados` y `productos`.

## Punto de venta

Se vende dentro de un turno. Cada caja y cada usuario tienen como máximo un turno abierto.

1. `POST /turnos` con `caja_id` y `fondo_inicial` abre el turno del usuario del token. `GET /turnos/actual` lo devuelve al recargar el POS.
2. `POST /ventas` recibe `metodo_pago`, `cliente_id` opcional y `carrito` con `producto_id` y `cantidad`. El precio sale de `precio_venta` del producto; la API rechaza `precio_unitario` y `total`. Sin turno abierto responde 409.
3. `POST /turnos/:id/movimientos` registra una `Entrada` o un `Retiro` de efectivo. Un retiro no puede superar el efectivo esperado.
4. `GET /turnos/:id/corte` muestra el corte sin guardarlo: ventas por método de pago y `efectivo_esperado = fondo_inicial + ventas en Efectivo + entradas - retiros`.
5. `POST /turnos/:id/cierre` con `efectivo_contado` guarda el corte, la `diferencia` (contado menos esperado) y cierra el turno. Después ya no se puede vender ni mover efectivo en él.

Permisos: `ventas` opera el POS y los turnos propios; `cajas` administra cajas y consulta o cierra turnos y ventas de cualquier usuario. `GET /ventas` y `GET /ventas/:id` devuelven solo las ventas propias si el usuario no tiene `cajas`.

## Comandos

| Comando          | Qué hace                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| `pnpm start:dev` | API en modo watch                                                       |
| `pnpm seed`      | Vuelve a cargar catálogos SAT, las unidades y el admin si aún no existe |
| `pnpm db:reset`  | Borra la base de `DATABASE_URL`, reaplica migraciones y corre el seed   |
| `pnpm test`      | Pruebas unitarias                                                       |
| `pnpm test:e2e`  | Pruebas e2e; necesitan la base seedeada y las variables del `.env`      |

`pnpm db:reset` elimina todo lo que haya en esa base, no solo las tablas de este proyecto.
