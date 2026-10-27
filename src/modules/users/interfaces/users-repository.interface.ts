import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { IUsuario } from './usuario.interface.js';

export const USERS_REPOSITORY: symbol = Symbol('USERS_REPOSITORY');

export interface IUsuarioFilters {
  busqueda?: string;
  activo?: boolean;
}

export interface ICreateUsuario {
  nombre: string;
  email: string;
  password: string;
  rol_id: number;
}

export interface IUpdateUsuario {
  nombre?: string;
  email?: string;
  password?: string;
  rol_id?: number;
  activo?: boolean;
}

export interface IUsersRepository {
  findAll(
    pagination: IPagination,
    filters: IUsuarioFilters,
  ): Promise<IPageResult<IUsuario>>;
  findById(id: number): Promise<IUsuario | null>;
  findByEmail(email: string): Promise<IUsuario | null>;
  rolExists(rolId: number): Promise<boolean>;
  create(input: ICreateUsuario): Promise<IUsuario>;
  update(id: number, input: IUpdateUsuario): Promise<IUsuario | null>;
}
