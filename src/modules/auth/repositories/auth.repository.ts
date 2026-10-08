import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type {
  IAuthUser,
  IAuthUserRecord,
} from '../interfaces/auth-user.interface.js';
import type { IAuthRepository } from '../interfaces/auth-repository.interface.js';

const publicSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
} as const;

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<IAuthUserRecord | null> {
    return this.prisma.client.usuario.findUnique({
      where: { email },
      select: { ...publicSelect, password: true },
    });
  }

  async findById(id: number): Promise<IAuthUser | null> {
    return this.prisma.client.usuario.findUnique({
      where: { id },
      select: publicSelect,
    });
  }
}
