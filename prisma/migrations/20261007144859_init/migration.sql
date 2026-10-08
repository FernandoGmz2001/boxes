-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "color_ui" TEXT,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto" (
    "id" SERIAL NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "imagen_url" TEXT,
    "cantidad_en_existencia" INTEGER NOT NULL,
    "stock_minimo" INTEGER NOT NULL,
    "sku" TEXT,
    "codigo_barras" TEXT,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "costo_compra" DECIMAL(10,2) NOT NULL,
    "es_servicio" BOOLEAN NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "id_categoria" INTEGER NOT NULL,
    "clave_producto_servicio" TEXT,
    "clave_unidad_medida" TEXT,
    "objeto_impuesto" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "tipo_movimiento" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stock_previo" INTEGER NOT NULL,
    "stock_nuevo" INTEGER NOT NULL,
    "motivo" TEXT,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_impuesto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "impuesto_preset_id" INTEGER NOT NULL,

    CONSTRAINT "producto_impuesto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "producto_id_categoria_idx" ON "producto"("id_categoria");

-- CreateIndex
CREATE INDEX "movimiento_producto_id_idx" ON "movimiento"("producto_id");

-- CreateIndex
CREATE INDEX "movimiento_usuario_id_idx" ON "movimiento"("usuario_id");

-- CreateIndex
CREATE INDEX "producto_impuesto_producto_id_idx" ON "producto_impuesto"("producto_id");

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_impuesto" ADD CONSTRAINT "producto_impuesto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
