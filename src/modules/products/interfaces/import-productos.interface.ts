import type { IProducto } from './producto.interface.js';

export interface ISpreadsheetUpload {
  originalname: string;
  buffer: Buffer;
  size: number;
}

export interface IImportProductosResult {
  creados: number;
  productos: IProducto[];
}

export interface IImportReferencesQuery {
  categoriaIds: number[];
  clavesProductoServicio: string[];
  clavesUnidad: string[];
  objetosImpuesto: string[];
  impuestoPresetIds: number[];
}

export interface IImportReferences {
  categoriaIds: number[];
  clavesProductoServicio: string[];
  clavesUnidad: string[];
  objetosImpuesto: string[];
  impuestoPresetIds: number[];
}
