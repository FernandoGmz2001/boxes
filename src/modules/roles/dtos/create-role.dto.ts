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

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(PERMISOS, { each: true })
  permisos: Permiso[];
}
