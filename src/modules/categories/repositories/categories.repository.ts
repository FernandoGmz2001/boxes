import { Injectable } from '@nestjs/common';
import { Prisma, type categoria } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { ICategoria } from '../interfaces/categoria.interface.js';
import type {
  ICategoriesRepository,
  ICreateCategoria,
  IUpdateCategoria,
} from '../interfaces/categories-repository.interface.js';

@Injectable()
export class CategoriesRepository implements ICategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: IPagination): Promise<IPageResult<ICategoria>> {
    const skip: number = (pagination.pagina - 1) * pagination.limite;

    const [records, total]: [categoria[], number] = await Promise.all([
      this.prisma.client.categoria.findMany({
        orderBy: { id: 'asc' },
        skip,
        take: pagination.limite,
      }),
      this.prisma.client.categoria.count(),
    ]);

    return {
      items: records.map((record: categoria) => toCategoria(record)),
      total,
    };
  }

  async findById(id: number): Promise<ICategoria | null> {
    const record: categoria | null =
      await this.prisma.client.categoria.findUnique({
        where: { id },
      });

    return record ? toCategoria(record) : null;
  }

  async create(input: ICreateCategoria): Promise<ICategoria> {
    const created: categoria = await this.prisma.client.categoria.create({
      data: {
        nombre: input.nombre,
        color_ui: input.color_ui,
      },
    });

    return toCategoria(created);
  }

  async update(
    id: number,
    input: IUpdateCategoria,
  ): Promise<ICategoria | null> {
    const existing: { id: number } | null =
      await this.prisma.client.categoria.findUnique({
        where: { id },
        select: { id: true },
      });

    if (!existing) {
      return null;
    }

    const data: Prisma.categoriaUpdateInput = {};

    if (input.nombre !== undefined) {
      data.nombre = input.nombre;
    }
    if (input.color_ui !== undefined) {
      data.color_ui = input.color_ui;
    }

    const updated: categoria = await this.prisma.client.categoria.update({
      where: { id },
      data,
    });

    return toCategoria(updated);
  }

  async countProductos(id: number): Promise<number> {
    return this.prisma.client.producto.count({
      where: { id_categoria: id },
    });
  }

  async delete(id: number): Promise<boolean> {
    const existing: { id: number } | null =
      await this.prisma.client.categoria.findUnique({
        where: { id },
        select: { id: true },
      });

    if (!existing) {
      return false;
    }

    await this.prisma.client.categoria.delete({ where: { id } });
    return true;
  }
}

function toCategoria(record: categoria): ICategoria {
  return {
    id: record.id,
    nombre: record.nombre,
    color_ui: record.color_ui,
  };
}
