import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { hashPassword } from '../../../shared/password/password.js';
import {
  AUTH_REPOSITORY,
  type IAuthRepository,
} from '../interfaces/auth-repository.interface.js';
import type { IAuthUserRecord } from '../interfaces/auth-user.interface.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: IAuthRepository;
  let jwtService: JwtService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword('cambiar-esta-clave');
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AUTH_REPOSITORY,
          useValue: {
            findByEmail: vi.fn(),
            findById: vi.fn(),
          } satisfies IAuthRepository,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn().mockResolvedValue('token-de-prueba'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authRepository = module.get<IAuthRepository>(AUTH_REPOSITORY);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('returns a token and the user without the password', async () => {
    const record: IAuthUserRecord = {
      id: 1,
      nombre: 'Administrador',
      email: 'admin@boxes.local',
      rol: 'admin',
      activo: true,
      password: passwordHash,
    };
    vi.mocked(authRepository.findByEmail).mockResolvedValue(record);

    const result = await authService.login({
      email: 'admin@boxes.local',
      password: 'cambiar-esta-clave',
    });

    expect(result.access_token).toBe('token-de-prueba');
    expect(result.usuario).toEqual({
      id: 1,
      nombre: 'Administrador',
      email: 'admin@boxes.local',
      rol: 'admin',
      activo: true,
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'admin@boxes.local',
      rol: 'admin',
    });
  });

  it('rejects an inactive user with the same message as a bad password', async () => {
    vi.mocked(authRepository.findByEmail).mockResolvedValue({
      id: 1,
      nombre: 'Administrador',
      email: 'admin@boxes.local',
      rol: 'admin',
      activo: false,
      password: passwordHash,
    });

    await expect(
      authService.login({
        email: 'admin@boxes.local',
        password: 'cambiar-esta-clave',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
