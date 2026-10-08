import { Injectable } from '@nestjs/common';
import type { producto_impuesto } from '../../../generated/prisma/client.js';
import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type {
  ICreateProductoImpuesto,
  IProductTaxesRepository,
  IUpdateProductoImpuesto,
} from '../interfaces/product-taxes-repository.interface.js';
import type { IProductoImpuesto } from '../interfaces/producto-impuesto.interface.js';

@Injectable()
export class ProductTaxesRepository implements IProductTaxesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async productExists(productoId: number): Promise<boolean> {
    const producto: { id: number } | null =
      await this.prisma.client.producto.findUnique({
        where: { id: productoId },
        select: { id: true },
      });

    return producto !== null;
  }

  async findAll(
    productoId: number,
    pagination: IPagination,
  ): Promise<IPageResult<IProductoImpuesto>> {
    const where = { producto_id: productoId };
    const skip: number = (pagination.pagina - 1) * pagination.limite;

    const [records, total]: [producto_impuesto[], number] = await Promise.all([
      this.prisma.client.producto_impuesto.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take: pagination.limite,
      }),
      this.prisma.client.producto_impuesto.count({ where }),
    ]);

    return {
      items: records.map((record: producto_impuesto) => toProductoImpuesto(record)),
      total,
    };
  }

  async findById(
    productoId: number,
    id: number,
  ): Promise<IProductoImpuesto | null> {
    const record: producto_impuesto | null =
      await this.prisma.client.producto_impuesto.findFirst({
        where: { id, producto_id: productoId },
      });

    return record ? toProductoImpuesto(record) : null;
  }

  async findByPreset(
    productoId: number,
    impuestoPresetId: number,
  ): Promise<IProductoImpuesto | null> {
    const record: producto_impuesto | null =
      await this.prisma.client.producto_impuesto.findFirst({
        where: {
          producto_id: productoId,
          impuesto_preset_id: impuestoPresetId,
        },
      });

    return record ? toProductoImpuesto(record) : null;
  }

  async create(input: ICreateProductoImpuesto): Promise<IProductoImpuesto> {
    const created: producto_impuesto =
      await this.prisma.client.producto_impuesto.create({
        data: {
          producto_id: input.producto_id,
          impuesto_preset_id: input.impuesto_preset_id,
        },
      });

    return toProductoImpuesto(created);
  }

  async update(
    id: number,
    input: IUpdateProductoImpuesto,
  ): Promise<IProductoImpuesto> {
    const updated: producto_impuesto =
      await this.prisma.client.producto_impuesto.update({
        where: { id },
        data: { impuesto_preset_id: input.impuesto_preset_id },
      });

    return toProductoImpuesto(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.client.producto_impuesto.delete({ where: { id } });
  }
}

function toProductoImpuesto(record: producto_impuesto): IProductoImpuesto {
  return {
    id: record.id,
    producto_id: record.producto_id,
    impuesto_preset_id: record.impuesto_preset_id,
  };
}
