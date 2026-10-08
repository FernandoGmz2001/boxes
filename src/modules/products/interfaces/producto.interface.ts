export interface IProducto {
  id: number;
  nombre_producto: string;
  imagen_url: string | null;
  cantidad_en_existencia: number;
  stock_minimo: number;
  sku: string | null;
  codigo_barras: string | null;
  precio_venta: string;
  costo_compra: string;
  es_servicio: boolean;
  activo: boolean;
  id_categoria: number;
  clave_producto_servicio: string | null;
  clave_unidad_medida: string | null;
  objeto_impuesto: string | null;
  created_at: Date;
  updated_at: Date;
  impuestos: number[];
}
