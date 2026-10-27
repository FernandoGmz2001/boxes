import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type {
  ICajaRef,
  ICierreTurno,
  IMovimientoCaja,
  ITotalesTurno,
  ITurno,
  ITurnoDetalle,
  ITurnoResumen,
} from './turno.interface.js';

export const SHIFTS_REPOSITORY: symbol = Symbol('SHIFTS_REPOSITORY');

export interface IListTurnos extends IPagination {
  caja_id?: number;
  usuario_id?: number;
  estado?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
}

export interface IAbrirTurno {
  caja_id: number;
  usuario_id: number;
  fondo_inicial: string;
}

export interface ICreateMovimientoCaja {
  turno_id: number;
  usuario_id: number;
  tipo: string;
  monto: string;
  motivo: string;
}

export interface ICerrarTurno {
  turno_id: number;
  efectivo_contado: string;
  notas?: string;
}

export interface IShiftsRepository {
  findAll(filter: IListTurnos): Promise<IPageResult<ITurnoResumen>>;
  findById(id: number): Promise<ITurno | null>;
  findDetalleById(id: number): Promise<ITurnoDetalle | null>;
  findAbiertoByUsuario(usuarioId: number): Promise<ITurno | null>;
  findCaja(id: number): Promise<ICajaRef | null>;
  findTotales(turnoId: number): Promise<ITotalesTurno>;
  /** Lanza ShiftAlreadyOpenError si la caja o el usuario ya tienen turno abierto. */
  open(input: IAbrirTurno): Promise<ITurno>;
  /** Lanza ShiftNotOpenError o InsufficientCashError. */
  createMovimiento(input: ICreateMovimientoCaja): Promise<IMovimientoCaja>;
  /** Lanza ShiftNotOpenError. */
  close(input: ICerrarTurno): Promise<ICierreTurno>;
}
