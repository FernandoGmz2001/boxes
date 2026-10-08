import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ROLES } from '../../auth/roles.js';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsIn(ROLES)
  rol: string;
}
