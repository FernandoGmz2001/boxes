export const PERMISOS = [
  'productos',
  'movimientos',
  'usuarios',
  'roles',
  'ventas',
  'cajas',
] as const;

export type Permiso = (typeof PERMISOS)[number];

export const IS_PUBLIC_KEY: string = 'isPublic';

export const PERMISOS_KEY: string = 'permisos';

export function isPermiso(value: string): value is Permiso {
  return PERMISOS.some((permiso: Permiso) => permiso === value);
}

/** Devuelve los permisos conocidos en el orden del catálogo, sin duplicados. */
export function sortPermisos(values: readonly string[]): Permiso[] {
  return PERMISOS.filter((permiso: Permiso) => values.includes(permiso));
}
