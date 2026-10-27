import type { Permiso } from '../permissions.js';

export interface IAuthRol {
  id: number;
  nombre: string;
}

export interface IAuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: IAuthRol;
  permisos: Permiso[];
  activo: boolean;
}

export interface IAuthUserRecord extends IAuthUser {
  password: string;
}

export interface ILoginResult {
  access_token: string;
  usuario: IAuthUser;
}
