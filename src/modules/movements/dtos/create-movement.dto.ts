import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TIPOS_MOVIMIENTO } from '../interfaces/movimiento.interface.js';

export class CreateMovementDto {
  @IsInt()
  @Min(1)
  producto_id: number;

  @IsString()
  @IsIn(TIPOS_MOVIMIENTO)
  tipo_movimiento: string;

  @IsInt()
  cantidad: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  motivo?: string;
}
