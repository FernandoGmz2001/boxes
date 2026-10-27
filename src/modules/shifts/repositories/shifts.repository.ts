import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type movimiento_caja,
  type turno_caja,
} from '../../../generated/prisma/client.js';
import { fromCentavos, toCentavos } from '../../../shared/money/money.js';
import type { IPageResult } from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { buildCorte } from '../corte.js';
import {
  InsufficientCashError,
  ShiftAlreadyOpenError,
  ShiftNotFoundError,
  ShiftNotOpenError,
} from '../errors/shift.errors.js';
import type {
  IAbrirTurno,
  ICerrarTurno,
  ICreateMovimientoCaja,
  IListTurnos,
  IShiftsRepository,
} from '../interfaces/shifts-repository.interface.js';
import {
  ESTADO_TURNO_ABIERTO,
  ESTADO_TURNO_CERRADO,
  type ICajaRef,
  type ICierreTurno,
  type ICorteTurno,
  type IMovimientoCaja,
  type ITotalesTurno,
  type ITurno,
  type ITurnoDetalle,
  type ITurnoResumen,
  type TipoMovimientoCaja,
} from '../interfaces/turno.interface.js';

const TIPO_RETIRO: TipoMovimientoCaja = 'Retiro';
const UNIQUE_VIOLATION: string = 'P2002';

type TurnoResumenRecord = turno_caja & {
  usuario: { id: number; nombre: string };
  caja: { id: number; nombre: string };
};

type TurnoDetalleRecord = turno_caja & {
  usuario: { id: number; nombre: string };
  caja: { id: number; nombre: string };
  movimientos: movimiento_caja[];
};

@Injectable()
export class ShiftsRepository implements IShiftsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: IListTurnos): Promise<IPageResult<ITurnoResumen>> {
    const where: Prisma.turno_cajaWhereInput = {};

    if (filter.caja_id !== undefined) {
      where.caja_id = filter.caja_id;
    }
    if (filter.usuario_id !== undefined) {
      where.usuario_id = filter.usuario_id;
    }
    if (filter.estado !== undefined) {
      where.estado = filter.estado;
    }
    if (filter.fecha_desde !== undefined || filter.fecha_hasta !== undefined) {
      where.abierto_at = { gte: filter.fecha_desde, lte: filter.fecha_hasta };
    }

    const skip: number = (filter.pagina - 1) * filter.limite;

    const [records, total]: [TurnoResumenRecord[], number] = await Promise.all([
      this.prisma.client.turno_caja.findMany({
        where,
        include: {
          usuario: { select: { id: true, nombre: true } },
          caja: { select: { id: true, nombre: true } },
        },
        orderBy: [{ abierto_at: 'desc' }, { id: 'desc' }],
        skip,
        take: filter.limite,
      }),
      this.prisma.client.turno_caja.count({ where }),
    ]);

    return {
      items: records.map((record: TurnoResumenRecord): ITurnoResumen => ({
        ...toTurno(record),
        usuario: record.usuario,
        caja: record.caja,
      })),
      total,
    };
  }

  async findById(id: number): Promise<ITurno | null> {
    const record: turno_caja | null =
      await this.prisma.client.turno_caja.findUnique({ where: { id } });

    return record ? toTurno(record) : null;
  }

  async findDetalleById(id: number): Promise<ITurnoDetalle | null> {
    const record: TurnoDetalleRecord | null =
      await this.prisma.client.turno_caja.findUnique({
        where: { id },
        include: {
          usuario: { select: { id: true, nombre: true } },
          caja: { select: { id: true, nombre: true } },
          movimientos: { orderBy: [{ created_at: 'asc' }, { id: 'asc' }] },
        },
      });

    if (!record) {
      return null;
    }

    return {
      ...toTurno(record),
      usuario: record.usuario,
      caja: record.caja,
      movimientos: record.movimientos.map((movimiento: movimiento_caja) =>
        toMovimientoCaja(movimiento),
      ),
    };
  }

  async findAbiertoByUsuario(usuarioId: number): Promise<ITurno | null> {
    const record: turno_caja | null =
      await this.prisma.client.turno_caja.findFirst({
        where: { usuario_id: usuarioId, estado: ESTADO_TURNO_ABIERTO },
      });

    return record ? toTurno(record) : null;
  }

  async findCaja(id: number): Promise<ICajaRef | null> {
    return this.prisma.client.caja.findUnique({
      where: { id },
      select: { id: true, activa: true },
    });
  }

  async findTotales(turnoId: number): Promise<ITotalesTurno> {
    return readTotales(this.prisma.client, turnoId);
  }

  async open(input: IAbrirTurno): Promise<ITurno> {
    try {
      const created: turno_caja = await this.prisma.client.turno_caja.create({
        data: {
          caja_id: input.caja_id,
          usuario_id: input.usuario_id,
          fondo_inicial: input.fondo_inicial,
        },
      });

      return toTurno(created);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new ShiftAlreadyOpenError();
      }

      throw error;
    }
  }

  async createMovimiento(
    input: ICreateMovimientoCaja,
  ): Promise<IMovimientoCaja> {
    return this.prisma.client.$transaction(
      async (
        transaction: Prisma.TransactionClient,
      ): Promise<IMovimientoCaja> => {
        await lockTurnoAbierto(transaction, input.turno_id);

        if (input.tipo === TIPO_RETIRO) {
          const corte: ICorteTurno = buildCorte(
            input.turno_id,
            await readTotales(transaction, input.turno_id),
          );

          if (toCentavos(corte.efectivo_esperado) < toCentavos(input.monto)) {
            throw new InsufficientCashError(
              corte.efectivo_esperado,
              input.monto,
            );
          }
        }

        const created: movimiento_caja =
          await transaction.movimiento_caja.create({
            data: {
              turno_id: input.turno_id,
              usuario_id: input.usuario_id,
              tipo: input.tipo,
              monto: input.monto,
              motivo: input.motivo,
            },
          });

        return toMovimientoCaja(created);
      },
    );
  }

  async close(input: ICerrarTurno): Promise<ICierreTurno> {
    return this.prisma.client.$transaction(
      async (transaction: Prisma.TransactionClient): Promise<ICierreTurno> => {
        await lockTurnoAbierto(transaction, input.turno_id);

        const corte: ICorteTurno = buildCorte(
          input.turno_id,
          await readTotales(transaction, input.turno_id),
        );
        const diferencia: string = fromCentavos(
          toCentavos(input.efectivo_contado) -
            toCentavos(corte.efectivo_esperado),
        );

        const updated: turno_caja = await transaction.turno_caja.update({
          where: { id: input.turno_id },
          data: {
            estado: ESTADO_TURNO_CERRADO,
            efectivo_esperado: corte.efectivo_esperado,
            efectivo_contado: input.efectivo_contado,
            diferencia,
            notas: input.notas,
            cerrado_at: new Date(),
          },
        });

        return { turno: toTurno(updated), corte };
      },
    );
  }
}

