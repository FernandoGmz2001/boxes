import type { ModuleValidationMessages } from '../validation-message-catalog.js';

export const roleValidationMessages: ModuleValidationMessages = {
  nombre: {
    isString: 'El nombre del rol debe ser un texto.',
    isNotEmpty: 'El nombre del rol es obligatorio.',
    maxLength: 'El nombre del rol no puede tener más de 60 caracteres.',
  },
  descripcion: {
    isString: 'La descripción debe ser un texto.',
    maxLength: 'La descripción no puede tener más de 200 caracteres.',
  },
  permisos: {
    isArray: 'Los permisos deben ser una lista.',
    arrayNotEmpty: 'Selecciona al menos un módulo.',
    isIn: 'Los permisos deben ser productos, movimientos, usuarios, roles, ventas o cajas.',
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
