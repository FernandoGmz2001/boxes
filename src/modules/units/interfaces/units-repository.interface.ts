import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { IUnidad } from './unidad.interface.js';

export const UNITS_REPOSITORY: symbol = Symbol('UNITS_REPOSITORY');

export interface IUnitsRepository {
  findAll(pagination: IPagination): Promise<IPageResult<IUnidad>>;
  findById(id: number): Promise<IUnidad | null>;
}
