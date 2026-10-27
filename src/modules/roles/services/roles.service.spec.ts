import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IRol } from '../interfaces/rol.interface.js';
import {
  ROLES_REPOSITORY,
  type IRolesRepository,
} from '../interfaces/roles-repository.interface.js';
import { RolesService } from './roles.service.js';

const operador: IRol = {
  id: 2,
  nombre: 'operador',
  descripcion: null,
  permisos: ['productos', 'movimientos'],
  es_sistema: false,
  total_usuarios: 0,
};

const admin: IRol = {
  id: 1,
  nombre: 'admin',
  descripcion: null,
  permisos: ['productos', 'movimientos', 'usuarios', 'roles'],
  es_sistema: true,
  total_usuarios: 1,
};

describe('RolesService', () => {
  let rolesService: RolesService;
  let rolesRepository: IRolesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: ROLES_REPOSITORY,
          useValue: {
            findAll: vi.fn(),
            findById: vi.fn(),
            findByNombre: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
          } satisfies IRolesRepository,
        },
      ],
    }).compile();

    rolesService = module.get<RolesService>(RolesService);
    rolesRepository = module.get<IRolesRepository>(ROLES_REPOSITORY);
  });

  it('stores permissions in catalog order', async () => {
    vi.mocked(rolesRepository.create).mockResolvedValue(operador);

    await rolesService.createRole({
      nombre: 'Almacén',
      permisos: ['movimientos', 'productos', 'movimientos'],
    });

    expect(rolesRepository.create).toHaveBeenCalledWith({
      nombre: 'Almacén',
      descripcion: null,
      permisos: ['productos', 'movimientos'],
    });
  });

  it('rejects a duplicated name', async () => {
    vi.mocked(rolesRepository.findByNombre).mockResolvedValue(operador);

    await expect(
      rolesService.createRole({ nombre: 'Operador', permisos: ['productos'] }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(rolesRepository.create).not.toHaveBeenCalled();
  });

  it('does not modify a system role', async () => {
    vi.mocked(rolesRepository.findById).mockResolvedValue(admin);

    await expect(
      rolesService.updateRole(admin.id, { permisos: ['productos'] }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(rolesService.deleteRole(admin.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(rolesRepository.update).not.toHaveBeenCalled();
    expect(rolesRepository.delete).not.toHaveBeenCalled();
  });

  it('does not delete a role with users', async () => {
    vi.mocked(rolesRepository.findById).mockResolvedValue({
      ...operador,
      total_usuarios: 3,
    });

    await expect(rolesService.deleteRole(operador.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(rolesRepository.delete).not.toHaveBeenCalled();
  });

  it('throws when the role does not exist', async () => {
    vi.mocked(rolesRepository.findById).mockResolvedValue(null);

    await expect(rolesService.findRoleById(9)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
