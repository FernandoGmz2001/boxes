import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../shared/pagination/pagination-query.dto.js';
import { ESTADOS_TURNO } from '../interfaces/turno.interface.js';

export class ListShiftsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  caja_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuario_id?: number;

  @IsOptional()
  @IsString()
  @IsIn(ESTADOS_TURNO)
  estado?: string;

  /** Fecha y hora ISO 8601; el front manda el inicio del día en su zona horaria. */
  @IsOptional()
  @IsISO8601()
  fecha_desde?: string;

  @IsOptional()
  @IsISO8601()
  fecha_hasta?: string;
}
