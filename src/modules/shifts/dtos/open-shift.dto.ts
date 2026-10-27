import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { MAX_MONEY } from '../../products/dtos/create-product.dto.js';

export class OpenShiftDto {
  @IsInt()
  @Min(1)
  caja_id: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY)
  fondo_inicial: number;
}
