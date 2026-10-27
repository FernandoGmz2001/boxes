import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { ICaja } from './caja.interface.js';

export const CASH_REGISTERS_REPOSITORY: symbol = Symbol(
  'CASH_REGISTERS_REPOSITORY',
);

export interface IListCajas extends IPagination {
  activa?: boolean;
}

export interface ICreateCaja {
  nombre: string;
  activa: boolean;
}

export interface IUpdateCaja {
  nombre?: string;
  activa?: boolean;
}

export interface ICashRegistersRepository {
  findAll(filter: IListCajas): Promise<IPageResult<ICaja>>;
  findById(id: number): Promise<ICaja | null>;
  findByNombre(nombre: string): Promise<ICaja | null>;
  create(input: ICreateCaja): Promise<ICaja>;
  update(id: number, input: IUpdateCaja): Promise<ICaja>;
  hasTurnoAbierto(id: number): Promise<boolean>;
}
