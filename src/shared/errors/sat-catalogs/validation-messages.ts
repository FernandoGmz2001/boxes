import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const satCatalogValidationMessages: ModuleValidationMessages = {
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
