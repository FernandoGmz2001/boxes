import { authValidationMessages } from './auth/validation-messages.js';
import { categoryValidationMessages } from './categories/validation-messages.js';
import { movementValidationMessages } from './movements/validation-messages.js';
import { productTaxValidationMessages } from './product-taxes/validation-messages.js';
import { productValidationMessages } from './products/validation-messages.js';
import { satCatalogValidationMessages } from './sat-catalogs/validation-messages.js';
import { taxValidationMessages } from './taxes/validation-messages.js';
import { userValidationMessages } from './users/validation-messages.js';
import type { ModuleValidationMessages } from './validation-message-catalog.js';

const validationCatalogs: Record<string, ModuleValidationMessages> = {
  CreateProductDto: productValidationMessages,
  UpdateProductDto: productValidationMessages,
  ListProductsQueryDto: productValidationMessages,
  CreateCategoryDto: categoryValidationMessages,
  UpdateCategoryDto: categoryValidationMessages,
  ListCategoriesQueryDto: categoryValidationMessages,
  CreateProductTaxDto: productTaxValidationMessages,
  UpdateProductTaxDto: productTaxValidationMessages,
  ListProductTaxesQueryDto: productTaxValidationMessages,
  ListTaxesQueryDto: taxValidationMessages,
  ListSatCatalogQueryDto: satCatalogValidationMessages,
  CreateMovementDto: movementValidationMessages,
  ListMovementsQueryDto: movementValidationMessages,
  LoginDto: authValidationMessages,
  CreateUserDto: userValidationMessages,
  UpdateUserDto: userValidationMessages,
  ListUsersQueryDto: userValidationMessages,
};

export function findValidationCatalog(
  dtoName: string,
): ModuleValidationMessages | undefined {
  return validationCatalogs[dtoName];
}
