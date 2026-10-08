import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { IUsuario } from './usuario.interface.js';

export const USERS_REPOSITORY: symbol = Symbol('USERS_REPOSITORY');

export interface ICreateUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface IUpdateUsuario {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: string;
  activo?: boolean;
}

export interface IUsersRepository {
  findAll(pagination: IPagination): Promise<IPageResult<IUsuario>>;
  findById(id: number): Promise<IUsuario | null>;
  findByEmail(email: string): Promise<IUsuario | null>;
  create(input: ICreateUsuario): Promise<IUsuario>;
  update(id: number, input: IUpdateUsuario): Promise<IUsuario | null>;
}
