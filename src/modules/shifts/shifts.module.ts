import { Module } from '@nestjs/common';
import { ShiftsController } from './controllers/shifts.controller.js';
import { SHIFTS_REPOSITORY } from './interfaces/shifts-repository.interface.js';
import { ShiftsRepository } from './repositories/shifts.repository.js';
import { ShiftsService } from './services/shifts.service.js';

@Module({
  controllers: [ShiftsController],
  providers: [
    ShiftsService,
    {
      provide: SHIFTS_REPOSITORY,
      useClass: ShiftsRepository,
    },
  ],
})
export class ShiftsModule {}
