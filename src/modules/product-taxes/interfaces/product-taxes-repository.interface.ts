import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { IProductoImpuesto } from './producto-impuesto.interface.js';

export const PRODUCT_TAXES_REPOSITORY: symbol = Symbol(
  'PRODUCT_TAXES_REPOSITORY',
);

export interface ICreateProductoImpuesto {
  producto_id: number;
  impuesto_preset_id: number;
}

export interface IUpdateProductoImpuesto {
  impuesto_preset_id: number;
}

export interface IProductTaxesRepository {
  productExists(productoId: number): Promise<boolean>;
  findAll(
    productoId: number,
    pagination: IPagination,
  ): Promise<IPageResult<IProductoImpuesto>>;
  findById(
    productoId: number,
    id: number,
  ): Promise<IProductoImpuesto | null>;
  findByPreset(
    productoId: number,
    impuestoPresetId: number,
  ): Promise<IProductoImpuesto | null>;
  create(input: ICreateProductoImpuesto): Promise<IProductoImpuesto>;
  update(
    id: number,
    input: IUpdateProductoImpuesto,
  ): Promise<IProductoImpuesto>;
  delete(id: number): Promise<void>;
}
