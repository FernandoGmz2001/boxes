import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const movementValidationMessages: ModuleValidationMessages = {
  producto_id: {
    isInt: 'El producto debe ser un número entero.',
    min: 'El producto debe ser mayor a cero.',
  },
  usuario_id: {
    isInt: 'El usuario debe ser un número entero.',
    min: 'El usuario debe ser mayor a cero.',
  },
  tipo_movimiento: {
    isString: 'El tipo de movimiento debe ser un texto.',
    isIn: 'El tipo de movimiento debe ser Entrada, Salida o Ajuste.',
  },
  cantidad: {
    isInt: 'La cantidad debe ser un número entero.',
  },
  motivo: {
    isString: 'El motivo debe ser un texto.',
    isNotEmpty: 'El motivo no puede estar vacío.',
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
