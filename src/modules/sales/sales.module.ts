import { Module } from '@nestjs/common';
import { SalesController } from './controllers/sales.controller.js';
import { SALES_REPOSITORY } from './interfaces/sales-repository.interface.js';
import { SalesRepository } from './repositories/sales.repository.js';
import { SalesService } from './services/sales.service.js';

@Module({
  controllers: [SalesController],
  providers: [
    SalesService,
    {
      provide: SALES_REPOSITORY,
      useClass: SalesRepository,
    },
  ],
})
export class SalesModule {}
