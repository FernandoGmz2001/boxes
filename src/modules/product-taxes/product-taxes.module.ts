import { Module } from '@nestjs/common';
import { ProductTaxesController } from './controllers/product-taxes.controller.js';
import { PRODUCT_TAXES_REPOSITORY } from './interfaces/product-taxes-repository.interface.js';
import { ProductTaxesRepository } from './repositories/product-taxes.repository.js';
import { ProductTaxesService } from './services/product-taxes.service.js';

@Module({
  controllers: [ProductTaxesController],
  providers: [
    ProductTaxesService,
    {
      provide: PRODUCT_TAXES_REPOSITORY,
      useClass: ProductTaxesRepository,
    },
  ],
  exports: [ProductTaxesService],
})
export class ProductTaxesModule {}
