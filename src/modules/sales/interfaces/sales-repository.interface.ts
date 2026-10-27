import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type {
  IVenta,
  IVentaDetalle,
  IVentaResumen,
} from './venta.interface.js';

export const SALES_REPOSITORY: symbol = Symbol('SALES_REPOSITORY');

export interface ICreateDetalleVenta {
  producto_id: number;
  cantidad: number;
}

export interface ICreateVenta {
  usuario_id: number;
  cliente_id?: number;
  metodo_pago: string;
  detalles: ICreateDetalleVenta[];
}

export interface IListVentas extends IPagination {
  turno_id?: number;
  usuario_id?: number;
  folio?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
}

export interface ISalesRepository {
  /**
   * Toma los precios de producto.precio_venta y liga la venta al turno abierto del usuario.
   * Lanza NoOpenShiftError, SaleProductsNotFoundError, SaleProductsInactiveError o InsufficientStockError.
   */
  create(input: ICreateVenta): Promise<IVenta>;
  findAll(filter: IListVentas): Promise<IPageResult<IVentaResumen>>;
  findById(id: number): Promise<IVentaDetalle | null>;
}
