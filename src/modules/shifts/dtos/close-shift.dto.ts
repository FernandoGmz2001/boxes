import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_MONEY } from '../../products/dtos/create-product.dto.js';

export class CloseShiftDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY)
  efectivo_contado: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  notas?: string;
}
