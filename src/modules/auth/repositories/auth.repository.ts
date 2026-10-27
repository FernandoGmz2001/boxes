import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type {
  IAuthUser,
  IAuthUserRecord,
} from '../interfaces/auth-user.interface.js';
import type { IAuthRepository } from '../interfaces/auth-repository.interface.js';
import { sortPermisos } from '../permissions.js';

const publicSelect = {
  id: true,
  nombre: true,
  email: true,
  activo: true,
  rol: {
    select: {
      id: true,
      nombre: true,
      permisos: { select: { permiso: true } },
    },
  },
} as const;

interface IAuthUserRow {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  rol: { id: number; nombre: string; permisos: { permiso: string }[] };
}

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<IAuthUserRecord | null> {
    const record: (IAuthUserRow & { password: string }) | null =
      await this.prisma.client.usuario.findUnique({
        where: { email },
        select: { ...publicSelect, password: true },
      });

    return record ? { ...toAuthUser(record), password: record.password } : null;
  }

  async findById(id: number): Promise<IAuthUser | null> {
    const record: IAuthUserRow | null =
      await this.prisma.client.usuario.findUnique({
        where: { id },
        select: publicSelect,
      });

    return record ? toAuthUser(record) : null;
  }
}

function toAuthUser(record: IAuthUserRow): IAuthUser {
  return {
    id: record.id,
    nombre: record.nombre,
    email: record.email,
    rol: { id: record.rol.id, nombre: record.rol.nombre },
    permisos: sortPermisos(
      record.rol.permisos.map(({ permiso }: { permiso: string }) => permiso),
    ),
    activo: record.activo,
  };
}
