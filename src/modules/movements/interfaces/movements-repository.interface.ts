import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type {
  IMovimiento,
  IProductoStock,
  IUsuarioRef,
} from './movimiento.interface.js';

export const MOVEMENTS_REPOSITORY: symbol = Symbol('MOVEMENTS_REPOSITORY');

export interface IListMovimientos extends IPagination {
  producto_id?: number;
  usuario_id?: number;
}

export interface ICreateMovimiento {
  producto_id: number;
  usuario_id: number;
  tipo_movimiento: string;
  cantidad: number;
  stock_previo: number;
  stock_nuevo: number;
  motivo?: string;
}

export interface IMovementsRepository {
  findAll(filter: IListMovimientos): Promise<IPageResult<IMovimiento>>;
  findById(id: number): Promise<IMovimiento | null>;
  findProductoStock(productoId: number): Promise<IProductoStock | null>;
  findUsuario(usuarioId: number): Promise<IUsuarioRef | null>;
  create(input: ICreateMovimiento): Promise<IMovimiento | null>;
}
