export interface IImpuesto {
  id: number;
  clave_impuesto: string;
  impuesto: string;
  factor: string;
  rango_o_fijo: string;
  valor_minimo: string | null;
  valor_maximo: string;
  traslado: boolean;
  retencion: boolean;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string | null;
}
