import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import type {
  IPageResult,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { IUsuario } from '../interfaces/usuario.interface.js';
import type {
  ICreateUsuario,
  IUpdateUsuario,
  IUsersRepository,
  IUsuarioFilters,
} from '../interfaces/users-repository.interface.js';

const usuarioSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: { select: { id: true, nombre: true } },
  activo: true,
} satisfies Prisma.usuarioSelect;

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    pagination: IPagination,
    filters: IUsuarioFilters,
  ): Promise<IPageResult<IUsuario>> {
    const skip: number = (pagination.pagina - 1) * pagination.limite;
    const where: Prisma.usuarioWhereInput = toWhere(filters);

    const [records, total]: [IUsuario[], number] = await Promise.all([
      this.prisma.client.usuario.findMany({
        where,
        select: usuarioSelect,
        orderBy: { id: 'asc' },
        skip,
        take: pagination.limite,
      }),
      this.prisma.client.usuario.count({ where }),
    ]);

    return { items: records, total };
  }

  async findById(id: number): Promise<IUsuario | null> {
    return this.prisma.client.usuario.findUnique({
      where: { id },
      select: usuarioSelect,
    });
  }

  async findByEmail(email: string): Promise<IUsuario | null> {
    return this.prisma.client.usuario.findUnique({
      where: { email },
      select: usuarioSelect,
    });
  }

  async rolExists(rolId: number): Promise<boolean> {
    const rol: { id: number } | null = await this.prisma.client.rol.findUnique({
      where: { id: rolId },
      select: { id: true },
    });

    return rol !== null;
  }

  async create(input: ICreateUsuario): Promise<IUsuario> {
    return this.prisma.client.usuario.create({
      data: {
        nombre: input.nombre,
        email: input.email,
        password: input.password,
        rol: { connect: { id: input.rol_id } },
      },
      select: usuarioSelect,
    });
  }

  async update(id: number, input: IUpdateUsuario): Promise<IUsuario | null> {
    const existing: { id: number } | null =
      await this.prisma.client.usuario.findUnique({
        where: { id },
        select: { id: true },
      });

    if (!existing) {
      return null;
    }

    const data: Prisma.usuarioUpdateInput = {};

    if (input.nombre !== undefined) {
      data.nombre = input.nombre;
    }
    if (input.email !== undefined) {
      data.email = input.email;
    }
    if (input.password !== undefined) {
      data.password = input.password;
    }
    if (input.rol_id !== undefined) {
      data.rol = { connect: { id: input.rol_id } };
    }
    if (input.activo !== undefined) {
      data.activo = input.activo;
    }

    return this.prisma.client.usuario.update({
      where: { id },
      data,
      select: usuarioSelect,
    });
  }
}

function toWhere(filters: IUsuarioFilters): Prisma.usuarioWhereInput {
  const where: Prisma.usuarioWhereInput = {};

  if (filters.busqueda) {
    where.OR = [
      { nombre: { contains: filters.busqueda, mode: 'insensitive' } },
      { email: { contains: filters.busqueda, mode: 'insensitive' } },
    ];
  }
  if (filters.activo !== undefined) {
    where.activo = filters.activo;
  }

  return where;
}
