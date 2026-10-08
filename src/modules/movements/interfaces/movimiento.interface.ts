export const TIPOS_MOVIMIENTO = ['Entrada', 'Salida', 'Ajuste'] as const;

export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

export interface IMovimiento {
  id: number;
  producto_id: number;
  tipo_movimiento: string;
  cantidad: number;
  stock_previo: number;
  stock_nuevo: number;
  motivo: string | null;
  usuario_id: number;
  created_at: string;
}

export interface IProductoStock {
  id: number;
  cantidad_en_existencia: number;
  activo: boolean;
}

export interface IUsuarioRef {
  id: number;
  activo: boolean;
}
