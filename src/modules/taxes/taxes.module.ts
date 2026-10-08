import { Module } from '@nestjs/common';
import { TaxesController } from './controllers/taxes.controller.js';
import { TAXES_REPOSITORY } from './interfaces/taxes-repository.interface.js';
import { TaxesRepository } from './repositories/taxes.repository.js';
import { TaxesService } from './services/taxes.service.js';

@Module({
  controllers: [TaxesController],
  providers: [
    TaxesService,
    {
      provide: TAXES_REPOSITORY,
      useClass: TaxesRepository,
    },
  ],
})
export class TaxesModule {}
