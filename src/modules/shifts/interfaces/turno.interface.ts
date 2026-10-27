export const ESTADO_TURNO_ABIERTO: string = 'Abierto';
export const ESTADO_TURNO_CERRADO: string = 'Cerrado';
export const ESTADOS_TURNO = ['Abierto', 'Cerrado'] as const;

export const TIPOS_MOVIMIENTO_CAJA = ['Entrada', 'Retiro'] as const;

export type TipoMovimientoCaja = (typeof TIPOS_MOVIMIENTO_CAJA)[number];

export interface ITurno {
  id: number;
  caja_id: number;
  usuario_id: number;
  estado: string;
  fondo_inicial: string;
  efectivo_esperado: string | null;
  efectivo_contado: string | null;
  diferencia: string | null;
  notas: string | null;
  abierto_at: string;
  cerrado_at: string | null;
}

export interface IMovimientoCaja {
  id: number;
  turno_id: number;
  usuario_id: number;
  tipo: string;
  monto: string;
  motivo: string;
  created_at: string;
}

export interface ITurnoResumen extends ITurno {
  usuario: { id: number; nombre: string };
  caja: { id: number; nombre: string };
}

export interface ITurnoDetalle extends ITurno {
  usuario: { id: number; nombre: string };
  caja: { id: number; nombre: string };
  movimientos: IMovimientoCaja[];
}

export interface IVentasPorMetodo {
  metodo_pago: string;
  cantidad: number;
  importe: string;
}

/** Sumas crudas del turno, tal como salen de la base. */
export interface ITotalesTurno {
  fondo_inicial: string;
  ventas: IVentasPorMetodo[];
  entradas: string;
  retiros: string;
}

export interface ICorteTurno {
  turno_id: number;
  fondo_inicial: string;
  ventas: IVentasPorMetodo[];
  total_ventas: string;
  entradas: string;
  retiros: string;
  efectivo_esperado: string;
}

export interface ICierreTurno {
  turno: ITurno;
  corte: ICorteTurno;
}

export interface ICajaRef {
  id: number;
  activa: boolean;
}
