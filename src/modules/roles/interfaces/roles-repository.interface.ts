import type { Permiso } from '../../auth/permissions.js';
import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { IRol } from './rol.interface.js';

export const ROLES_REPOSITORY: symbol = Symbol('ROLES_REPOSITORY');

export interface IRolFilters {
  busqueda?: string;
}

export interface ICreateRol {
  nombre: string;
  descripcion: string | null;
  permisos: Permiso[];
}

export interface IUpdateRol {
  nombre?: string;
  descripcion?: string | null;
  permisos?: Permiso[];
}

export interface IRolesRepository {
  findAll(
    pagination: IPagination,
    filters: IRolFilters,
  ): Promise<IPageResult<IRol>>;
  findById(id: number): Promise<IRol | null>;
  findByNombre(nombre: string): Promise<IRol | null>;
  create(input: ICreateRol): Promise<IRol>;
  update(id: number, input: IUpdateRol): Promise<IRol>;
  delete(id: number): Promise<void>;
}
