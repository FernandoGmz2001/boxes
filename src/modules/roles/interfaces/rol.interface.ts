import type { Permiso } from '../../auth/permissions.js';

export interface IRol {
  id: number;
  nombre: string;
  descripcion: string | null;
  permisos: Permiso[];
  es_sistema: boolean;
  total_usuarios: number;
}
