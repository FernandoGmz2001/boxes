-- CreateTable
CREATE TABLE "unidad" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,

    CONSTRAINT "unidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unidad_nombre_key" ON "unidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "unidad_simbolo_key" ON "unidad"("simbolo");

INSERT INTO "unidad" ("id", "nombre", "simbolo") VALUES
(1, 'Unidad', 'pza'),
(2, 'Metro', 'm'),
(3, 'Centímetro', 'cm'),
(4, 'Metro cuadrado', 'm²'),
(5, 'Kilogramo', 'kg'),
(6, 'Gramo', 'g'),
(7, 'Litro', 'L'),
(8, 'Mililitro', 'ml'),
(9, 'Caja', 'caja'),
(10, 'Paquete', 'paq');

SELECT setval(pg_get_serial_sequence('unidad', 'id'), (SELECT MAX("id") FROM "unidad"));
