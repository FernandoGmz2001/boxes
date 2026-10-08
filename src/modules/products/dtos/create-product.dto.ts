import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const MAX_MONEY: number = 99_999_999.99;

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  nombre_producto: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imagen_url?: string;

  @IsInt()
  @Min(0)
  cantidad_en_existencia: number;

  @IsInt()
  @Min(0)
  stock_minimo: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sku?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codigo_barras?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY)
  precio_venta: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY)
  costo_compra: number;

  @IsBoolean()
  es_servicio: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsInt()
  @Min(1)
  id_categoria: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clave_producto_servicio?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clave_unidad_medida?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  objeto_impuesto?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  impuesto_preset_ids?: number[];
}
