import { Injectable } from '@nestjs/common';
import type { impuesto_preset } from '../../../generated/prisma/client.js';
import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { IImpuesto } from '../interfaces/impuesto.interface.js';
import type { ITaxesRepository } from '../interfaces/taxes-repository.interface.js';

@Injectable()
export class TaxesRepository implements ITaxesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: IPagination): Promise<IPageResult<IImpuesto>> {
    const skip: number = (pagination.pagina - 1) * pagination.limite;

    const [records, total]: [impuesto_preset[], number] = await Promise.all([
      this.prisma.client.impuesto_preset.findMany({
        orderBy: { id: 'asc' },
        skip,
        take: pagination.limite,
      }),
      this.prisma.client.impuesto_preset.count(),
    ]);

    return {
      items: records.map((record: impuesto_preset) => toImpuesto(record)),
      total,
    };
  }

  async findById(id: number): Promise<IImpuesto | null> {
    const record: impuesto_preset | null =
      await this.prisma.client.impuesto_preset.findUnique({
        where: { id },
      });

    return record ? toImpuesto(record) : null;
  }
}

function toImpuesto(record: impuesto_preset): IImpuesto {
  return {
    id: record.id,
    clave_impuesto: record.clave_impuesto,
    impuesto: record.impuesto,
    factor: record.factor,
    rango_o_fijo: record.rango_o_fijo,
    valor_minimo: record.valor_minimo?.toFixed(6) ?? null,
    valor_maximo: record.valor_maximo.toFixed(6),
    traslado: record.traslado,
    retencion: record.retencion,
    fecha_inicio_vigencia: toDateOnly(record.fecha_inicio_vigencia),
    fecha_fin_vigencia: record.fecha_fin_vigencia
      ? toDateOnly(record.fecha_fin_vigencia)
      : null,
  };
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
