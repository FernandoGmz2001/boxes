import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { CloseShiftDto } from '../dtos/close-shift.dto.js';
import { CreateCashMovementDto } from '../dtos/create-cash-movement.dto.js';
import { ListShiftsQueryDto } from '../dtos/list-shifts-query.dto.js';
import { OpenShiftDto } from '../dtos/open-shift.dto.js';
import type {
  ICierreTurno,
  ICorteTurno,
  IMovimientoCaja,
  ITurno,
  ITurnoDetalle,
  ITurnoResumen,
} from '../interfaces/turno.interface.js';
import { ShiftsService } from '../services/shifts.service.js';

/** Con ventas se operan los turnos propios; con cajas también los de otros usuarios. */
@RequirePermissions('ventas', 'cajas')
@Controller('turnos')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @RequirePermissions('cajas')
  @Get()
  async findAllShifts(
    @Query() query: ListShiftsQueryDto,
  ): Promise<IPage<ITurnoResumen>> {
    return this.shiftsService.findAllShifts(query);
  }

  @RequirePermissions('ventas')
  @Get('actual')
  async findCurrentShift(@CurrentUser() usuario: IAuthUser): Promise<ITurno> {
    return this.shiftsService.findCurrentShift(usuario);
  }

  @Get(':id')
  async findShiftById(
    @CurrentUser() usuario: IAuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ITurnoDetalle> {
    return this.shiftsService.findShiftById(id, usuario);
  }

  @RequirePermissions('ventas')
  @Post()
  async openShift(
    @CurrentUser() usuario: IAuthUser,
    @Body() openShiftDto: OpenShiftDto,
  ): Promise<ITurno> {
    return this.shiftsService.openShift(openShiftDto, usuario);
  }

  @Get(':id/corte')
  async getShiftCorte(
    @CurrentUser() usuario: IAuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ICorteTurno> {
    return this.shiftsService.getShiftCorte(id, usuario);
  }

  @Post(':id/movimientos')
  async createCashMovement(
    @CurrentUser() usuario: IAuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() createCashMovementDto: CreateCashMovementDto,
  ): Promise<IMovimientoCaja> {
    return this.shiftsService.createCashMovement(
      id,
      createCashMovementDto,
      usuario,
    );
  }

  @Post(':id/cierre')
  @HttpCode(HttpStatus.OK)
  async closeShift(
    @CurrentUser() usuario: IAuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() closeShiftDto: CloseShiftDto,
  ): Promise<ICierreTurno> {
    return this.shiftsService.closeShift(id, closeShiftDto, usuario);
  }
}
