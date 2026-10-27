import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { sortPermisos } from '../../auth/permissions.js';
import {
  resolvePagination,
  toPage,
  type IPage,
  type IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { CreateRoleDto } from '../dtos/create-role.dto.js';
import type { ListRolesQueryDto } from '../dtos/list-roles-query.dto.js';
import type { UpdateRoleDto } from '../dtos/update-role.dto.js';
import type { IRol } from '../interfaces/rol.interface.js';
import {
  ROLES_REPOSITORY,
  type IRolesRepository,
  type IUpdateRol,
} from '../interfaces/roles-repository.interface.js';

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  async findAllRoles(query: ListRolesQueryDto): Promise<IPage<IRol>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.rolesRepository.findAll(pagination, {
        busqueda: query.busqueda,
      }),
      pagination,
    );
  }

  async findRoleById(id: number): Promise<IRol> {
    const rol: IRol | null = await this.rolesRepository.findById(id);

    if (!rol) {
      throw new NotFoundException(`Rol ${id} no existe.`);
    }

    return rol;
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<IRol> {
    await this.assertNombreAvailable(createRoleDto.nombre);

    return this.rolesRepository.create({
      nombre: createRoleDto.nombre,
      descripcion: createRoleDto.descripcion ?? null,
      permisos: sortPermisos(createRoleDto.permisos),
    });
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<IRol> {
    const rol: IRol = await this.findEditableRole(id);

    if (updateRoleDto.nombre !== undefined) {
      await this.assertNombreAvailable(updateRoleDto.nombre, rol.id);
    }

    const input: IUpdateRol = {};

    if (updateRoleDto.nombre !== undefined) {
      input.nombre = updateRoleDto.nombre;
    }
    if (updateRoleDto.descripcion !== undefined) {
      input.descripcion = updateRoleDto.descripcion;
    }
    if (updateRoleDto.permisos !== undefined) {
      input.permisos = sortPermisos(updateRoleDto.permisos);
    }

    return this.rolesRepository.update(id, input);
  }

  async deleteRole(id: number): Promise<void> {
    const rol: IRol = await this.findEditableRole(id);

    if (rol.total_usuarios > 0) {
      throw new ConflictException(
        `El rol ${rol.nombre} tiene usuarios y no se puede borrar.`,
      );
    }

    await this.rolesRepository.delete(id);
  }

  private async findEditableRole(id: number): Promise<IRol> {
    const rol: IRol = await this.findRoleById(id);

    if (rol.es_sistema) {
      throw new ConflictException(
        `El rol ${rol.nombre} es del sistema y no se puede modificar.`,
      );
    }

    return rol;
  }

  private async assertNombreAvailable(
    nombre: string,
    currentId?: number,
  ): Promise<void> {
    const existing: IRol | null = await this.rolesRepository.findByNombre(nombre);

    if (existing && existing.id !== currentId) {
      throw new ConflictException(`El rol ${nombre} ya existe.`);
    }
  }
}
