import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { UpdateProductDto } from './update-product.dto.js';

export const MAX_PRODUCTOS_POR_ACTUALIZACION: number = 100;

export class UpdateProductItemDto extends UpdateProductDto {
  @IsInt()
  @Min(1)
  id: number;
}

export class UpdateProductsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PRODUCTOS_POR_ACTUALIZACION)
  @ArrayUnique((producto: UpdateProductItemDto) => producto.id)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductItemDto)
  productos: UpdateProductItemDto[];
}
