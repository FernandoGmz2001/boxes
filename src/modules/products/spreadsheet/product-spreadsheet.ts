import ExcelJS from 'exceljs';
import type { CellValue, Worksheet } from 'exceljs';

type Workbook = ExcelJS.Workbook;

export const MAX_IMPORT_ROWS: number = 500;
export const MAX_IMPORT_FILE_BYTES: number = 2 * 1024 * 1024;
export const PRODUCTS_SHEET_NAME: string = 'productos';
export const PRODUCTS_TEMPLATE_FILENAME: string = 'plantilla-productos.xlsx';
export const SPREADSHEET_CONTENT_TYPE: string =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type ProductColumnKind = 'string' | 'integer' | 'money' | 'boolean' | 'presets';

interface IProductColumn {
  name: string;
  required: boolean;
  kind: ProductColumnKind;
  note: string;
}

const PRODUCT_COLUMNS: readonly IProductColumn[] = [
  {
    name: 'nombre_producto',
    required: true,
    kind: 'string',
    note: 'Nombre del producto.',
  },
  {
    name: 'imagen_url',
    required: false,
    kind: 'string',
    note: 'URL de la imagen.',
  },
  {
    name: 'cantidad_en_existencia',
    required: true,
    kind: 'integer',
    note: 'Existencia inicial. Entero mayor o igual a 0.',
  },
  {
    name: 'stock_minimo',
    required: true,
    kind: 'integer',
    note: 'Stock mínimo. Entero mayor o igual a 0.',
  },
  {
    name: 'sku',
    required: false,
    kind: 'string',
    note: 'SKU.',
  },
  {
    name: 'codigo_barras',
    required: false,
    kind: 'string',
    note: 'Código de barras.',
  },
  {
    name: 'precio_venta',
    required: true,
    kind: 'money',
    note: 'Precio de venta. Hasta 2 decimales.',
  },
  {
    name: 'costo_compra',
    required: true,
    kind: 'money',
    note: 'Costo de compra. Hasta 2 decimales.',
  },
  {
    name: 'es_servicio',
    required: true,
    kind: 'boolean',
    note: 'sí o no, verdadero o falso, true o false, 1 o 0.',
  },
  {
    name: 'activo',
    required: false,
    kind: 'boolean',
    note: 'Opcional. Si se omite, el producto queda activo.',
  },
  {
    name: 'id_categoria',
    required: true,
    kind: 'integer',
    note: 'Id de una categoría existente.',
  },
  {
    name: 'clave_producto_servicio',
    required: false,
    kind: 'string',
    note: 'Clave SAT de producto o servicio. Escríbela como texto.',
  },
  {
    name: 'clave_unidad_medida',
    required: false,
    kind: 'string',
    note: 'Clave SAT de unidad. Escríbela como texto.',
  },
  {
    name: 'objeto_impuesto',
    required: false,
    kind: 'string',
    note: 'Clave SAT de objeto de impuesto. Escríbela como texto.',
  },
  {
    name: 'impuesto_preset_ids',
    required: false,
    kind: 'presets',
    note: 'Ids de impuestos separados por coma. Ejemplo: 1,3.',
  },
];

const columnsByName: ReadonlyMap<string, IProductColumn> = new Map(
  PRODUCT_COLUMNS.map((column: IProductColumn) => [column.name, column]),
);

const TRUE_VALUES: ReadonlySet<string> = new Set([
  'true',
  'si',
  'sí',
  'verdadero',
  '1',
]);

const FALSE_VALUES: ReadonlySet<string> = new Set([
  'false',
  'no',
  'falso',
  '0',
]);

export interface IParsedProductRow {
  fila: number;
  values: Record<string, unknown>;
}

export interface IParsedProductsSheet {
  rows: IParsedProductRow[];
  errores: string[];
}

export type ProductSpreadsheetRow = Record<string, string | number | boolean>;

