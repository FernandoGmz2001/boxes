import { Module } from '@nestjs/common';
import { CategoriesController } from './controllers/categories.controller.js';
import { CATEGORIES_REPOSITORY } from './interfaces/categories-repository.interface.js';
import { CategoriesRepository } from './repositories/categories.repository.js';
import { CategoriesService } from './services/categories.service.js';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CATEGORIES_REPOSITORY,
      useClass: CategoriesRepository,
    },
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
