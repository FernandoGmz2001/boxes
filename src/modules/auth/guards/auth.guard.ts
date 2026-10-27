import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import {
  AUTH_REPOSITORY,
  type IAuthRepository,
} from '../interfaces/auth-repository.interface.js';
import type { IAuthUser } from '../interfaces/auth-user.interface.js';
import type { IJwtPayload } from '../interfaces/jwt-payload.interface.js';
import { IS_PUBLIC_KEY } from '../permissions.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic: boolean = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: IAuthUser }>();
    const token: string | undefined = readBearerToken(
      request.headers.authorization,
    );

    if (!token) {
      throw new UnauthorizedException('No autorizado.');
    }

    let payload: IJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<IJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('No autorizado.');
    }

    const usuario: IAuthUser | null = await this.authRepository.findById(
      payload.sub,
    );

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('No autorizado.');
    }

    request.user = usuario;

    return true;
  }
}

function readBearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }

  const token: string = header.slice('Bearer '.length).trim();

  return token.length > 0 ? token : undefined;
}
