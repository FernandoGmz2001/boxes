import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { ICategoria } from './categoria.interface.js';

export const CATEGORIES_REPOSITORY: symbol = Symbol('CATEGORIES_REPOSITORY');

export interface ICreateCategoria {
  nombre: string;
  color_ui?: string;
}

export interface IUpdateCategoria {
  nombre?: string;
  color_ui?: string | null;
}

export interface ICategoriesRepository {
  findAll(pagination: IPagination): Promise<IPageResult<ICategoria>>;
  findById(id: number): Promise<ICategoria | null>;
  create(input: ICreateCategoria): Promise<ICategoria>;
  update(id: number, input: IUpdateCategoria): Promise<ICategoria | null>;
  countProductos(id: number): Promise<number>;
  delete(id: number): Promise<boolean>;
}
