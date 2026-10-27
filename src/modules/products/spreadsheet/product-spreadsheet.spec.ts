import ExcelJS from 'exceljs';
import {
  MAX_IMPORT_ROWS,
  parseProductsSpreadsheet,
  buildProductsSpreadsheet,
} from './product-spreadsheet.js';

const validRow = {
  nombre_producto: 'Caja',
  cantidad_en_existencia: 1,
  stock_minimo: 0,
  precio_venta: 10,
  costo_compra: 4,
  es_servicio: false,
  id_categoria: 1,
};

describe('product spreadsheet', () => {
  it('reads booleans, money and preset ids from the template columns', async () => {
    const parsed = await parseProductsSpreadsheet(
      await buildProductsSpreadsheet([
        {
          ...validRow,
          precio_venta: '15,50',
          es_servicio: 'sí',
          activo: 'no',
          impuesto_preset_ids: '1, 3',
          clave_producto_servicio: 1010101,
        },
      ]),
    );

    expect(parsed.errores).toEqual([]);
    expect(parsed.rows).toEqual([
      {
        fila: 2,
        values: expect.objectContaining({
          nombre_producto: 'Caja',
          precio_venta: 15.5,
          es_servicio: true,
          activo: false,
          impuesto_preset_ids: [1, 3],
          clave_producto_servicio: '01010101',
        }),
      },
    ]);
  });

  it('rejects an empty template', async () => {
    const parsed = await parseProductsSpreadsheet(
      await buildProductsSpreadsheet(),
    );

    expect(parsed.rows).toEqual([]);
    expect(parsed.errores).toEqual(['El archivo no tiene productos.']);
  });

  it('rejects an unknown column and a missing required column', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('productos');
    sheet.addRow(['nombre_producto', 'notas']);
    sheet.addRow(['Caja', 'hola']);

    const parsed = await parseProductsSpreadsheet(
      Buffer.from(await workbook.xlsx.writeBuffer()),
    );

    expect(parsed.errores).toEqual(
      expect.arrayContaining([
        'La columna notas no está permitida.',
        'Falta la columna cantidad_en_existencia.',
      ]),
    );
  });

  it('rejects more than the row limit', async () => {
    const rows = Array.from({ length: MAX_IMPORT_ROWS + 1 }, () => validRow);
    const parsed = await parseProductsSpreadsheet(
      await buildProductsSpreadsheet(rows),
    );

    expect(parsed.errores).toEqual([
      `El archivo no puede tener más de ${MAX_IMPORT_ROWS} productos.`,
    ]);
  });

  it('uses the only sheet when it is not named productos', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('carga');
    sheet.addRow([
      'nombre_producto',
      'cantidad_en_existencia',
      'stock_minimo',
      'precio_venta',
      'costo_compra',
      'es_servicio',
      'id_categoria',
    ]);
    sheet.addRow(['Caja', 1, 0, 10, 4, false, 1]);

    const parsed = await parseProductsSpreadsheet(
      Buffer.from(await workbook.xlsx.writeBuffer()),
    );

    expect(parsed.errores).toEqual([]);
    expect(parsed.rows[0]?.values.nombre_producto).toBe('Caja');
  });
});
