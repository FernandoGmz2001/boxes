export const ROLES = ['admin', 'operador'] as const;

export type Rol = (typeof ROLES)[number];

export const IS_PUBLIC_KEY: string = 'isPublic';

export const ROLES_KEY: string = 'roles';
