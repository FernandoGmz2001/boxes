import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { ListTaxesQueryDto } from '../dtos/list-taxes-query.dto.js';
import type { IImpuesto } from '../interfaces/impuesto.interface.js';
import { TaxesService } from '../services/taxes.service.js';

@Controller('impuestos')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  async findAllTaxes(
    @Query() query: ListTaxesQueryDto,
  ): Promise<IPage<IImpuesto>> {
    return this.taxesService.findAllTaxes(query);
  }

  @Get(':id')
  async findTaxById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IImpuesto> {
    return this.taxesService.findTaxById(id);
  }
}
