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

La API queda en [http://localhost:3000](http://localhost:3000). `prisma generate` crea el cliente, que no está en el repositorio. `migrate deploy` aplica las migraciones. `pnpm seed` carga las tasas y cuotas SAT, las claves SAT y el admin inicial.

Entra con `POST /auth/login`:

```json
{
  "email": "admin@boxes.local",
  "password": "4dm1n1str4t0r"
}
```

El email y la contraseña salen de `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en `.env.example`. La respuesta trae `access_token`. El resto de las rutas piden `Authorization: Bearer <token>`.

La colección de Postman está en `postman/boxes.postman_collection.json`. Importala y ejecuta primero **Auth / Login**: guarda el token y las demás peticiones lo envían.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm start:dev` | API en modo watch |
| `pnpm seed` | Vuelve a cargar catálogos SAT y el admin si aún no existe |
| `pnpm db:reset` | Borra la base de `DATABASE_URL`, reaplica migraciones y corre el seed |
| `pnpm test` | Pruebas unitarias |
| `pnpm test:e2e` | Pruebas e2e; necesitan la base seedeada y las variables del `.env` |

`pnpm db:reset` elimina todo lo que haya en esa base, no solo las tablas de este proyecto.