export async function buildProductsSpreadsheet(
  rows: readonly ProductSpreadsheetRow[] = [],
): Promise<Buffer> {
  const workbook: Workbook = new ExcelJS.Workbook();
  const sheet: Worksheet = workbook.addWorksheet(PRODUCTS_SHEET_NAME);

  sheet.columns = PRODUCT_COLUMNS.map((column: IProductColumn) => ({
    header: column.name,
    key: column.name,
    width: Math.max(column.name.length + 2, 22),
  }));
  sheet.getRow(1).font = { bold: true };

  for (const column of PRODUCT_COLUMNS) {
    const excelColumn = sheet.getColumn(column.name);

    if (column.kind === 'integer') {
      excelColumn.numFmt = '0';
    } else if (column.kind === 'money') {
      excelColumn.numFmt = '0.00';
    } else if (column.kind === 'string' || column.kind === 'presets') {
      excelColumn.numFmt = '@';
    }
  }

  for (const row of rows) {
    sheet.addRow(row);
  }

  addInstructionsSheet(workbook);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function parseProductsSpreadsheet(
  buffer: Buffer,
): Promise<IParsedProductsSheet> {
  const workbook: Workbook = new ExcelJS.Workbook();
  // exceljs declara su propio Buffer, distinto del de Node.
  await workbook.xlsx.load(buffer as never);

  const sheet: Worksheet | undefined = findProductSheet(workbook);

  if (!sheet) {
    return {
      rows: [],
      errores: ['El archivo debe incluir la hoja productos.'],
    };
  }

  const header: IHeaderMap | IParsedProductsSheet = readHeader(sheet);

  if ('errores' in header) {
    return header;
  }

  const rows: IParsedProductRow[] = readRows(sheet, header);

  if (rows.length === 0) {
    return { rows: [], errores: ['El archivo no tiene productos.'] };
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      rows: [],
      errores: [
        `El archivo no puede tener más de ${MAX_IMPORT_ROWS} productos.`,
      ],
    };
  }

  return { rows, errores: [] };
}

interface IHeaderMap {
  columns: Map<number, IProductColumn>;
}

function findProductSheet(workbook: Workbook): Worksheet | undefined {
  const named: Worksheet | undefined = workbook.worksheets.find(
    (sheet: Worksheet) =>
      sheet.name.toLocaleLowerCase('es-MX') === PRODUCTS_SHEET_NAME,
  );

  if (named) {
    return named;
  }

  if (workbook.worksheets.length === 1) {
    return workbook.worksheets[0];
  }

  return undefined;
}

function readHeader(sheet: Worksheet): IHeaderMap | IParsedProductsSheet {
  const headerRow = sheet.getRow(1);
  const columns: Map<number, IProductColumn> = new Map();
  const seen: Set<string> = new Set();
  const errores: string[] = [];
  const lastColumn: number = Math.max(sheet.columnCount, headerRow.cellCount);

  for (let columnIndex = 1; columnIndex <= lastColumn; columnIndex += 1) {
    const raw: unknown = readCell(headerRow.getCell(columnIndex).value);

    if (raw === undefined) {
      continue;
    }

    const name: string = String(raw).trim().toLocaleLowerCase('es-MX');
    const column: IProductColumn | undefined = columnsByName.get(name);

    if (!column) {
      errores.push(`La columna ${name} no está permitida.`);
      continue;
    }

    if (seen.has(name)) {
      errores.push(`La columna ${name} está repetida.`);
      continue;
    }

    seen.add(name);
    columns.set(columnIndex, column);
  }

  if (seen.size === 0) {
    return {
      rows: [],
      errores: [
        'La primera fila debe contener los nombres de las columnas de la plantilla.',
      ],
    };
  }

  for (const column of PRODUCT_COLUMNS) {
    if (column.required && !seen.has(column.name)) {
      errores.push(`Falta la columna ${column.name}.`);
    }
  }

  if (errores.length > 0) {
    return { rows: [], errores };
  }

  return { columns };
}

