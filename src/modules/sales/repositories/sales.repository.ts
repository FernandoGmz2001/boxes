import { Injectable } from '@nestjs/common';
import type {
  detalle_venta,
  Prisma,
  venta,
} from '../../../generated/prisma/client.js';
import { fromCentavos, toCentavos } from '../../../shared/money/money.js';
import type { IPageResult } from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { TipoMovimiento } from '../../movements/interfaces/movimiento.interface.js';
import { MAX_MONEY } from '../../products/dtos/create-product.dto.js';
import { ESTADO_TURNO_ABIERTO } from '../../shifts/interfaces/turno.interface.js';
import {
  InsufficientStockError,
  NoOpenShiftError,
  SaleProductsInactiveError,
  SaleProductsNotFoundError,
  SaleTotalExceededError,
} from '../errors/sale.errors.js';
import type {
  ICreateDetalleVenta,
  ICreateVenta,
  IListVentas,
  ISalesRepository,
} from '../interfaces/sales-repository.interface.js';
import type {
  IDetalleVenta,
  IProductoVendible,
  IStockFaltante,
  IVenta,
  IVentaDetalle,
  IVentaResumen,
} from '../interfaces/venta.interface.js';

const TIPO_SALIDA: TipoMovimiento = 'Salida';

type VentaResumenRecord = venta & {
  detalles: { cantidad: number }[];
};

type VentaDetalleRecord = venta & {
  usuario: { id: number; nombre: string };
  detalles: (detalle_venta & { producto: { nombre_producto: string } })[];
};

@Injectable()
export class SalesRepository implements ISalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: ICreateVenta): Promise<IVenta> {
    return this.prisma.client.$transaction(
      async (transaction: Prisma.TransactionClient): Promise<IVenta> => {
        const turnoId: number = await lockTurnoAbierto(
          transaction,
          input.usuario_id,
        );
        const productoIds: number[] = input.detalles.map(
          (detalle: ICreateDetalleVenta) => detalle.producto_id,
        );
        const productosById: Map<number, IProductoVendible> =
          await lockProductos(transaction, productoIds);

        assertSellable(input.detalles, productosById);

        const lineas: ILineaVenta[] = input.detalles.map(
          (detalle: ICreateDetalleVenta) =>
            toLineaVenta(
              detalle,
              readProducto(productosById, detalle.producto_id),
            ),
        );
        const totalCentavos: number = lineas.reduce(
          (sum: number, linea: ILineaVenta) => sum + linea.subtotalCentavos,
          0,
        );

        if (totalCentavos > toCentavos(MAX_MONEY)) {
          throw new SaleTotalExceededError(fromCentavos(totalCentavos));
        }

        const createdVenta: venta = await transaction.venta.create({
          data: {
            usuario_id: input.usuario_id,
            turno_id: turnoId,
            cliente_id: input.cliente_id,
            metodo_pago: input.metodo_pago,
            total: fromCentavos(totalCentavos),
          },
        });
        const motivo: string = `Venta Folio: ${createdVenta.folio}`;
        const createdDetalles: detalle_venta[] = [];

        for (const linea of lineas) {
          createdDetalles.push(
            await transaction.detalle_venta.create({
              data: {
                venta_id: createdVenta.id,
                producto_id: linea.producto.id,
                cantidad: linea.cantidad,
                precio_unitario: linea.producto.precio_venta,
                subtotal: fromCentavos(linea.subtotalCentavos),
              },
            }),
          );

          if (linea.producto.es_servicio) {
            continue;
          }

          const stockPrevio: number = linea.producto.cantidad_en_existencia;
          const stockNuevo: number = stockPrevio - linea.cantidad;

          await transaction.producto.update({
            where: { id: linea.producto.id },
            data: { cantidad_en_existencia: stockNuevo },
          });

          await transaction.movimiento.create({
            data: {
              producto_id: linea.producto.id,
              usuario_id: input.usuario_id,
              tipo_movimiento: TIPO_SALIDA,
              cantidad: linea.cantidad,
              stock_previo: stockPrevio,
              stock_nuevo: stockNuevo,
              motivo,
            },
          });
        }

        return toVenta(createdVenta, createdDetalles);
      },
    );
  }

  async findAll(filter: IListVentas): Promise<IPageResult<IVentaResumen>> {
    const where: Prisma.ventaWhereInput = {};

    if (filter.turno_id !== undefined) {
      where.turno_id = filter.turno_id;
    }
    if (filter.usuario_id !== undefined) {
      where.usuario_id = filter.usuario_id;
    }
    if (filter.folio !== undefined) {
      where.folio = { contains: filter.folio, mode: 'insensitive' };
    }
    if (filter.fecha_desde !== undefined || filter.fecha_hasta !== undefined) {
      where.created_at = { gte: filter.fecha_desde, lte: filter.fecha_hasta };
    }

    const skip: number = (filter.pagina - 1) * filter.limite;

    const [records, total]: [VentaResumenRecord[], number] = await Promise.all([
      this.prisma.client.venta.findMany({
        where,
        include: { detalles: { select: { cantidad: true } } },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip,
        take: filter.limite,
      }),
      this.prisma.client.venta.count({ where }),
    ]);

    return {
      items: records.map((record: VentaResumenRecord) => ({
        ...toVentaBase(record),
        articulos: record.detalles.reduce(
          (sum: number, detalle: { cantidad: number }) =>
            sum + detalle.cantidad,
          0,
        ),
      })),
      total,
    };
  }

  async findById(id: number): Promise<IVentaDetalle | null> {
    const record: VentaDetalleRecord | null =
      await this.prisma.client.venta.findUnique({
        where: { id },
        include: {
          usuario: { select: { id: true, nombre: true } },
          detalles: {
            include: { producto: { select: { nombre_producto: true } } },
            orderBy: { id: 'asc' },
          },
        },
      });

    if (!record) {
      return null;
    }

    return {
      ...toVentaBase(record),
      usuario: record.usuario,
      detalles: record.detalles.map((detalle) => ({
        ...toDetalleVenta(detalle),
        nombre_producto: detalle.producto.nombre_producto,
      })),
    };
  }
}

