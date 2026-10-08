import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IAuthUser } from '../interfaces/auth-user.interface.js';
import { IS_PUBLIC_KEY, ROLES_KEY, type Rol } from '../roles.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic: boolean = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const requiredRoles: Rol[] | undefined = this.reflector.getAllAndOverride<
      Rol[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: IAuthUser }>();
    const rol: string | undefined = request.user?.rol;

    if (!rol || !requiredRoles.includes(rol as Rol)) {
      throw new ForbiddenException('No tienes permiso para esta acción.');
    }

    return true;
  }
}
