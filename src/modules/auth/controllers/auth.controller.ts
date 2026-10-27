import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import type {
  IAuthUser,
  ILoginResult,
} from '../interfaces/auth-user.interface.js';
import { AuthService } from '../services/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ILoginResult> {
    return this.authService.login(loginDto);
  }

  @Get('perfil')
  getProfile(@CurrentUser() usuario: IAuthUser): IAuthUser {
    return usuario;
  }
}
