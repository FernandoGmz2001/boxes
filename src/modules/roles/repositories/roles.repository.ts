import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { sortPermisos } from '../../auth/permissions.js';
import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { IRol } from '../interfaces/rol.interface.js';
import type {
  ICreateRol,
  IRolFilters,
  IRolesRepository,
  IUpdateRol,
} from '../interfaces/roles-repository.interface.js';

const rolSelect = {
  id: true,
  nombre: true,
  descripcion: true,
  es_sistema: true,
  permisos: { select: { permiso: true } },
  _count: { select: { usuarios: true } },
} satisfies Prisma.rolSelect;

type RolRecord = Prisma.rolGetPayload<{ select: typeof rolSelect }>;

@Injectable()
export class RolesRepository implements IRolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    pagination: IPagination,
    filters: IRolFilters,
  ): Promise<IPageResult<IRol>> {
    const skip: number = (pagination.pagina - 1) * pagination.limite;
    const where: Prisma.rolWhereInput = filters.busqueda
      ? { nombre: { contains: filters.busqueda, mode: 'insensitive' } }
      : {};

    const [records, total]: [RolRecord[], number] = await Promise.all([
      this.prisma.client.rol.findMany({
        where,
        select: rolSelect,
        orderBy: { id: 'asc' },
        skip,
        take: pagination.limite,
      }),
      this.prisma.client.rol.count({ where }),
    ]);

    return { items: records.map((record: RolRecord) => toRol(record)), total };
  }

  async findById(id: number): Promise<IRol | null> {
    const record: RolRecord | null = await this.prisma.client.rol.findUnique({
      where: { id },
      select: rolSelect,
    });

    return record ? toRol(record) : null;
  }

  async findByNombre(nombre: string): Promise<IRol | null> {
    const record: RolRecord | null = await this.prisma.client.rol.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
      select: rolSelect,
    });

    return record ? toRol(record) : null;
  }

  async create(input: ICreateRol): Promise<IRol> {
    const created: RolRecord = await this.prisma.client.rol.create({
      data: {
        nombre: input.nombre,
        descripcion: input.descripcion,
        permisos: {
          create: input.permisos.map((permiso) => ({ permiso })),
        },
      },
      select: rolSelect,
    });

    return toRol(created);
  }

  async update(id: number, input: IUpdateRol): Promise<IRol> {
    const data: Prisma.rolUpdateInput = {};

    if (input.nombre !== undefined) {
      data.nombre = input.nombre;
    }
    if (input.descripcion !== undefined) {
      data.descripcion = input.descripcion;
    }
    if (input.permisos !== undefined) {
      data.permisos = {
        deleteMany: {},
        create: input.permisos.map((permiso) => ({ permiso })),
      };
    }

    const updated: RolRecord = await this.prisma.client.rol.update({
      where: { id },
      data,
      select: rolSelect,
    });

    return toRol(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.client.rol.delete({ where: { id } });
  }
}

function toRol(record: RolRecord): IRol {
  return {
    id: record.id,
    nombre: record.nombre,
    descripcion: record.descripcion,
    permisos: sortPermisos(
      record.permisos.map(({ permiso }: { permiso: string }) => permiso),
    ),
    es_sistema: record.es_sistema,
    total_usuarios: record._count.usuarios,
  };
}
