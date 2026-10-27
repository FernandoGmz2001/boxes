import type { IPageResult } from '../../../shared/pagination/paginated.interface.js';
import type {
  IImportReferences,
  IImportReferencesQuery,
} from './import-productos.interface.js';
import type { IProducto } from './producto.interface.js';

export const PRODUCTS_REPOSITORY: symbol = Symbol('PRODUCTS_REPOSITORY');

export interface ICategoriaRef {
  id: number;
}

export interface ICreateProducto {
  nombre_producto: string;
  imagen_url?: string;
  cantidad_en_existencia: number;
  stock_minimo: number;
  sku?: string;
  codigo_barras?: string;
  precio_venta: string;
  costo_compra: string;
  es_servicio: boolean;
  activo: boolean;
  id_categoria: number;
  clave_producto_servicio?: string;
  clave_unidad_medida?: string;
  objeto_impuesto?: string;
  impuesto_preset_ids: number[];
}

export interface IUpdateProducto {
  nombre_producto?: string;
  imagen_url?: string | null;
  stock_minimo?: number;
  sku?: string | null;
  codigo_barras?: string | null;
  precio_venta?: string;
  costo_compra?: string;
  es_servicio?: boolean;
  activo?: boolean;
  id_categoria?: number;
  clave_producto_servicio?: string | null;
  clave_unidad_medida?: string | null;
  objeto_impuesto?: string | null;
  impuesto_preset_ids?: number[];
}

export interface IUpdateProductoItem extends IUpdateProducto {
  id: number;
}

export interface IUpdateManyProductosResult {
  missingIds: number[];
  productos: IProducto[];
}

export interface IDeactivateManyProductosResult {
  missingIds: number[];
  productos: IProducto[];
}

export interface IListProductos {
  busqueda?: string;
  activo?: boolean;
  pagina: number;
  limite: number;
}

export interface IProductsRepository {
  findCategoriaById(id: number): Promise<ICategoriaRef | null>;
  claveProductoServicioExists(clave: string): Promise<boolean>;
  claveUnidadExists(clave: string): Promise<boolean>;
  objetoImpuestoExists(clave: string): Promise<boolean>;
  findAll(filter: IListProductos): Promise<IPageResult<IProducto>>;
  findById(id: number): Promise<IProducto | null>;
  create(input: ICreateProducto): Promise<IProducto>;
  createMany(inputs: ICreateProducto[]): Promise<IProducto[]>;
  findImportReferences(
    query: IImportReferencesQuery,
  ): Promise<IImportReferences>;
  update(id: number, input: IUpdateProducto): Promise<IProducto | null>;
  updateMany(items: IUpdateProductoItem[]): Promise<IUpdateManyProductosResult>;
  deactivate(id: number): Promise<IProducto | null>;
  deactivateMany(ids: number[]): Promise<IDeactivateManyProductosResult>;
}