interface ILineaVenta {
  producto: IProductoVendible;
  cantidad: number;
  subtotalCentavos: number;
}

/**
 * FOR SHARE deja vender en paralelo dentro del mismo turno, pero espera a un cierre en curso
 * (que toma FOR UPDATE) y después ya no encuentra el turno como Abierto.
 */
async function lockTurnoAbierto(
  transaction: Prisma.TransactionClient,
  usuarioId: number,
): Promise<number> {
  const turnos: { id: number }[] = await transaction.$queryRaw<
    { id: number }[]
  >`
    SELECT id
    FROM turno_caja
    WHERE usuario_id = ${usuarioId} AND estado = ${ESTADO_TURNO_ABIERTO}
    FOR SHARE
  `;
  const turno: { id: number } | undefined = turnos[0];

  if (!turno) {
    throw new NoOpenShiftError(usuarioId);
  }

  return turno.id;
}

/**
 * Bloquea las filas hasta el commit o rollback para que otra venta no lea el
 * mismo stock_previo. El ORDER BY fija el orden de bloqueo y evita deadlocks
 * entre ventas concurrentes con productos en común.
 */
async function lockProductos(
  transaction: Prisma.TransactionClient,
  productoIds: number[],
): Promise<Map<number, IProductoVendible>> {
  const productos: IProductoVendible[] = await transaction.$queryRaw<
    IProductoVendible[]
  >`
    SELECT id, cantidad_en_existencia, activo, es_servicio, precio_venta::text AS precio_venta
    FROM producto
    WHERE id = ANY(${productoIds}::int[])
    ORDER BY id
    FOR UPDATE
  `;

  return new Map(
    productos.map((producto: IProductoVendible) => [producto.id, producto]),
  );
}

function assertSellable(
  detalles: ICreateDetalleVenta[],
  productosById: Map<number, IProductoVendible>,
): void {
  const missingIds: number[] = [];
  const inactiveIds: number[] = [];
  const faltantes: IStockFaltante[] = [];

  for (const detalle of detalles) {
    const producto: IProductoVendible | undefined = productosById.get(
      detalle.producto_id,
    );

    if (!producto) {
      missingIds.push(detalle.producto_id);
      continue;
    }

    if (!producto.activo) {
      inactiveIds.push(detalle.producto_id);
      continue;
    }

    if (
      !producto.es_servicio &&
      producto.cantidad_en_existencia < detalle.cantidad
    ) {
      faltantes.push({
        producto_id: detalle.producto_id,
        solicitado: detalle.cantidad,
        disponible: producto.cantidad_en_existencia,
      });
    }
  }

  if (missingIds.length > 0) {
    throw new SaleProductsNotFoundError(missingIds);
  }

  if (inactiveIds.length > 0) {
    throw new SaleProductsInactiveError(inactiveIds);
  }

  if (faltantes.length > 0) {
    throw new InsufficientStockError(faltantes);
  }
}

function readProducto(
  productosById: Map<number, IProductoVendible>,
  productoId: number,
): IProductoVendible {
  const producto: IProductoVendible | undefined = productosById.get(productoId);

  if (!producto) {
    throw new SaleProductsNotFoundError([productoId]);
  }

  return producto;
}

function toLineaVenta(
  detalle: ICreateDetalleVenta,
  producto: IProductoVendible,
): ILineaVenta {
  return {
    producto,
    cantidad: detalle.cantidad,
    subtotalCentavos: toCentavos(producto.precio_venta) * detalle.cantidad,
  };
}

function toVentaBase(record: venta): Omit<IVenta, 'detalles'> {
  return {
    id: record.id,
    folio: record.folio,
    usuario_id: record.usuario_id,
    turno_id: record.turno_id,
    cliente_id: record.cliente_id,
    metodo_pago: record.metodo_pago,
    total: record.total.toFixed(2),
    created_at: record.created_at.toISOString(),
  };
}

function toVenta(record: venta, detalles: detalle_venta[]): IVenta {
  return {
    ...toVentaBase(record),
    detalles: detalles.map((detalle: detalle_venta) => toDetalleVenta(detalle)),
  };
}

function toDetalleVenta(record: detalle_venta): IDetalleVenta {
  return {
    id: record.id,
    producto_id: record.producto_id,
    cantidad: record.cantidad,
    precio_unitario: record.precio_unitario.toFixed(2),
    subtotal: record.subtotal.toFixed(2),
  };
}
