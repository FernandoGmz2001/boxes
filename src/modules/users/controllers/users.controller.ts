import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { ListUsersQueryDto } from '../dtos/list-users-query.dto.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import type { IUsuario } from '../interfaces/usuario.interface.js';
import { UsersService } from '../services/users.service.js';

@RequirePermissions('usuarios')
@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAllUsers(
    @Query() query: ListUsersQueryDto,
  ): Promise<IPage<IUsuario>> {
    return this.usersService.findAllUsers(query);
  }

  @Get(':id')
  async findUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IUsuario> {
    return this.usersService.findUserById(id);
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<IUsuario> {
    return this.usersService.createUser(createUserDto);
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: IAuthUser,
  ): Promise<IUsuario> {
    return this.usersService.updateUser(id, updateUserDto, currentUser);
  }
}
