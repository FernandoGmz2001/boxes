import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IAuthUser } from '../interfaces/auth-user.interface.js';
import { IS_PUBLIC_KEY, PERMISOS_KEY, type Permiso } from '../permissions.js';
import { PermissionsGuard } from './permissions.guard.js';

function contextFor(user: IAuthUser | undefined): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function userWith(permisos: Permiso[]): IAuthUser {
  return {
    id: 2,
    nombre: 'Operador',
    email: 'operador@boxes.local',
    rol: { id: 2, nombre: 'operador' },
    permisos,
    activo: true,
  };
}

describe('PermissionsGuard', () => {
  let reflector: Reflector;
  let guard: PermissionsGuard;

  function requireMetadata(isPublic: boolean, permisos?: Permiso[]): void {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation(
      (key: unknown) => (key === IS_PUBLIC_KEY ? isPublic : key === PERMISOS_KEY ? permisos : undefined),
    );
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('allows a route without required permissions', () => {
    requireMetadata(false, undefined);

    expect(guard.canActivate(contextFor(userWith([])))).toBe(true);
  });

  it('allows when the user has any of the required permissions', () => {
    requireMetadata(false, ['productos', 'movimientos']);

    expect(guard.canActivate(contextFor(userWith(['movimientos'])))).toBe(true);
  });

  it('rejects when the user has none of the required permissions', () => {
    requireMetadata(false, ['usuarios']);

    expect(() =>
      guard.canActivate(contextFor(userWith(['productos']))),
    ).toThrow(ForbiddenException);
  });

  it('allows public routes without a user', () => {
    requireMetadata(true, ['usuarios']);

    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });
});
