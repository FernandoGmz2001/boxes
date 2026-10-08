import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../../../shared/password/password.js';
import type { LoginDto } from '../dtos/login.dto.js';
import {
  AUTH_REPOSITORY,
  type IAuthRepository,
} from '../interfaces/auth-repository.interface.js';
import type {
  IAuthUser,
  IAuthUserRecord,
  ILoginResult,
} from '../interfaces/auth-user.interface.js';
import type { IJwtPayload } from '../interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<ILoginResult> {
    const record: IAuthUserRecord | null =
      await this.authRepository.findByEmail(loginDto.email);

    if (!record || !record.activo) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const matches: boolean = await verifyPassword(
      record.password,
      loginDto.password,
    );

    if (!matches) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const payload: IJwtPayload = {
      sub: record.id,
      email: record.email,
      rol: record.rol,
    };
    const accessToken: string = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      usuario: toAuthUser(record),
    };
  }
}

function toAuthUser(record: IAuthUserRecord): IAuthUser {
  return {
    id: record.id,
    nombre: record.nombre,
    email: record.email,
    rol: record.rol,
    activo: record.activo,
  };
}