/**
 * FOR UPDATE espera a que terminen las ventas en curso del turno (que lo leen con FOR SHARE),
 * así el corte y los retiros ven todas las ventas confirmadas y ninguna entra después del cierre.
 */
async function lockTurnoAbierto(
  transaction: Prisma.TransactionClient,
  turnoId: number,
): Promise<void> {
  const turnos: { estado: string }[] = await transaction.$queryRaw<
    { estado: string }[]
  >`
    SELECT estado FROM turno_caja WHERE id = ${turnoId} FOR UPDATE
  `;
  const turno: { estado: string } | undefined = turnos[0];

  if (!turno) {
    throw new ShiftNotFoundError(turnoId);
  }

  if (turno.estado !== ESTADO_TURNO_ABIERTO) {
    throw new ShiftNotOpenError(turnoId);
  }
}

async function readTotales(
  client: Prisma.TransactionClient,
  turnoId: number,
): Promise<ITotalesTurno> {
  const turno: { fondo_inicial: Prisma.Decimal } | null =
    await client.turno_caja.findUnique({
      where: { id: turnoId },
      select: { fondo_inicial: true },
    });

  if (!turno) {
    throw new ShiftNotFoundError(turnoId);
  }

  const ventas = await client.venta.groupBy({
    by: ['metodo_pago'],
    where: { turno_id: turnoId },
    _count: { _all: true },
    _sum: { total: true },
  });
  const movimientos = await client.movimiento_caja.groupBy({
    by: ['tipo'],
    where: { turno_id: turnoId },
    _sum: { monto: true },
  });
  const sumaPorTipo = (tipo: TipoMovimientoCaja): string =>
    (
      movimientos.find((movimiento) => movimiento.tipo === tipo)?._sum.monto ??
      new Prisma.Decimal(0)
    ).toFixed(2);

  return {
    fondo_inicial: turno.fondo_inicial.toFixed(2),
    ventas: ventas.map((venta) => ({
      metodo_pago: venta.metodo_pago,
      cantidad: venta._count._all,
      importe: (venta._sum.total ?? new Prisma.Decimal(0)).toFixed(2),
    })),
    entradas: sumaPorTipo('Entrada'),
    retiros: sumaPorTipo('Retiro'),
  };
}

function toTurno(record: turno_caja): ITurno {
  return {
    id: record.id,
    caja_id: record.caja_id,
    usuario_id: record.usuario_id,
    estado: record.estado,
    fondo_inicial: record.fondo_inicial.toFixed(2),
    efectivo_esperado: record.efectivo_esperado?.toFixed(2) ?? null,
    efectivo_contado: record.efectivo_contado?.toFixed(2) ?? null,
    diferencia: record.diferencia?.toFixed(2) ?? null,
    notas: record.notas,
    abierto_at: record.abierto_at.toISOString(),
    cerrado_at: record.cerrado_at?.toISOString() ?? null,
  };
}

function toMovimientoCaja(record: movimiento_caja): IMovimientoCaja {
  return {
    id: record.id,
    turno_id: record.turno_id,
    usuario_id: record.usuario_id,
    tipo: record.tipo,
    monto: record.monto.toFixed(2),
    motivo: record.motivo,
    created_at: record.created_at.toISOString(),
  };
}
