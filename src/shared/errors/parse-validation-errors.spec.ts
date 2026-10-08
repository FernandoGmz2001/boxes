import type { ValidationError } from 'class-validator';
import { parseValidationErrors } from './parse-validation-errors.js';

class CreateProductDto {}

describe('parseValidationErrors', () => {
  it('translates a product field error to Spanish', () => {
    const errors: ValidationError[] = [
      {
        target: new CreateProductDto(),
        property: 'nombre_producto',
        value: 1,
        constraints: {
          isString: 'nombre_producto must be a string',
        },
        children: [],
      },
    ];

    expect(parseValidationErrors(errors)).toEqual([
      'El nombre del producto debe ser un texto.',
    ]);
  });

  it('translates a category field error to Spanish', () => {
    class CreateCategoryDto {}

    const errors: ValidationError[] = [
      {
        target: new CreateCategoryDto(),
        property: 'nombre',
        value: 1,
        constraints: {
          isString: 'nombre must be a string',
        },
        children: [],
      },
    ];

    expect(parseValidationErrors(errors)).toEqual([
      'El nombre de la categoría debe ser un texto.',
    ]);
  });
});
