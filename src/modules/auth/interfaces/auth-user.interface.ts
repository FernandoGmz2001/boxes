export interface IAuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

export interface IAuthUserRecord extends IAuthUser {
  password: string;
}

export interface ILoginResult {
  access_token: string;
  usuario: IAuthUser;
}
