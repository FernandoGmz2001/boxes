import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller.js';
import { USERS_REPOSITORY } from './interfaces/users-repository.interface.js';
import { UsersRepository } from './repositories/users.repository.js';
import { UsersService } from './services/users.service.js';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepository,
    },
  ],
})
export class UsersModule {}
