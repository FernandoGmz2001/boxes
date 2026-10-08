import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto.js';
import { Public } from '../decorators/public.decorator.js';
import type { ILoginResult } from '../interfaces/auth-user.interface.js';
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
}
