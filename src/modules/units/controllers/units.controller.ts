import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { ListUnitsQueryDto } from '../dtos/list-units-query.dto.js';
import type { IUnidad } from '../interfaces/unidad.interface.js';
import { UnitsService } from '../services/units.service.js';

@Controller('unidades')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  async findAllUnits(
    @Query() query: ListUnitsQueryDto,
  ): Promise<IPage<IUnidad>> {
    return this.unitsService.findAllUnits(query);
  }

  @Get(':id')
  async findUnitById(@Param('id', ParseIntPipe) id: number): Promise<IUnidad> {
    return this.unitsService.findUnitById(id);
  }
}
