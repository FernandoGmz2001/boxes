import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller.js';
import { PRODUCTS_REPOSITORY } from './interfaces/products-repository.interface.js';
import { ProductsRepository } from './repositories/products.repository.js';
import { ProductsService } from './services/products.service.js';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: PRODUCTS_REPOSITORY,
      useClass: ProductsRepository,
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
