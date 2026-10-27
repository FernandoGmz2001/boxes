import { Module } from '@nestjs/common';
import { RolesController } from './controllers/roles.controller.js';
import { ROLES_REPOSITORY } from './interfaces/roles-repository.interface.js';
import { RolesRepository } from './repositories/roles.repository.js';
import { RolesService } from './services/roles.service.js';

@Module({
  controllers: [RolesController],
  providers: [
    RolesService,
    {
      provide: ROLES_REPOSITORY,
      useClass: RolesRepository,
    },
  ],
})
export class RolesModule {}
