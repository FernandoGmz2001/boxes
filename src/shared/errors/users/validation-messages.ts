import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const userValidationMessages: ModuleValidationMessages = {
  nombre: {
    isString: 'El nombre debe ser un texto.',
    isNotEmpty: 'El nombre es obligatorio.',
  },
  email: {
    isEmail: 'El email no es válido.',
  },
  password: {
    isString: 'La contraseña debe ser un texto.',
    minLength: 'La contraseña debe tener al menos 8 caracteres.',
  },
  rol: {
    isString: 'El rol debe ser un texto.',
    isIn: 'El rol debe ser admin u operador.',
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
};
