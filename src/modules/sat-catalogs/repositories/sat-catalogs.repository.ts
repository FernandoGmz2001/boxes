import { Injectable } from '@nestjs/common';
import type {
  clave_prod_serv,
  clave_unidad,
  objeto_imp,
  Prisma,
} from '../../../generated/prisma/client.js';
import type { IPageResult } from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type {
  IClaveProdServ,
  IClaveUnidad,
  IObjetoImp,
} from '../interfaces/sat-catalog.interface.js';
import type {
  IListSatCatalog,
  ISatCatalogsRepository,
} from '../interfaces/sat-catalogs-repository.interface.js';

@Injectable()
export class SatCatalogsRepository implements ISatCatalogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllClavesProdServ(
    filter: IListSatCatalog,
  ): Promise<IPageResult<IClaveProdServ>> {
    const where: Prisma.clave_prod_servWhereInput | undefined = filter.busqueda
      ? {
          OR: [
            { clave: { contains: filter.busqueda, mode: 'insensitive' } },
            {
              descripcion: { contains: filter.busqueda, mode: 'insensitive' },
            },
          ],
        }
      : undefined;

    const skip: number = (filter.pagina - 1) * filter.limite;
    const [records, total]: [clave_prod_serv[], number] = await Promise.all([
      this.prisma.client.clave_prod_serv.findMany({
        where,
        orderBy: { clave: 'asc' },
        skip,
        take: filter.limite,
      }),
      this.prisma.client.clave_prod_serv.count({ where }),
    ]);

    return {
      items: records.map((record: clave_prod_serv) => toClaveProdServ(record)),
      total,
    };
  }

  async findClaveProdServ(clave: string): Promise<IClaveProdServ | null> {
    const record: clave_prod_serv | null =
      await this.prisma.client.clave_prod_serv.findUnique({
        where: { clave },
      });

    return record ? toClaveProdServ(record) : null;
  }

  async findAllClavesUnidad(
    filter: IListSatCatalog,
  ): Promise<IPageResult<IClaveUnidad>> {
    const where: Prisma.clave_unidadWhereInput | undefined = filter.busqueda
      ? {
          OR: [
            { clave: { contains: filter.busqueda, mode: 'insensitive' } },
            { nombre: { contains: filter.busqueda, mode: 'insensitive' } },
            {
              descripcion: { contains: filter.busqueda, mode: 'insensitive' },
            },
          ],
        }
      : undefined;

    const skip: number = (filter.pagina - 1) * filter.limite;
    const [records, total]: [clave_unidad[], number] = await Promise.all([
      this.prisma.client.clave_unidad.findMany({
        where,
        orderBy: { clave: 'asc' },
        skip,
        take: filter.limite,
      }),
      this.prisma.client.clave_unidad.count({ where }),
    ]);

    return {
      items: records.map((record: clave_unidad) => toClaveUnidad(record)),
      total,
    };
  }

  async findClaveUnidad(clave: string): Promise<IClaveUnidad | null> {
    const record: clave_unidad | null =
      await this.prisma.client.clave_unidad.findUnique({
        where: { clave },
      });

    return record ? toClaveUnidad(record) : null;
  }

  async findAllObjetosImp(
    filter: IListSatCatalog,
  ): Promise<IPageResult<IObjetoImp>> {
    const where: Prisma.objeto_impWhereInput | undefined = filter.busqueda
      ? {
          OR: [
            { clave: { contains: filter.busqueda, mode: 'insensitive' } },
            {
              descripcion: { contains: filter.busqueda, mode: 'insensitive' },
            },
          ],
        }
      : undefined;

    const skip: number = (filter.pagina - 1) * filter.limite;
    const [records, total]: [objeto_imp[], number] = await Promise.all([
      this.prisma.client.objeto_imp.findMany({
        where,
        orderBy: { clave: 'asc' },
        skip,
        take: filter.limite,
      }),
      this.prisma.client.objeto_imp.count({ where }),
    ]);

    return {
      items: records.map((record: objeto_imp) => toObjetoImp(record)),
      total,
    };
  }

  async findObjetoImp(clave: string): Promise<IObjetoImp | null> {
    const record: objeto_imp | null =
      await this.prisma.client.objeto_imp.findUnique({
        where: { clave },
      });

    return record ? toObjetoImp(record) : null;
  }
}

function toClaveProdServ(record: clave_prod_serv): IClaveProdServ {
  return {
    clave: record.clave,
    descripcion: record.descripcion,
    incluir_iva_trasladado: record.incluir_iva_trasladado,
    incluir_ieps_trasladado: record.incluir_ieps_trasladado,
    fecha_inicio_vigencia: toDateOnly(record.fecha_inicio_vigencia),
    fecha_fin_vigencia: record.fecha_fin_vigencia
      ? toDateOnly(record.fecha_fin_vigencia)
      : null,
  };
}

function toClaveUnidad(record: clave_unidad): IClaveUnidad {
  return {
    clave: record.clave,
    nombre: record.nombre,
    descripcion: record.descripcion,
    simbolo: record.simbolo,
    fecha_inicio_vigencia: toDateOnly(record.fecha_inicio_vigencia),
    fecha_fin_vigencia: record.fecha_fin_vigencia
      ? toDateOnly(record.fecha_fin_vigencia)
      : null,
  };
}

function toObjetoImp(record: objeto_imp): IObjetoImp {
  return {
    clave: record.clave,
    descripcion: record.descripcion,
    fecha_inicio_vigencia: toDateOnly(record.fecha_inicio_vigencia),
    fecha_fin_vigencia: record.fecha_fin_vigencia
      ? toDateOnly(record.fecha_fin_vigencia)
      : null,
  };
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
