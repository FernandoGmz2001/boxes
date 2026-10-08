import { Injectable } from '@nestjs/common';
import type { Prisma, usuario } from '../../../generated/prisma/client.js';
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
} from '../interfaces/users-repository.interface.js';

const usuarioSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
} as const;

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: IPagination): Promise<IPageResult<IUsuario>> {
    const skip: number = (pagination.pagina - 1) * pagination.limite;

    const [records, total]: [IUsuario[], number] = await Promise.all([
      this.prisma.client.usuario.findMany({
        select: usuarioSelect,
        orderBy: { id: 'asc' },
        skip,
        take: pagination.limite,
      }),
      this.prisma.client.usuario.count(),
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

  async create(input: ICreateUsuario): Promise<IUsuario> {
    return this.prisma.client.usuario.create({
      data: {
        nombre: input.nombre,
        email: input.email,
        password: input.password,
        rol: input.rol,
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
    if (input.rol !== undefined) {
      data.rol = input.rol;
    }
    if (input.activo !== undefined) {
      data.activo = input.activo;
    }

    const updated: usuario = await this.prisma.client.usuario.update({
      where: { id },
      data,
    });

    return toUsuario(updated);
  }
}

function toUsuario(record: usuario): IUsuario {
  return {
    id: record.id,
    nombre: record.nombre,
    email: record.email,
    rol: record.rol,
    activo: record.activo,
  };
}
