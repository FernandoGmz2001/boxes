import { Injectable } from '@nestjs/common';
import type { unidad } from '../../../generated/prisma/client.js';
import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { IUnidad } from '../interfaces/unidad.interface.js';
import type { IUnitsRepository } from '../interfaces/units-repository.interface.js';

@Injectable()
export class UnitsRepository implements IUnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: IPagination): Promise<IPageResult<IUnidad>> {
    const skip: number = (pagination.pagina - 1) * pagination.limite;

    const [records, total]: [unidad[], number] = await Promise.all([
      this.prisma.client.unidad.findMany({
        orderBy: { id: 'asc' },
        skip,
        take: pagination.limite,
      }),
      this.prisma.client.unidad.count(),
    ]);

    return {
      items: records.map((record: unidad) => toUnidad(record)),
      total,
    };
  }

  async findById(id: number): Promise<IUnidad | null> {
    const record: unidad | null = await this.prisma.client.unidad.findUnique({
      where: { id },
    });

    return record ? toUnidad(record) : null;
  }
}

function toUnidad(record: unidad): IUnidad {
  return {
    id: record.id,
    nombre: record.nombre,
    simbolo: record.simbolo,
  };
}
