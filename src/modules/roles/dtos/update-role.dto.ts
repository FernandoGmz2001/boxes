import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PERMISOS, type Permiso } from '../../auth/permissions.js';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(PERMISOS, { each: true })
  permisos?: Permiso[];
}
