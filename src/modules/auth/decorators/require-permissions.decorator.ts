import { SetMetadata } from '@nestjs/common';
import { PERMISOS_KEY, type Permiso } from '../permissions.js';

/** Basta con tener uno de los permisos indicados. */
export const RequirePermissions = (
  ...permisos: Permiso[]
): MethodDecorator & ClassDecorator => SetMetadata(PERMISOS_KEY, permisos);
