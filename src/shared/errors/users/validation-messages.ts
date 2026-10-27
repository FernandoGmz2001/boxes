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
  rol_id: {
    isInt: 'El rol debe ser un número entero.',
    min: 'Selecciona un rol válido.',
  },
  activo: {
    isBoolean: 'Activo debe ser verdadero o falso.',
  },
  busqueda: {
    isString: 'La búsqueda debe ser un texto.',
    isNotEmpty: 'La búsqueda no puede estar vacía.',
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
