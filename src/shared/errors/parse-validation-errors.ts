import type { ValidationError } from 'class-validator';
import { findValidationCatalog } from './validation-catalogs.js';
import type { ModuleValidationMessages } from './validation-message-catalog.js';

const constraintFallbacks: Record<string, string> = {
  isString: 'Debe ser un texto.',
  isNotEmpty: 'Es obligatorio.',
  isInt: 'Debe ser un número entero.',
  isNumber: 'Debe ser un número con hasta 2 decimales.',
  isBoolean: 'Debe ser verdadero o falso.',
  min: 'Está por debajo del mínimo permitido.',
  max: 'Supera el máximo permitido.',
  isArray: 'Debe ser una lista.',
  arrayUnique: 'No debe tener valores repetidos.',
  whitelistValidation: 'No está permitido.',
};

export function parseValidationErrors(errors: ValidationError[]): string[] {
  const dtoName: string = readDtoName(errors);
  const catalog: ModuleValidationMessages | undefined =
    findValidationCatalog(dtoName);

  return flattenErrors(errors, catalog, undefined);
}

function readDtoName(errors: ValidationError[]): string {
  const target: object | undefined = errors[0]?.target;

  if (!target) {
    return '';
  }

  return target.constructor.name;
}

function flattenErrors(
  errors: ValidationError[],
  catalog: ModuleValidationMessages | undefined,
  parentField: string | undefined,
): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    const field: string = isIndex(error.property)
      ? (parentField ?? error.property)
      : error.property;

    if (error.constraints) {
      for (const constraint of Object.keys(error.constraints)) {
        messages.push(resolveMessage(catalog, field, constraint));
      }
    }

    if (error.children && error.children.length > 0) {
      messages.push(...flattenErrors(error.children, catalog, field));
    }
  }

  return messages;
}

function resolveMessage(
  catalog: ModuleValidationMessages | undefined,
  field: string,
  constraint: string,
): string {
  const translated: string | undefined = catalog?.[field]?.[constraint];

  if (translated) {
    return translated;
  }

  if (constraint === 'whitelistValidation') {
    return `El campo ${field} no está permitido.`;
  }

  const fallback: string | undefined = constraintFallbacks[constraint];

  if (fallback) {
    return `${field}: ${fallback}`;
  }

  return `${field} no es válido.`;
}

function isIndex(property: string): boolean {
  return /^\d+$/.test(property);
}
