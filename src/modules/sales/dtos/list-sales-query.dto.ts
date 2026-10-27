import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../shared/pagination/pagination-query.dto.js';

export class ListSalesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turno_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuario_id?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  folio?: string;

  /** Fecha y hora ISO 8601; el front manda el inicio del día en su zona horaria. */
  @IsOptional()
  @IsISO8601()
  fecha_desde?: string;

  @IsOptional()
  @IsISO8601()
  fecha_hasta?: string;
}
