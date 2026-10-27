import { Module } from '@nestjs/common';
import { UnitsController } from './controllers/units.controller.js';
import { UNITS_REPOSITORY } from './interfaces/units-repository.interface.js';
import { UnitsRepository } from './repositories/units.repository.js';
import { UnitsService } from './services/units.service.js';

@Module({
  controllers: [UnitsController],
  providers: [
    UnitsService,
    {
      provide: UNITS_REPOSITORY,
      useClass: UnitsRepository,
    },
  ],
})
export class UnitsModule {}
