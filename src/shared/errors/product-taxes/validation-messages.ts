import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const productTaxValidationMessages: ModuleValidationMessages = {
  impuesto_preset_id: {
    isInt: 'El impuesto debe ser un número entero.',
    min: 'El impuesto debe ser mayor a cero.',
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
