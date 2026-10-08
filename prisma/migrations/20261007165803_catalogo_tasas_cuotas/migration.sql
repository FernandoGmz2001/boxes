-- CreateTable
CREATE TABLE "impuesto_preset" (
    "id" SERIAL NOT NULL,
    "clave_impuesto" TEXT NOT NULL,
    "impuesto" TEXT NOT NULL,
    "factor" TEXT NOT NULL,
    "rango_o_fijo" TEXT NOT NULL,
    "valor_minimo" DECIMAL(12,6),
    "valor_maximo" DECIMAL(12,6) NOT NULL,
    "traslado" BOOLEAN NOT NULL,
    "retencion" BOOLEAN NOT NULL,
    "fecha_inicio_vigencia" DATE NOT NULL,
    "fecha_fin_vigencia" DATE,

    CONSTRAINT "impuesto_preset_pkey" PRIMARY KEY ("id")
);

-- c_TasaOCuota vigente (catCFDI_V_4_20261001), en el orden de la hoja.
INSERT INTO "impuesto_preset" ("id", "clave_impuesto", "impuesto", "factor", "rango_o_fijo", "valor_minimo", "valor_maximo", "traslado", "retencion", "fecha_inicio_vigencia", "fecha_fin_vigencia") VALUES
(1, '002', 'IVA', 'Tasa', 'Fijo', NULL, 0.000000, TRUE, FALSE, DATE '2022-01-01', NULL),
(2, '002', 'IVA', 'Tasa', 'Fijo', NULL, 0.160000, TRUE, FALSE, DATE '2022-01-01', NULL),
(3, '002', 'IVA', 'Tasa', 'Rango', 0.000000, 0.160000, FALSE, TRUE, DATE '2022-01-01', NULL),
(4, '002', 'IVA Crédito aplicado del 50%', 'Tasa', 'Fijo', NULL, 0.080000, TRUE, FALSE, DATE '2022-01-01', NULL),
(5, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.265000, TRUE, TRUE, DATE '2022-01-01', NULL),
(6, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.300000, TRUE, TRUE, DATE '2022-01-01', NULL),
(7, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.530000, TRUE, TRUE, DATE '2022-01-01', NULL),
(8, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.500000, TRUE, TRUE, DATE '2022-01-01', NULL),
(9, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 1.600000, TRUE, TRUE, DATE '2022-01-01', NULL),
(10, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.304000, TRUE, TRUE, DATE '2022-01-01', NULL),
(11, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.250000, TRUE, TRUE, DATE '2022-01-01', NULL),
(12, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.090000, TRUE, TRUE, DATE '2022-01-01', NULL),
(13, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.080000, TRUE, TRUE, DATE '2022-01-01', NULL),
(14, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.070000, TRUE, TRUE, DATE '2022-01-01', NULL),
(15, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.060000, TRUE, TRUE, DATE '2022-01-01', NULL),
(16, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.030000, TRUE, FALSE, DATE '2022-01-01', NULL),
(17, '003', 'IEPS', 'Tasa', 'Fijo', NULL, 0.000000, TRUE, FALSE, DATE '2022-01-01', NULL),
(18, '003', 'IEPS', 'Cuota', 'Rango', 0.000000, 72.160500, TRUE, TRUE, DATE '2026-01-01', NULL),
(19, '001', 'ISR', 'Tasa', 'Rango', 0.000000, 0.350000, FALSE, TRUE, DATE '2022-01-01', NULL);

SELECT setval(pg_get_serial_sequence('impuesto_preset', 'id'), (SELECT MAX("id") FROM "impuesto_preset"));

-- CreateIndex
CREATE INDEX "producto_impuesto_impuesto_preset_id_idx" ON "producto_impuesto"("impuesto_preset_id");

-- AddForeignKey
ALTER TABLE "producto_impuesto" ADD CONSTRAINT "producto_impuesto_impuesto_preset_id_fkey" FOREIGN KEY ("impuesto_preset_id") REFERENCES "impuesto_preset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
