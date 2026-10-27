import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const saleValidationMessages: ModuleValidationMessages = {
  cliente_id: {
    isInt: 'El cliente debe ser un número entero.',
    min: 'El cliente debe ser mayor a cero.',
  },
  metodo_pago: {
    isString: 'El método de pago debe ser un texto.',
    isIn: 'El método de pago debe ser Efectivo, Tarjeta o Transferencia.',
  },
  carrito: {
    isArray: 'El carrito debe enviarse como una lista.',
    arrayMinSize: 'El carrito debe tener al menos un producto.',
    arrayMaxSize: 'El carrito no puede tener más de 100 productos.',
    arrayUnique: 'Los productos del carrito no deben repetirse.',
    nestedValidation: 'Cada producto del carrito debe ser un objeto.',
  },
  producto_id: {
    isInt: 'El producto debe ser un número entero.',
    min: 'El producto debe ser mayor a cero.',
  },
  cantidad: {
    isInt: 'La cantidad debe ser un número entero.',
    min: 'La cantidad debe ser mayor a cero.',
  },
  turno_id: {
    isInt: 'El turno debe ser un número entero.',
    min: 'El turno debe ser mayor a cero.',
  },
  usuario_id: {
    isInt: 'El usuario debe ser un número entero.',
    min: 'El usuario debe ser mayor a cero.',
  },
  folio: {
    isString: 'El folio debe ser un texto.',
    isNotEmpty: 'El folio no puede estar vacío.',
  },
  fecha_desde: {
    isIso8601: 'La fecha inicial debe tener formato ISO 8601.',
  },
  fecha_hasta: {
    isIso8601: 'La fecha final debe tener formato ISO 8601.',
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
};
