import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const categoryValidationMessages: ModuleValidationMessages = {
  nombre: {
    isString: 'El nombre de la categoría debe ser un texto.',
    isNotEmpty: 'El nombre de la categoría es obligatorio.',
  },
  color_ui: {
    isString: 'El color debe ser un texto.',
    isNotEmpty: 'El color no puede estar vacío.',
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
