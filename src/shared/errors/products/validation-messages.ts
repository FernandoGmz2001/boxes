import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const productValidationMessages: ModuleValidationMessages = {
  nombre_producto: {
    isString: 'El nombre del producto debe ser un texto.',
    isNotEmpty: 'El nombre del producto es obligatorio.',
  },
  imagen_url: {
    isString: 'La imagen debe ser un texto.',
    isNotEmpty: 'La imagen no puede estar vacía.',
  },
  cantidad_en_existencia: {
    isInt: 'La cantidad en existencia debe ser un número entero.',
    min: 'La cantidad en existencia no puede ser negativa.',
  },
  stock_minimo: {
    isInt: 'El stock mínimo debe ser un número entero.',
    min: 'El stock mínimo no puede ser negativo.',
  },
  sku: {
    isString: 'El SKU debe ser un texto.',
    isNotEmpty: 'El SKU no puede estar vacío.',
  },
  codigo_barras: {
    isString: 'El código de barras debe ser un texto.',
    isNotEmpty: 'El código de barras no puede estar vacío.',
  },
  precio_venta: {
    isNumber: 'El precio de venta debe ser un número con hasta 2 decimales.',
    min: 'El precio de venta no puede ser negativo.',
    max: 'El precio de venta supera el máximo permitido.',
  },
  costo_compra: {
    isNumber: 'El costo de compra debe ser un número con hasta 2 decimales.',
    min: 'El costo de compra no puede ser negativo.',
    max: 'El costo de compra supera el máximo permitido.',
  },
  es_servicio: {
    isBoolean: 'Es servicio debe ser verdadero o falso.',
  },
  activo: {
    isBoolean: 'Activo debe ser verdadero o falso.',
  },
  pagina: {
    isInt: 'La página debe ser un número entero.',
    min: 'La página debe ser mayor a cero.',
  },
  limite: {
    isInt: 'El límite debe ser un número entero.',
    min: 'El límite debe ser mayor a cero.',
    max: 'El límite no puede ser mayor a 100.',
  },
  id_categoria: {
    isInt: 'La categoría debe ser un número entero.',
    min: 'La categoría no es válida.',
  },
  clave_producto_servicio: {
    isString: 'La clave de producto o servicio debe ser un texto.',
    isNotEmpty: 'La clave de producto o servicio no puede estar vacía.',
  },
  clave_unidad_medida: {
    isString: 'La clave de unidad de medida debe ser un texto.',
    isNotEmpty: 'La clave de unidad de medida no puede estar vacía.',
  },
  objeto_impuesto: {
    isString: 'El objeto de impuesto debe ser un texto.',
    isNotEmpty: 'El objeto de impuesto no puede estar vacío.',
  },
  impuesto_preset_ids: {
    isArray: 'Los impuestos deben enviarse como una lista.',
    arrayUnique: 'Los impuestos no deben repetirse.',
    isInt: 'Cada impuesto debe ser un número entero.',
    min: 'Cada impuesto debe ser mayor a cero.',
  },
};
