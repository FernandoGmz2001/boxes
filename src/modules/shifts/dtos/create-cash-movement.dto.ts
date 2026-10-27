import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_MONEY } from '../../products/dtos/create-product.dto.js';
import { TIPOS_MOVIMIENTO_CAJA } from '../interfaces/turno.interface.js';

export class CreateCashMovementDto {
  @IsString()
  @IsIn(TIPOS_MOVIMIENTO_CAJA)
  tipo: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_MONEY)
  monto: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  motivo: string;
}
