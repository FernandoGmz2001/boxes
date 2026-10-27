-- c_TasaOCuota vigente en catCFDI_V_4_20261001.
-- La clave sale de c_Impuesto (001 ISR, 002 IVA, 003 IEPS).
-- El orden y el id siguen la hoja. El id 2 es IVA 16% traslado.
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
(19, '001', 'ISR', 'Tasa', 'Rango', 0.000000, 0.350000, FALSE, TRUE, DATE '2022-01-01', NULL)
ON CONFLICT ("id") DO UPDATE SET
  "clave_impuesto" = EXCLUDED."clave_impuesto",
  "impuesto" = EXCLUDED."impuesto",
  "factor" = EXCLUDED."factor",
  "rango_o_fijo" = EXCLUDED."rango_o_fijo",
  "valor_minimo" = EXCLUDED."valor_minimo",
  "valor_maximo" = EXCLUDED."valor_maximo",
  "traslado" = EXCLUDED."traslado",
  "retencion" = EXCLUDED."retencion",
  "fecha_inicio_vigencia" = EXCLUDED."fecha_inicio_vigencia",
  "fecha_fin_vigencia" = EXCLUDED."fecha_fin_vigencia";

SELECT setval(pg_get_serial_sequence('impuesto_preset', 'id'), (SELECT MAX("id") FROM "impuesto_preset"));

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
(10, 'Paquete', 'paq')
ON CONFLICT ("id") DO UPDATE SET
  "nombre" = EXCLUDED."nombre",
  "simbolo" = EXCLUDED."simbolo";

SELECT setval(pg_get_serial_sequence('unidad', 'id'), (SELECT MAX("id") FROM "unidad"));

-- Roles base. admin es de sistema: siempre conserva todos los módulos.
INSERT INTO "rol" ("nombre", "descripcion", "es_sistema") VALUES
('admin', 'Acceso total al sistema.', TRUE),
('operador', 'Opera el inventario y sus movimientos.', FALSE),
('cajero', 'Abre turnos y vende en el punto de venta.', FALSE)
ON CONFLICT ("nombre") DO NOTHING;

INSERT INTO "rol_permiso" ("rol_id", "permiso")
SELECT "rol"."id", "permiso"."clave"
FROM "rol"
CROSS JOIN (VALUES ('productos'), ('movimientos'), ('usuarios'), ('roles'), ('ventas'), ('cajas')) AS "permiso"("clave")
WHERE "rol"."nombre" = 'admin'
ON CONFLICT ("rol_id", "permiso") DO NOTHING;

INSERT INTO "rol_permiso" ("rol_id", "permiso")
SELECT "rol"."id", 'ventas'
FROM "rol"
WHERE "rol"."nombre" = 'cajero'
ON CONFLICT ("rol_id", "permiso") DO NOTHING;

-- Caja inicial del punto de venta.
INSERT INTO "caja" ("nombre") VALUES ('Caja 1')
ON CONFLICT ("nombre") DO NOTHING;

INSERT INTO "rol_permiso" ("rol_id", "permiso")
SELECT "rol"."id", "permiso"."clave"
FROM "rol"
CROSS JOIN (VALUES ('productos'), ('movimientos')) AS "permiso"("clave")
WHERE "rol"."nombre" = 'operador'
ON CONFLICT ("rol_id", "permiso") DO NOTHING;

-- Admin de desarrollo. Contraseña documentada en .env.example (SEED_ADMIN_PASSWORD).
INSERT INTO "usuario" ("nombre", "email", "password", "rol_id", "activo")
SELECT
  'Administrador',
  'admin@boxes.local',
  '$argon2id$v=19$m=65536,p=4,t=3$foXuvPgfee6Fp5eLGGGANg$gftKqkhIlhJmIcgaKdLqeWJH8iK+C7/UeKN85868r5A',
  "rol"."id",
  TRUE
FROM "rol"
WHERE "rol"."nombre" = 'admin'
ON CONFLICT ("email") DO NOTHING;
