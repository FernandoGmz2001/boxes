import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { METODOS_PAGO } from '../interfaces/venta.interface.js';

export const MAX_PRODUCTOS_POR_VENTA: number = 100;

/** El precio sale de producto.precio_venta; el cliente solo indica qué y cuánto. */
export class CreateSaleItemDto {
  @IsInt()
  @Min(1)
  producto_id: number;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CreateSaleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  cliente_id?: number;

  @IsString()
  @IsIn(METODOS_PAGO)
  metodo_pago: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PRODUCTOS_POR_VENTA)
  @ArrayUnique((item: CreateSaleItemDto) => item.producto_id)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  carrito: CreateSaleItemDto[];
}
