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
import { MAX_MONEY } from './create-product.dto.js';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre_producto?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imagen_url?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_minimo?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sku?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codigo_barras?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY)
  precio_venta?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY)
  costo_compra?: number;

  @IsOptional()
  @IsBoolean()
  es_servicio?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  id_categoria?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clave_producto_servicio?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clave_unidad_medida?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  objeto_impuesto?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  impuesto_preset_ids?: number[];
}
