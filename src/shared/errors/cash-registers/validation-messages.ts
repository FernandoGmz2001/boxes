import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const cashRegisterValidationMessages: ModuleValidationMessages = {
  nombre: {
    isString: 'El nombre de la caja debe ser un texto.',
    isNotEmpty: 'El nombre de la caja es obligatorio.',
    maxLength: 'El nombre de la caja no puede tener más de 60 caracteres.',
  },
  activa: {
    isBoolean: 'Activa debe ser verdadero o falso.',
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
