import { Module } from '@nestjs/common';
import {
  ProductServiceKeysController,
  TaxObjectsController,
  UnitKeysController,
} from './controllers/sat-catalogs.controller.js';
import { SAT_CATALOGS_REPOSITORY } from './interfaces/sat-catalogs-repository.interface.js';
import { SatCatalogsRepository } from './repositories/sat-catalogs.repository.js';
import { SatCatalogsService } from './services/sat-catalogs.service.js';

@Module({
  controllers: [
    ProductServiceKeysController,
    UnitKeysController,
    TaxObjectsController,
  ],
  providers: [
    SatCatalogsService,
    {
      provide: SAT_CATALOGS_REPOSITORY,
      useClass: SatCatalogsRepository,
    },
  ],
})
export class SatCatalogsModule {}
