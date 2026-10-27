export const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia'] as const;

export type MetodoPago = (typeof METODOS_PAGO)[number];

export interface IDetalleVenta {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

export interface IVenta {
  id: number;
  folio: string;
  usuario_id: number;
  turno_id: number | null;
  cliente_id: number | null;
  metodo_pago: string;
  total: string;
  created_at: string;
  detalles: IDetalleVenta[];
}

/** Para el detalle y la reimpresión del ticket. */
export interface IDetalleVentaConProducto extends IDetalleVenta {
  nombre_producto: string;
}

export interface IVentaDetalle extends Omit<IVenta, 'detalles'> {
  usuario: { id: number; nombre: string };
  detalles: IDetalleVentaConProducto[];
}

/** articulos es la suma de cantidades de la venta. */
export interface IVentaResumen extends Omit<IVenta, 'detalles'> {
  articulos: number;
}

/** precio_venta llega como texto con dos decimales para no pasar por punto flotante. */
export interface IProductoVendible {
  id: number;
  cantidad_en_existencia: number;
  activo: boolean;
  es_servicio: boolean;
  precio_venta: string;
}

export interface IStockFaltante {
  producto_id: number;
  solicitado: number;
  disponible: number;
}
