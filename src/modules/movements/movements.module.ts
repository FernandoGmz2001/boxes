import { Module } from '@nestjs/common';
import { MovementsController } from './controllers/movements.controller.js';
import { MOVEMENTS_REPOSITORY } from './interfaces/movements-repository.interface.js';
import { MovementsRepository } from './repositories/movements.repository.js';
import { MovementsService } from './services/movements.service.js';

@Module({
  controllers: [MovementsController],
  providers: [
    MovementsService,
    {
      provide: MOVEMENTS_REPOSITORY,
      useClass: MovementsRepository,
    },
  ],
})
export class MovementsModule {}
