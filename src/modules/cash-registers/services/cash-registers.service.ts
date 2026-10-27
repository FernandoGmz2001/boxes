import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  resolvePagination,
  toPage,
  type IPage,
  type IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { CreateCashRegisterDto } from '../dtos/create-cash-register.dto.js';
import type { ListCashRegistersQueryDto } from '../dtos/list-cash-registers-query.dto.js';
import type { UpdateCashRegisterDto } from '../dtos/update-cash-register.dto.js';
import type { ICaja } from '../interfaces/caja.interface.js';
import {
  CASH_REGISTERS_REPOSITORY,
  type ICashRegistersRepository,
  type IUpdateCaja,
} from '../interfaces/cash-registers-repository.interface.js';

@Injectable()
export class CashRegistersService {
  constructor(
    @Inject(CASH_REGISTERS_REPOSITORY)
    private readonly cashRegistersRepository: ICashRegistersRepository,
  ) {}

  async findAllCashRegisters(
    query: ListCashRegistersQueryDto,
  ): Promise<IPage<ICaja>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.cashRegistersRepository.findAll({
        pagina: pagination.pagina,
        limite: pagination.limite,
        activa: query.activa,
      }),
      pagination,
    );
  }

  async findCashRegisterById(id: number): Promise<ICaja> {
    const caja: ICaja | null = await this.cashRegistersRepository.findById(id);

    if (!caja) {
      throw new NotFoundException(`Caja ${id} no existe.`);
    }

    return caja;
  }

  async createCashRegister(
    createCashRegisterDto: CreateCashRegisterDto,
  ): Promise<ICaja> {
    await this.assertNombreAvailable(createCashRegisterDto.nombre);

    return this.cashRegistersRepository.create({
      nombre: createCashRegisterDto.nombre,
      activa: createCashRegisterDto.activa ?? true,
    });
  }

  async updateCashRegister(
    id: number,
    updateCashRegisterDto: UpdateCashRegisterDto,
  ): Promise<ICaja> {
    const caja: ICaja = await this.findCashRegisterById(id);

    if (updateCashRegisterDto.nombre !== undefined) {
      await this.assertNombreAvailable(updateCashRegisterDto.nombre, caja.id);
    }

    if (
      updateCashRegisterDto.activa === false &&
      (await this.cashRegistersRepository.hasTurnoAbierto(id))
    ) {
      throw new ConflictException(
        `La caja ${caja.nombre} tiene un turno abierto y no se puede desactivar.`,
      );
    }

    const input: IUpdateCaja = {};

    if (updateCashRegisterDto.nombre !== undefined) {
      input.nombre = updateCashRegisterDto.nombre;
    }
    if (updateCashRegisterDto.activa !== undefined) {
      input.activa = updateCashRegisterDto.activa;
    }

    return this.cashRegistersRepository.update(id, input);
  }

  private async assertNombreAvailable(
    nombre: string,
    currentId?: number,
  ): Promise<void> {
    const existing: ICaja | null =
      await this.cashRegistersRepository.findByNombre(nombre);

    if (existing && existing.id !== currentId) {
      throw new ConflictException(`La caja ${nombre} ya existe.`);
    }
  }
}
