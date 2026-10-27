export interface IUsuarioRol {
  id: number;
  nombre: string;
}

export interface IUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: IUsuarioRol;
  activo: boolean;
}
