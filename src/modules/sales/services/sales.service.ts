import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
import type {
  CreateSaleDto,
  CreateSaleItemDto,
} from '../dtos/create-sale.dto.js';
import type { ListSalesQueryDto } from '../dtos/list-sales-query.dto.js';
import {
  InsufficientStockError,
  NoOpenShiftError,
  SaleProductsInactiveError,
  SaleProductsNotFoundError,
  SaleTotalExceededError,
} from '../errors/sale.errors.js';
import {
  SALES_REPOSITORY,
  type ISalesRepository,
} from '../interfaces/sales-repository.interface.js';
import type {
  IStockFaltante,
  IVenta,
  IVentaDetalle,
  IVentaResumen,
} from '../interfaces/venta.interface.js';

@Injectable()
export class SalesService {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly salesRepository: ISalesRepository,
  ) {}

  async processSale(
    createSaleDto: CreateSaleDto,
    usuarioId: number,
  ): Promise<IVenta> {
    try {
      return await this.salesRepository.create({
        usuario_id: usuarioId,
        cliente_id: createSaleDto.cliente_id,
        metodo_pago: createSaleDto.metodo_pago,
        detalles: createSaleDto.carrito.map((item: CreateSaleItemDto) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
      });
    } catch (error: unknown) {
      if (error instanceof NoOpenShiftError) {
        throw new ConflictException('Abre un turno antes de vender.');
      }

      if (error instanceof InsufficientStockError) {
        throw new BadRequestException(
          error.faltantes.map((faltante: IStockFaltante) =>
            insufficientStockMessage(faltante),
          ),
        );
      }

      if (error instanceof SaleTotalExceededError) {
        throw new BadRequestException(
          `El total ${error.total} supera el máximo de 99,999,999.99.`,
        );
      }

      if (error instanceof SaleProductsNotFoundError) {
        throw new NotFoundException(
          listMessage(error.productoIds, 'no existe', 'no existen'),
        );
      }

      if (error instanceof SaleProductsInactiveError) {
        throw new ConflictException(
          listMessage(error.productoIds, 'está inactivo', 'están inactivos'),
        );
      }

      throw error;
    }
  }

  /** Sin el permiso cajas, cada usuario solo ve sus propias ventas. */
  async findAllSales(
    query: ListSalesQueryDto,
    usuario: IAuthUser,
  ): Promise<IPage<IVentaResumen>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.salesRepository.findAll({
        pagina: pagination.pagina,
        limite: pagination.limite,
        turno_id: query.turno_id,
        usuario_id: canSeeAllSales(usuario) ? query.usuario_id : usuario.id,
        folio: query.folio,
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

  async findSaleById(id: number, usuario: IAuthUser): Promise<IVentaDetalle> {
    const venta: IVentaDetalle | null = await this.salesRepository.findById(id);

    if (!venta) {
      throw new NotFoundException(`Venta ${id} no existe.`);
    }

    if (venta.usuario_id !== usuario.id && !canSeeAllSales(usuario)) {
      throw new ForbiddenException('No puedes ver ventas de otros usuarios.');
    }

    return venta;
  }
}

function canSeeAllSales(usuario: IAuthUser): boolean {
  return usuario.permisos.includes('cajas');
}

function insufficientStockMessage(faltante: IStockFaltante): string {
  return `No hay existencia suficiente del producto ${faltante.producto_id}. Hay ${faltante.disponible} y se piden ${faltante.solicitado}.`;
}

function listMessage(ids: number[], singular: string, plural: string): string {
  if (ids.length === 1) {
    return `Producto ${ids[0]} ${singular}.`;
  }

  return `Productos ${ids.join(', ')} ${plural}.`;
}
