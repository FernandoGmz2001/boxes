import { authValidationMessages } from './auth/validation-messages.js';
import { cashRegisterValidationMessages } from './cash-registers/validation-messages.js';
import { categoryValidationMessages } from './categories/validation-messages.js';
import { movementValidationMessages } from './movements/validation-messages.js';
import { productTaxValidationMessages } from './product-taxes/validation-messages.js';
import { productValidationMessages } from './products/validation-messages.js';
import { roleValidationMessages } from './roles/validation-messages.js';
import { saleValidationMessages } from './sales/validation-messages.js';
import { satCatalogValidationMessages } from './sat-catalogs/validation-messages.js';
import { shiftValidationMessages } from './shifts/validation-messages.js';
import { taxValidationMessages } from './taxes/validation-messages.js';
import { unitValidationMessages } from './units/validation-messages.js';
import { userValidationMessages } from './users/validation-messages.js';
import type { ModuleValidationMessages } from './validation-message-catalog.js';

const validationCatalogs: Record<string, ModuleValidationMessages> = {
  CreateProductDto: productValidationMessages,
  UpdateProductDto: productValidationMessages,
  UpdateProductsDto: productValidationMessages,
  ListProductsQueryDto: productValidationMessages,
  CreateCategoryDto: categoryValidationMessages,
  UpdateCategoryDto: categoryValidationMessages,
  ListCategoriesQueryDto: categoryValidationMessages,
  CreateProductTaxDto: productTaxValidationMessages,
  UpdateProductTaxDto: productTaxValidationMessages,
  ListProductTaxesQueryDto: productTaxValidationMessages,
  ListTaxesQueryDto: taxValidationMessages,
  ListUnitsQueryDto: unitValidationMessages,
  ListSatCatalogQueryDto: satCatalogValidationMessages,
  CreateMovementDto: movementValidationMessages,
  ListMovementsQueryDto: movementValidationMessages,
  CreateSaleDto: saleValidationMessages,
  ListSalesQueryDto: saleValidationMessages,
  CreateCashRegisterDto: cashRegisterValidationMessages,
  UpdateCashRegisterDto: cashRegisterValidationMessages,
  ListCashRegistersQueryDto: cashRegisterValidationMessages,
  OpenShiftDto: shiftValidationMessages,
  CreateCashMovementDto: shiftValidationMessages,
  CloseShiftDto: shiftValidationMessages,
  ListShiftsQueryDto: shiftValidationMessages,
  LoginDto: authValidationMessages,
  CreateUserDto: userValidationMessages,
  UpdateUserDto: userValidationMessages,
  ListUsersQueryDto: userValidationMessages,
  CreateRoleDto: roleValidationMessages,
  UpdateRoleDto: roleValidationMessages,
  ListRolesQueryDto: roleValidationMessages,
};

export function findValidationCatalog(
  dtoName: string,
): ModuleValidationMessages | undefined {
  return validationCatalogs[dtoName];
}
