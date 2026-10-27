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
import { CreateSaleDto } from '../dtos/create-sale.dto.js';
import { ListSalesQueryDto } from '../dtos/list-sales-query.dto.js';
import type {
  IVenta,
  IVentaDetalle,
  IVentaResumen,
} from '../interfaces/venta.interface.js';
import { SalesService } from '../services/sales.service.js';

@RequirePermissions('ventas')
@Controller('ventas')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /** Con cajas se consultan las ventas de todos los usuarios. */
  @RequirePermissions('ventas', 'cajas')
  @Get()
  async findAllSales(
    @CurrentUser() usuario: IAuthUser,
    @Query() query: ListSalesQueryDto,
  ): Promise<IPage<IVentaResumen>> {
    return this.salesService.findAllSales(query, usuario);
  }

  @RequirePermissions('ventas', 'cajas')
  @Get(':id')
  async findSaleById(
    @CurrentUser() usuario: IAuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IVentaDetalle> {
    return this.salesService.findSaleById(id, usuario);
  }

  @Post()
  async processSale(
    @CurrentUser() usuario: IAuthUser,
    @Body() createSaleDto: CreateSaleDto,
  ): Promise<IVenta> {
    return this.salesService.processSale(createSaleDto, usuario.id);
  }
}
