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
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { CreateCashRegisterDto } from '../dtos/create-cash-register.dto.js';
import { ListCashRegistersQueryDto } from '../dtos/list-cash-registers-query.dto.js';
import { UpdateCashRegisterDto } from '../dtos/update-cash-register.dto.js';
import type { ICaja } from '../interfaces/caja.interface.js';
import { CashRegistersService } from '../services/cash-registers.service.js';

@RequirePermissions('cajas')
@Controller('cajas')
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  /** El cajero elige la caja al abrir su turno. */
  @RequirePermissions('cajas', 'ventas')
  @Get()
  async findAllCashRegisters(
    @Query() query: ListCashRegistersQueryDto,
  ): Promise<IPage<ICaja>> {
    return this.cashRegistersService.findAllCashRegisters(query);
  }

  @RequirePermissions('cajas', 'ventas')
  @Get(':id')
  async findCashRegisterById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ICaja> {
    return this.cashRegistersService.findCashRegisterById(id);
  }

  @Post()
  async createCashRegister(
    @Body() createCashRegisterDto: CreateCashRegisterDto,
  ): Promise<ICaja> {
    return this.cashRegistersService.createCashRegister(createCashRegisterDto);
  }

  @Patch(':id')
  async updateCashRegister(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCashRegisterDto: UpdateCashRegisterDto,
  ): Promise<ICaja> {
    return this.cashRegistersService.updateCashRegister(
      id,
      updateCashRegisterDto,
    );
  }
}
