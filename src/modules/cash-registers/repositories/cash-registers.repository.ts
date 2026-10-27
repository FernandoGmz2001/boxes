import { Injectable } from '@nestjs/common';
import type { caja, Prisma } from '../../../generated/prisma/client.js';
import type { IPageResult } from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { ICaja } from '../interfaces/caja.interface.js';
import type {
  ICashRegistersRepository,
  ICreateCaja,
  IListCajas,
  IUpdateCaja,
} from '../interfaces/cash-registers-repository.interface.js';
import { ESTADO_TURNO_ABIERTO } from '../../shifts/interfaces/turno.interface.js';

@Injectable()
export class CashRegistersRepository implements ICashRegistersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: IListCajas): Promise<IPageResult<ICaja>> {
    const where: Prisma.cajaWhereInput = {};

    if (filter.activa !== undefined) {
      where.activa = filter.activa;
    }

    const skip: number = (filter.pagina - 1) * filter.limite;

    const [records, total]: [caja[], number] = await Promise.all([
      this.prisma.client.caja.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take: filter.limite,
      }),
      this.prisma.client.caja.count({ where }),
    ]);

    return {
      items: records.map((record: caja) => toCaja(record)),
      total,
    };
  }

  async findById(id: number): Promise<ICaja | null> {
    const record: caja | null = await this.prisma.client.caja.findUnique({
      where: { id },
    });

    return record ? toCaja(record) : null;
  }

  async findByNombre(nombre: string): Promise<ICaja | null> {
    const record: caja | null = await this.prisma.client.caja.findUnique({
      where: { nombre },
    });

    return record ? toCaja(record) : null;
  }

  async create(input: ICreateCaja): Promise<ICaja> {
    const created: caja = await this.prisma.client.caja.create({
      data: { nombre: input.nombre, activa: input.activa },
    });

    return toCaja(created);
  }

  async update(id: number, input: IUpdateCaja): Promise<ICaja> {
    const data: Prisma.cajaUpdateInput = {};

    if (input.nombre !== undefined) {
      data.nombre = input.nombre;
    }
    if (input.activa !== undefined) {
      data.activa = input.activa;
    }

    const updated: caja = await this.prisma.client.caja.update({
      where: { id },
      data,
    });

    return toCaja(updated);
  }

  async hasTurnoAbierto(id: number): Promise<boolean> {
    const abiertos: number = await this.prisma.client.turno_caja.count({
      where: { caja_id: id, estado: ESTADO_TURNO_ABIERTO },
    });

    return abiertos > 0;
  }
}

function toCaja(record: caja): ICaja {
  return {
    id: record.id,
    nombre: record.nombre,
    activa: record.activa,
  };
}
