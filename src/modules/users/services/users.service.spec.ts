import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
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
  rol: { id: 2, nombre: 'operador' },
  activo: true,
};

const admin: IAuthUser = {
  id: 1,
  nombre: 'Administrador',
  email: 'admin@boxes.local',
  rol: { id: 1, nombre: 'admin' },
  permisos: ['productos', 'movimientos', 'usuarios', 'roles'],
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
            rolExists: vi.fn().mockResolvedValue(true),
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
        rol_id: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a role that does not exist', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(usersRepository.rolExists).mockResolvedValue(false);

    await expect(
      usersService.createUser({
        nombre: 'Otro',
        email: 'otro@boxes.local',
        password: 'otra-clave',
        rol_id: 99,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('throws when the user does not exist', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    await expect(usersService.findUserById(9)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not let a user deactivate themselves', async () => {
    await expect(
      usersService.updateUser(admin.id, { activo: false }, admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usersRepository.update).not.toHaveBeenCalled();
  });

  it('does not let a user change their own role', async () => {
    await expect(
      usersService.updateUser(admin.id, { rol_id: 2 }, admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usersRepository.update).not.toHaveBeenCalled();
  });

  it('lets a user edit their own data keeping role and status', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(usersRepository.update).mockResolvedValue(usuario);

    await usersService.updateUser(
      admin.id,
      { nombre: 'Admin', rol_id: admin.rol.id, activo: true },
      admin,
    );

    expect(usersRepository.update).toHaveBeenCalledWith(admin.id, {
      nombre: 'Admin',
      rol_id: admin.rol.id,
      activo: true,
    });
  });
});
