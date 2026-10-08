import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  IPage,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import {
  resolvePagination,
  toPage,
} from '../../../shared/pagination/paginated.interface.js';
import type { ListTaxesQueryDto } from '../dtos/list-taxes-query.dto.js';
import type { IImpuesto } from '../interfaces/impuesto.interface.js';
import {
  TAXES_REPOSITORY,
  type ITaxesRepository,
} from '../interfaces/taxes-repository.interface.js';

@Injectable()
export class TaxesService {
  constructor(
    @Inject(TAXES_REPOSITORY)
    private readonly taxesRepository: ITaxesRepository,
  ) {}

  async findAllTaxes(query: ListTaxesQueryDto): Promise<IPage<IImpuesto>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(await this.taxesRepository.findAll(pagination), pagination);
  }

  async findTaxById(id: number): Promise<IImpuesto> {
    const impuesto: IImpuesto | null = await this.taxesRepository.findById(id);

    if (!impuesto) {
      throw new NotFoundException(`Impuesto ${id} no existe.`);
    }

    return impuesto;
  }
}
