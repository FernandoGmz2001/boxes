-- CreateSequence
CREATE SEQUENCE "venta_folio_seq";

-- CreateTable
CREATE TABLE "venta" (
    "id" SERIAL NOT NULL,
    "folio" TEXT NOT NULL DEFAULT ('V-'::text || lpad((nextval('venta_folio_seq'::regclass))::text, 8, '0'::text)),
    "usuario_id" INTEGER NOT NULL,
    "cliente_id" INTEGER,
    "metodo_pago" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venta_pkey" PRIMARY KEY ("id")
);

ALTER SEQUENCE "venta_folio_seq" OWNED BY "venta"."folio";

-- CreateTable
CREATE TABLE "detalle_venta" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venta_folio_key" ON "venta"("folio");

-- CreateIndex
CREATE INDEX "venta_usuario_id_idx" ON "venta"("usuario_id");

-- CreateIndex
CREATE INDEX "venta_cliente_id_idx" ON "venta"("cliente_id");

-- CreateIndex
CREATE INDEX "detalle_venta_venta_id_idx" ON "detalle_venta"("venta_id");

-- CreateIndex
CREATE INDEX "detalle_venta_producto_id_idx" ON "detalle_venta"("producto_id");

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
