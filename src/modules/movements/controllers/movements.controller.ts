import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { CreateMovementDto } from '../dtos/create-movement.dto.js';
import { ListMovementsQueryDto } from '../dtos/list-movements-query.dto.js';
import type { IMovimiento } from '../interfaces/movimiento.interface.js';
import { MovementsService } from '../services/movements.service.js';

@RequirePermissions('movimientos')
@Controller('movimientos')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  async findAllMovements(
    @Query() query: ListMovementsQueryDto,
  ): Promise<IPage<IMovimiento>> {
    return this.movementsService.findAllMovements(query);
  }

  @Get(':id')
  async findMovementById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IMovimiento> {
    return this.movementsService.findMovementById(id);
  }

  /** Productos registra movimientos al editar existencias en la tabla. */
  @RequirePermissions('movimientos', 'productos')
  @Post()
  async createMovement(
    @CurrentUser() usuario: IAuthUser,
    @Body() createMovementDto: CreateMovementDto,
  ): Promise<IMovimiento> {
    return this.movementsService.createMovement(
      createMovementDto,
      usuario.id,
    );
  }
}
