import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  IPage,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import {
  resolvePagination,
  toPage,
} from '../../../shared/pagination/paginated.interface.js';
import type { ListUnitsQueryDto } from '../dtos/list-units-query.dto.js';
import type { IUnidad } from '../interfaces/unidad.interface.js';
import {
  UNITS_REPOSITORY,
  type IUnitsRepository,
} from '../interfaces/units-repository.interface.js';

@Injectable()
export class UnitsService {
  constructor(
    @Inject(UNITS_REPOSITORY)
    private readonly unitsRepository: IUnitsRepository,
  ) {}

  async findAllUnits(query: ListUnitsQueryDto): Promise<IPage<IUnidad>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(await this.unitsRepository.findAll(pagination), pagination);
  }

  async findUnitById(id: number): Promise<IUnidad> {
    const unidad: IUnidad | null = await this.unitsRepository.findById(id);

    if (!unidad) {
      throw new NotFoundException(`Unidad ${id} no existe.`);
    }

    return unidad;
  }
}
