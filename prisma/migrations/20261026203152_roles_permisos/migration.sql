-- CreateTable
CREATE TABLE "rol" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "es_sistema" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permiso" (
    "rol_id" INTEGER NOT NULL,
    "permiso" TEXT NOT NULL,

    CONSTRAINT "rol_permiso_pkey" PRIMARY KEY ("rol_id","permiso")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Roles que antes eran texto fijo en usuario.rol.
INSERT INTO "rol" ("nombre", "descripcion", "es_sistema") VALUES
('admin', 'Acceso total al sistema.', TRUE),
('operador', 'Opera el inventario y sus movimientos.', FALSE);

INSERT INTO "rol_permiso" ("rol_id", "permiso")
SELECT "rol"."id", "permiso"."clave"
FROM "rol"
CROSS JOIN (VALUES ('productos'), ('movimientos'), ('usuarios'), ('roles')) AS "permiso"("clave")
WHERE "rol"."nombre" = 'admin';

INSERT INTO "rol_permiso" ("rol_id", "permiso")
SELECT "rol"."id", "permiso"."clave"
FROM "rol"
CROSS JOIN (VALUES ('productos'), ('movimientos')) AS "permiso"("clave")
WHERE "rol"."nombre" = 'operador';

-- AlterTable: usuario.rol (texto) pasa a usuario.rol_id conservando el rol de cada usuario.
ALTER TABLE "usuario" ADD COLUMN "rol_id" INTEGER;

UPDATE "usuario"
SET "rol_id" = "rol"."id"
FROM "rol"
WHERE "rol"."nombre" = CASE WHEN "usuario"."rol" = 'admin' THEN 'admin' ELSE 'operador' END;

ALTER TABLE "usuario" ALTER COLUMN "rol_id" SET NOT NULL;

ALTER TABLE "usuario" DROP COLUMN "rol";

-- CreateIndex
CREATE INDEX "usuario_rol_id_idx" ON "usuario"("rol_id");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
