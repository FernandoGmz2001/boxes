import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    return toPage(await this.usersRepository.findAll(pagination), pagination);
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

    return this.usersRepository.create({
      nombre: createUserDto.nombre,
      email: createUserDto.email,
      password: await hashPassword(createUserDto.password),
      rol: createUserDto.rol,
    });
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<IUsuario> {
    if (updateUserDto.email !== undefined) {
      await this.assertEmailAvailable(updateUserDto.email, id);
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
    if (updateUserDto.rol !== undefined) {
      input.rol = updateUserDto.rol;
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
}
