export interface IClaveProdServ {
  clave: string;
  descripcion: string;
  incluir_iva_trasladado: string;
  incluir_ieps_trasladado: string;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string | null;
}

export interface IClaveUnidad {
  clave: string;
  nombre: string;
  descripcion: string | null;
  simbolo: string | null;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string | null;
}

export interface IObjetoImp {
  clave: string;
  descripcion: string;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string | null;
}
