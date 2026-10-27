import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { fromCentavos, toCentavos } from '../../../shared/money/money.js';
import {
  resolvePagination,
  toPage,
  type IPage,
  type IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
import { buildCorte } from '../corte.js';
import type { CloseShiftDto } from '../dtos/close-shift.dto.js';
import type { CreateCashMovementDto } from '../dtos/create-cash-movement.dto.js';
import type { ListShiftsQueryDto } from '../dtos/list-shifts-query.dto.js';
import type { OpenShiftDto } from '../dtos/open-shift.dto.js';
import {
  InsufficientCashError,
  ShiftAlreadyOpenError,
  ShiftNotFoundError,
  ShiftNotOpenError,
} from '../errors/shift.errors.js';
import {
  SHIFTS_REPOSITORY,
  type IShiftsRepository,
} from '../interfaces/shifts-repository.interface.js';
import type {
  ICajaRef,
  ICierreTurno,
  ICorteTurno,
  IMovimientoCaja,
  ITurno,
  ITurnoDetalle,
  ITurnoResumen,
} from '../interfaces/turno.interface.js';

@Injectable()
export class ShiftsService {
  constructor(
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async findAllShifts(
    query: ListShiftsQueryDto,
  ): Promise<IPage<ITurnoResumen>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.shiftsRepository.findAll({
        pagina: pagination.pagina,
        limite: pagination.limite,
        caja_id: query.caja_id,
        usuario_id: query.usuario_id,
        estado: query.estado,
        fecha_desde: query.fecha_desde
          ? new Date(query.fecha_desde)
          : undefined,
        fecha_hasta: query.fecha_hasta
          ? new Date(query.fecha_hasta)
          : undefined,
      }),
      pagination,
    );
  }

  async findCurrentShift(usuario: IAuthUser): Promise<ITurno> {
    const turno: ITurno | null =
      await this.shiftsRepository.findAbiertoByUsuario(usuario.id);

    if (!turno) {
      throw new NotFoundException('No tienes un turno abierto.');
    }

    return turno;
  }

  async findShiftById(id: number, usuario: IAuthUser): Promise<ITurnoDetalle> {
    const turno: ITurnoDetalle | null =
      await this.shiftsRepository.findDetalleById(id);

    if (!turno) {
      throw new NotFoundException(`Turno ${id} no existe.`);
    }

    assertCanAccess(turno, usuario);
    return turno;
  }

  async openShift(
    openShiftDto: OpenShiftDto,
    usuario: IAuthUser,
  ): Promise<ITurno> {
    const caja: ICajaRef | null = await this.shiftsRepository.findCaja(
      openShiftDto.caja_id,
    );

    if (!caja) {
      throw new NotFoundException(`Caja ${openShiftDto.caja_id} no existe.`);
    }

    if (!caja.activa) {
      throw new ConflictException(
        `Caja ${openShiftDto.caja_id} está inactiva.`,
      );
    }

    const abierto: ITurno | null =
      await this.shiftsRepository.findAbiertoByUsuario(usuario.id);

    if (abierto) {
      throw new ConflictException(
        `Ya tienes abierto el turno ${abierto.id}. Ciérralo antes de abrir otro.`,
      );
    }

    try {
      return await this.shiftsRepository.open({
        caja_id: openShiftDto.caja_id,
        usuario_id: usuario.id,
        fondo_inicial: toMoney(openShiftDto.fondo_inicial),
      });
    } catch (error: unknown) {
      if (error instanceof ShiftAlreadyOpenError) {
        throw new ConflictException(
          `La caja ${openShiftDto.caja_id} ya tiene un turno abierto.`,
        );
      }

      throw error;
    }
  }

  async getShiftCorte(id: number, usuario: IAuthUser): Promise<ICorteTurno> {
    await this.findAccessibleShift(id, usuario);

    return buildCorte(id, await this.shiftsRepository.findTotales(id));
  }

  async createCashMovement(
    id: number,
    createCashMovementDto: CreateCashMovementDto,
    usuario: IAuthUser,
  ): Promise<IMovimientoCaja> {
    await this.findAccessibleShift(id, usuario);

    try {
      return await this.shiftsRepository.createMovimiento({
        turno_id: id,
        usuario_id: usuario.id,
        tipo: createCashMovementDto.tipo,
        monto: toMoney(createCashMovementDto.monto),
        motivo: createCashMovementDto.motivo,
      });
    } catch (error: unknown) {
      if (error instanceof InsufficientCashError) {
        throw new BadRequestException(
          `No hay efectivo suficiente en caja. Hay ${error.disponible} y se retiran ${error.solicitado}.`,
        );
      }

      throw mapShiftError(error);
    }
  }

  async closeShift(
    id: number,
    closeShiftDto: CloseShiftDto,
    usuario: IAuthUser,
  ): Promise<ICierreTurno> {
    await this.findAccessibleShift(id, usuario);

    try {
      return await this.shiftsRepository.close({
        turno_id: id,
        efectivo_contado: toMoney(closeShiftDto.efectivo_contado),
        notas: closeShiftDto.notas,
      });
    } catch (error: unknown) {
      throw mapShiftError(error);
    }
  }

  private async findAccessibleShift(
    id: number,
    usuario: IAuthUser,
  ): Promise<ITurno> {
    const turno: ITurno | null = await this.shiftsRepository.findById(id);

    if (!turno) {
      throw new NotFoundException(`Turno ${id} no existe.`);
    }

    assertCanAccess(turno, usuario);
    return turno;
  }
}

/** Quien no administra cajas solo opera sus propios turnos. */
function assertCanAccess(turno: ITurno, usuario: IAuthUser): void {
  if (turno.usuario_id !== usuario.id && !usuario.permisos.includes('cajas')) {
    throw new ForbiddenException('No puedes operar turnos de otros usuarios.');
  }
}

function mapShiftError(error: unknown): unknown {
  if (error instanceof ShiftNotOpenError) {
    return new ConflictException(`Turno ${error.turnoId} ya está cerrado.`);
  }

  if (error instanceof ShiftNotFoundError) {
    return new NotFoundException(`Turno ${error.turnoId} no existe.`);
  }

  return error;
}

function toMoney(amount: number): string {
  return fromCentavos(toCentavos(amount));
}
