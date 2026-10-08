import { Injectable } from '@nestjs/common';
import type { movimiento, Prisma } from '../../../generated/prisma/client.js';
import type { IPageResult } from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type {
  IMovimiento,
  IProductoStock,
  IUsuarioRef,
} from '../interfaces/movimiento.interface.js';
import type {
  ICreateMovimiento,
  IListMovimientos,
  IMovementsRepository,
} from '../interfaces/movements-repository.interface.js';

@Injectable()
export class MovementsRepository implements IMovementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: IListMovimientos): Promise<IPageResult<IMovimiento>> {
    const where: Prisma.movimientoWhereInput = {};

    if (filter.producto_id !== undefined) {
      where.producto_id = filter.producto_id;
    }
    if (filter.usuario_id !== undefined) {
      where.usuario_id = filter.usuario_id;
    }

    const skip: number = (filter.pagina - 1) * filter.limite;

    const [records, total]: [movimiento[], number] = await Promise.all([
      this.prisma.client.movimiento.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip,
        take: filter.limite,
      }),
      this.prisma.client.movimiento.count({ where }),
    ]);

    return {
      items: records.map((record: movimiento) => toMovimiento(record)),
      total,
    };
  }

  async findById(id: number): Promise<IMovimiento | null> {
    const record: movimiento | null =
      await this.prisma.client.movimiento.findUnique({
        where: { id },
      });

    return record ? toMovimiento(record) : null;
  }

  async findProductoStock(productoId: number): Promise<IProductoStock | null> {
    return this.prisma.client.producto.findUnique({
      where: { id: productoId },
      select: { id: true, cantidad_en_existencia: true, activo: true },
    });
  }

  async findUsuario(usuarioId: number): Promise<IUsuarioRef | null> {
    return this.prisma.client.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, activo: true },
    });
  }

  async create(input: ICreateMovimiento): Promise<IMovimiento | null> {
    const created: movimiento | null = await this.prisma.client.$transaction(
      async (transaction): Promise<movimiento | null> => {
        const updated: { count: number } =
          await transaction.producto.updateMany({
            where: {
              id: input.producto_id,
              cantidad_en_existencia: input.stock_previo,
            },
            data: { cantidad_en_existencia: input.stock_nuevo },
          });

        if (updated.count === 0) {
          return null;
        }

        return transaction.movimiento.create({
          data: {
            producto_id: input.producto_id,
            usuario_id: input.usuario_id,
            tipo_movimiento: input.tipo_movimiento,
            cantidad: input.cantidad,
            stock_previo: input.stock_previo,
            stock_nuevo: input.stock_nuevo,
            motivo: input.motivo,
          },
        });
      },
    );

    return created ? toMovimiento(created) : null;
  }
}

function toMovimiento(record: movimiento): IMovimiento {
  return {
    id: record.id,
    producto_id: record.producto_id,
    tipo_movimiento: record.tipo_movimiento,
    cantidad: record.cantidad,
    stock_previo: record.stock_previo,
    stock_nuevo: record.stock_nuevo,
    motivo: record.motivo,
    usuario_id: record.usuario_id,
    created_at: record.created_at.toISOString(),
  };
}
