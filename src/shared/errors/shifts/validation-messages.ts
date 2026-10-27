import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const shiftValidationMessages: ModuleValidationMessages = {
  caja_id: {
    isInt: 'La caja debe ser un número entero.',
    min: 'La caja debe ser mayor a cero.',
  },
  usuario_id: {
    isInt: 'El usuario debe ser un número entero.',
    min: 'El usuario debe ser mayor a cero.',
  },
  fondo_inicial: {
    isNumber: 'El fondo inicial debe ser un número con hasta 2 decimales.',
    min: 'El fondo inicial no puede ser negativo.',
    max: 'El fondo inicial no puede ser mayor a 99,999,999.99.',
  },
  tipo: {
    isString: 'El tipo de movimiento debe ser un texto.',
    isIn: 'El tipo de movimiento debe ser Entrada o Retiro.',
  },
  monto: {
    isNumber: 'El monto debe ser un número con hasta 2 decimales.',
    min: 'El monto debe ser mayor a cero.',
    max: 'El monto no puede ser mayor a 99,999,999.99.',
  },
  motivo: {
    isString: 'El motivo debe ser un texto.',
    isNotEmpty: 'El motivo es obligatorio.',
    maxLength: 'El motivo no puede tener más de 200 caracteres.',
  },
  efectivo_contado: {
    isNumber: 'El efectivo contado debe ser un número con hasta 2 decimales.',
    min: 'El efectivo contado no puede ser negativo.',
    max: 'El efectivo contado no puede ser mayor a 99,999,999.99.',
  },
  notas: {
    isString: 'Las notas deben ser un texto.',
    isNotEmpty: 'Las notas no pueden estar vacías.',
    maxLength: 'Las notas no pueden tener más de 500 caracteres.',
  },
  estado: {
    isString: 'El estado debe ser un texto.',
    isIn: 'El estado debe ser Abierto o Cerrado.',
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
