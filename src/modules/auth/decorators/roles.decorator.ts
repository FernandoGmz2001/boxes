import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY, type Rol } from '../roles.js';

export const Roles = (...roles: Rol[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
