import {
  BadRequestException,
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
import type { CreateMovementDto } from '../dtos/create-movement.dto.js';
import type { ListMovementsQueryDto } from '../dtos/list-movements-query.dto.js';
import type {
  IMovimiento,
  IProductoStock,
  IUsuarioRef,
  TipoMovimiento,
} from '../interfaces/movimiento.interface.js';
import {
  MOVEMENTS_REPOSITORY,
  type ICreateMovimiento,
  type IMovementsRepository,
} from '../interfaces/movements-repository.interface.js';

@Injectable()
export class MovementsService {
  constructor(
    @Inject(MOVEMENTS_REPOSITORY)
    private readonly movementsRepository: IMovementsRepository,
  ) {}

  async findAllMovements(
    query: ListMovementsQueryDto,
  ): Promise<IPage<IMovimiento>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.movementsRepository.findAll({
        pagina: pagination.pagina,
        limite: pagination.limite,
        producto_id: query.producto_id,
        usuario_id: query.usuario_id,
      }),
      pagination,
    );
  }

  async findMovementById(id: number): Promise<IMovimiento> {
    const movimiento: IMovimiento | null =
      await this.movementsRepository.findById(id);

    if (!movimiento) {
      throw new NotFoundException(`Movimiento ${id} no existe.`);
    }

    return movimiento;
  }

  async createMovement(
    createMovementDto: CreateMovementDto,
    usuarioId: number,
  ): Promise<IMovimiento> {
    const producto: IProductoStock | null =
      await this.movementsRepository.findProductoStock(
        createMovementDto.producto_id,
      );

    if (!producto) {
      throw new NotFoundException(
        `Producto ${createMovementDto.producto_id} no existe.`,
      );
    }

    if (!producto.activo) {
      throw new ConflictException(
        `Producto ${createMovementDto.producto_id} está inactivo.`,
      );
    }

    const usuario: IUsuarioRef | null =
      await this.movementsRepository.findUsuario(usuarioId);

    if (!usuario) {
      throw new NotFoundException(`Usuario ${usuarioId} no existe.`);
    }

    if (!usuario.activo) {
      throw new ConflictException(`Usuario ${usuarioId} está inactivo.`);
    }

    const stockNuevo: number = resolveStockNuevo(
      createMovementDto.tipo_movimiento as TipoMovimiento,
      producto.cantidad_en_existencia,
      createMovementDto.cantidad,
    );

    const input: ICreateMovimiento = {
      producto_id: createMovementDto.producto_id,
      usuario_id: usuarioId,
      tipo_movimiento: createMovementDto.tipo_movimiento,
      cantidad: createMovementDto.cantidad,
      stock_previo: producto.cantidad_en_existencia,
      stock_nuevo: stockNuevo,
      motivo: createMovementDto.motivo,
    };

    const created: IMovimiento | null =
      await this.movementsRepository.create(input);

    if (!created) {
      throw new ConflictException(
        'El stock del producto cambió. Intenta de nuevo.',
      );
    }

    return created;
  }
}

function resolveStockNuevo(
  tipo: TipoMovimiento,
  stockPrevio: number,
  cantidad: number,
): number {
  if (tipo === 'Ajuste') {
    if (cantidad === 0) {
      throw new BadRequestException('El ajuste no puede ser cero.');
    }

    const stockNuevo: number = stockPrevio + cantidad;

    if (stockNuevo < 0) {
      throw new ConflictException(
        `No hay existencia suficiente. Hay ${stockPrevio} y el ajuste es ${cantidad}.`,
      );
    }

    return stockNuevo;
  }

  if (cantidad < 1) {
    throw new BadRequestException('La cantidad debe ser mayor a cero.');
  }

  if (tipo === 'Entrada') {
    return stockPrevio + cantidad;
  }

  if (stockPrevio < cantidad) {
    throw new ConflictException(
      `No hay existencia suficiente. Hay ${stockPrevio} y se piden ${cantidad}.`,
    );
  }

  return stockPrevio - cantidad;
}
