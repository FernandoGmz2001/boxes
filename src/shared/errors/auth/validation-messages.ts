import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const authValidationMessages: ModuleValidationMessages = {
  email: {
    isEmail: 'El email no es válido.',
  },
  password: {
    isString: 'La contraseña debe ser un texto.',
    isNotEmpty: 'La contraseña es obligatoria.',
  },
};
