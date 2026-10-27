import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { CreateRoleDto } from '../dtos/create-role.dto.js';
import { ListRolesQueryDto } from '../dtos/list-roles-query.dto.js';
import { UpdateRoleDto } from '../dtos/update-role.dto.js';
import type { IRol } from '../interfaces/rol.interface.js';
import { RolesService } from '../services/roles.service.js';

@RequirePermissions('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /** También lo usa el módulo de usuarios para asignar roles. */
  @RequirePermissions('roles', 'usuarios')
  @Get()
  async findAllRoles(@Query() query: ListRolesQueryDto): Promise<IPage<IRol>> {
    return this.rolesService.findAllRoles(query);
  }

  @Get(':id')
  async findRoleById(@Param('id', ParseIntPipe) id: number): Promise<IRol> {
    return this.rolesService.findRoleById(id);
  }

  @Post()
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<IRol> {
    return this.rolesService.createRole(createRoleDto);
  }

  @Patch(':id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<IRol> {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.rolesService.deleteRole(id);
  }
}