function readRows(sheet: Worksheet, header: IHeaderMap): IParsedProductRow[] {
  const rows: IParsedProductRow[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const excelRow = sheet.getRow(rowNumber);
    const values: Record<string, unknown> = {};
    let hasValue: boolean = false;

    for (const [columnIndex, column] of header.columns) {
      const raw: unknown = readCell(excelRow.getCell(columnIndex).value);
      const coerced: unknown = coerceCell(column, raw);

      if (coerced !== undefined) {
        hasValue = true;
        values[column.name] = coerced;
      }
    }

    if (hasValue) {
      rows.push({ fila: rowNumber, values });
    }
  }

  return rows;
}

function addInstructionsSheet(workbook: Workbook): void {
  const sheet: Worksheet = workbook.addWorksheet('instrucciones');

  sheet.columns = [
    { header: 'Columna', key: 'columna', width: 28 },
    { header: 'Obligatoria', key: 'obligatoria', width: 14 },
    { header: 'Descripción', key: 'descripcion', width: 72 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const column of PRODUCT_COLUMNS) {
    sheet.addRow({
      columna: column.name,
      obligatoria: column.required ? 'sí' : 'no',
      descripcion: column.note,
    });
  }

  sheet.addRow({});
  sheet.addRow({
    columna: 'Notas',
    descripcion: `Máximo ${MAX_IMPORT_ROWS} productos y 2 MB. Si una fila falla, no se guarda ninguno.`,
  });
  sheet.addRow({
    columna: '',
    descripcion:
      'Las claves SAT conviene escribirlas como texto para no perder los ceros de la izquierda.',
  });
}

function readCell(value: CellValue): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed: string = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if ('richText' in value) {
    const text: string = value.richText
      .map((part: { text: string }) => part.text)
      .join('')
      .trim();
    return text.length === 0 ? undefined : text;
  }

  if ('text' in value && 'hyperlink' in value) {
    const text: string = value.text.trim();
    return text.length === 0 ? undefined : text;
  }

  if ('result' in value) {
    return readCell(value.result ?? null);
  }

  return undefined;
}

function coerceCell(column: IProductColumn, value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (column.kind === 'string') {
    return coerceString(column.name, value);
  }

  if (column.kind === 'integer') {
    return coerceNumber(value) ?? value;
  }

  if (column.kind === 'money') {
    return coerceMoney(value);
  }

  if (column.kind === 'boolean') {
    return coerceBoolean(value);
  }

  return coercePresets(value);
}

function coerceString(columnName: string, value: unknown): unknown {
  let text: string;

  if (typeof value === 'string') {
    text = value;
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    text = String(value);
  } else {
    return value;
  }

  if (
    columnName === 'clave_producto_servicio' &&
    /^\d+$/.test(text) &&
    text.length > 0 &&
    text.length < 8
  ) {
    return text.padStart(8, '0');
  }

  if (
    columnName === 'objeto_impuesto' &&
    /^\d+$/.test(text) &&
    text.length === 1
  ) {
    return text.padStart(2, '0');
  }

  return text;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized: string = value.replace(',', '.');

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return undefined;
  }

  return Number(normalized);
}

function coerceMoney(value: unknown): unknown {
  const numeric: number | undefined = coerceNumber(value);

  if (numeric === undefined) {
    return value;
  }

  const rounded: number = Math.round((numeric + Number.EPSILON) * 100) / 100;

  if (Math.abs(numeric - rounded) < 1e-8) {
    return rounded;
  }

  return numeric;
}

function coerceBoolean(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }

    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized: string = value.toLocaleLowerCase('es-MX');

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return value;
}

function coercePresets(value: unknown): unknown {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return [value];
  }

  if (typeof value !== 'string') {
    return value;
  }

  const parts: string[] = value
    .split(/[,;]/)
    .map((part: string) => part.trim())
    .filter((part: string) => part.length > 0);

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.every((part: string) => /^\d+$/.test(part))) {
    return parts.map((part: string) => Number(part));
  }

  return value;
}
