import { Module } from '@nestjs/common';
import { CashRegistersController } from './controllers/cash-registers.controller.js';
import { CASH_REGISTERS_REPOSITORY } from './interfaces/cash-registers-repository.interface.js';
import { CashRegistersRepository } from './repositories/cash-registers.repository.js';
import { CashRegistersService } from './services/cash-registers.service.js';

@Module({
  controllers: [CashRegistersController],
  providers: [
    CashRegistersService,
    {
      provide: CASH_REGISTERS_REPOSITORY,
      useClass: CashRegistersRepository,
    },
  ],
})
export class CashRegistersModule {}
