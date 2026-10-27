import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IAuthUser } from '../interfaces/auth-user.interface.js';
import { IS_PUBLIC_KEY, PERMISOS_KEY, type Permiso } from '../permissions.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic: boolean = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const requiredPermisos: Permiso[] | undefined =
      this.reflector.getAllAndOverride<Permiso[]>(PERMISOS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermisos || requiredPermisos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: IAuthUser }>();
    const permisos: Permiso[] = request.user?.permisos ?? [];

    if (!requiredPermisos.some((permiso: Permiso) => permisos.includes(permiso))) {
      throw new ForbiddenException('No tienes permiso para esta acción.');
    }

    return true;
  }
}
