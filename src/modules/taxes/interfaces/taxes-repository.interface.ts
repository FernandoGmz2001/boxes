import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { IImpuesto } from './impuesto.interface.js';

export const TAXES_REPOSITORY: symbol = Symbol('TAXES_REPOSITORY');

export interface ITaxesRepository {
  findAll(pagination: IPagination): Promise<IPageResult<IImpuesto>>;
  findById(id: number): Promise<IImpuesto | null>;
}
