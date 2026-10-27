-- AlterTable
ALTER TABLE "venta" ADD COLUMN     "turno_id" INTEGER;

-- CreateTable
CREATE TABLE "caja" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turno_caja" (
    "id" SERIAL NOT NULL,
    "caja_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Abierto',
    "fondo_inicial" DECIMAL(10,2) NOT NULL,
    "efectivo_esperado" DECIMAL(10,2),
    "efectivo_contado" DECIMAL(10,2),
    "diferencia" DECIMAL(10,2),
    "notas" TEXT,
    "abierto_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrado_at" TIMESTAMP(3),

    CONSTRAINT "turno_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento_caja" (
    "id" SERIAL NOT NULL,
    "turno_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "caja_nombre_key" ON "caja"("nombre");

-- CreateIndex
CREATE INDEX "turno_caja_caja_id_idx" ON "turno_caja"("caja_id");

-- CreateIndex
CREATE INDEX "turno_caja_usuario_id_idx" ON "turno_caja"("usuario_id");

-- CreateIndex
CREATE INDEX "movimiento_caja_turno_id_idx" ON "movimiento_caja"("turno_id");

-- CreateIndex
CREATE INDEX "movimiento_caja_usuario_id_idx" ON "movimiento_caja"("usuario_id");

-- CreateIndex
CREATE INDEX "venta_turno_id_idx" ON "venta"("turno_id");

-- AddForeignKey
ALTER TABLE "turno_caja" ADD CONSTRAINT "turno_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_caja" ADD CONSTRAINT "turno_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_caja" ADD CONSTRAINT "movimiento_caja_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turno_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_caja" ADD CONSTRAINT "movimiento_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turno_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: una caja y un usuario tienen como máximo un turno Abierto. Prisma no modela índices parciales.
CREATE UNIQUE INDEX "turno_caja_caja_id_abierto_key" ON "turno_caja"("caja_id") WHERE "estado" = 'Abierto';

CREATE UNIQUE INDEX "turno_caja_usuario_id_abierto_key" ON "turno_caja"("usuario_id") WHERE "estado" = 'Abierto';

-- Permisos nuevos del POS para el rol de sistema.
INSERT INTO "rol_permiso" ("rol_id", "permiso")
SELECT "rol"."id", "permiso"."clave"
FROM "rol"
CROSS JOIN (VALUES ('ventas'), ('cajas')) AS "permiso"("clave")
WHERE "rol"."nombre" = 'admin'
ON CONFLICT ("rol_id", "permiso") DO NOTHING;
