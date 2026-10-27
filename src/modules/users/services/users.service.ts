import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
import type {
  IPage,
  IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import {
  resolvePagination,
  toPage,
} from '../../../shared/pagination/paginated.interface.js';
import { hashPassword } from '../../../shared/password/password.js';
import type { CreateUserDto } from '../dtos/create-user.dto.js';
import type { ListUsersQueryDto } from '../dtos/list-users-query.dto.js';
import type { UpdateUserDto } from '../dtos/update-user.dto.js';
import type { IUsuario } from '../interfaces/usuario.interface.js';
import {
  USERS_REPOSITORY,
  type IUpdateUsuario,
  type IUsersRepository,
} from '../interfaces/users-repository.interface.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async findAllUsers(query: ListUsersQueryDto): Promise<IPage<IUsuario>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.usersRepository.findAll(pagination, {
        busqueda: query.busqueda,
        activo: query.activo,
      }),
      pagination,
    );
  }

  async findUserById(id: number): Promise<IUsuario> {
    const usuario: IUsuario | null = await this.usersRepository.findById(id);

    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no existe.`);
    }

    return usuario;
  }

  async createUser(createUserDto: CreateUserDto): Promise<IUsuario> {
    await this.assertEmailAvailable(createUserDto.email);
    await this.assertRolExists(createUserDto.rol_id);

    return this.usersRepository.create({
      nombre: createUserDto.nombre,
      email: createUserDto.email,
      password: await hashPassword(createUserDto.password),
      rol_id: createUserDto.rol_id,
    });
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser: IAuthUser,
  ): Promise<IUsuario> {
    if (id === currentUser.id) {
      assertKeepsOwnAccess(updateUserDto, currentUser);
    }
    if (updateUserDto.email !== undefined) {
      await this.assertEmailAvailable(updateUserDto.email, id);
    }
    if (updateUserDto.rol_id !== undefined) {
      await this.assertRolExists(updateUserDto.rol_id);
    }

    const input: IUpdateUsuario = {};

    if (updateUserDto.nombre !== undefined) {
      input.nombre = updateUserDto.nombre;
    }
    if (updateUserDto.email !== undefined) {
      input.email = updateUserDto.email;
    }
    if (updateUserDto.password !== undefined) {
      input.password = await hashPassword(updateUserDto.password);
    }
    if (updateUserDto.rol_id !== undefined) {
      input.rol_id = updateUserDto.rol_id;
    }
    if (updateUserDto.activo !== undefined) {
      input.activo = updateUserDto.activo;
    }

    const updated: IUsuario | null = await this.usersRepository.update(
      id,
      input,
    );

    if (!updated) {
      throw new NotFoundException(`Usuario ${id} no existe.`);
    }

    return updated;
  }

  private async assertEmailAvailable(
    email: string,
    currentId?: number,
  ): Promise<void> {
    const existing: IUsuario | null =
      await this.usersRepository.findByEmail(email);

    if (existing && existing.id !== currentId) {
      throw new ConflictException(`El email ${email} ya está registrado.`);
    }
  }

  private async assertRolExists(rolId: number): Promise<void> {
    if (!(await this.usersRepository.rolExists(rolId))) {
      throw new NotFoundException(`Rol ${rolId} no existe.`);
    }
  }
}

/** Evita que alguien se deje sin acceso a sí mismo. */
function assertKeepsOwnAccess(
  updateUserDto: UpdateUserDto,
  currentUser: IAuthUser,
): void {
  const deactivates: boolean = updateUserDto.activo === false;
  const changesRol: boolean =
    updateUserDto.rol_id !== undefined &&
    updateUserDto.rol_id !== currentUser.rol.id;

  if (deactivates || changesRol) {
    throw new ForbiddenException(
      'No puedes cambiar tu propio rol ni desactivarte.',
    );
  }
}
