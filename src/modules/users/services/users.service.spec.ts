import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IUsuario } from '../interfaces/usuario.interface.js';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../interfaces/users-repository.interface.js';
import { UsersService } from './users.service.js';

const usuario: IUsuario = {
  id: 2,
  nombre: 'Operador',
  email: 'operador@boxes.local',
  rol: 'operador',
  activo: true,
};

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: IUsersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USERS_REPOSITORY,
          useValue: {
            findAll: vi.fn(),
            findById: vi.fn(),
            findByEmail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
          } satisfies IUsersRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<IUsersRepository>(USERS_REPOSITORY);
  });

  it('rejects a duplicated email', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(usuario);

    await expect(
      usersService.createUser({
        nombre: 'Otro',
        email: 'operador@boxes.local',
        password: 'otra-clave',
        rol: 'operador',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('throws when the user does not exist', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    await expect(usersService.findUserById(9)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
