import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
import type { CreateSaleDto } from '../dtos/create-sale.dto.js';
import {
  InsufficientStockError,
  NoOpenShiftError,
  SaleProductsInactiveError,
  SaleProductsNotFoundError,
} from '../errors/sale.errors.js';
import {
  SALES_REPOSITORY,
  type ISalesRepository,
} from '../interfaces/sales-repository.interface.js';
import type { IVenta, IVentaDetalle } from '../interfaces/venta.interface.js';
import { SalesService } from './sales.service.js';

const createSaleDto: CreateSaleDto = {
  metodo_pago: 'Efectivo',
  carrito: [
    { producto_id: 4, cantidad: 3 },
    { producto_id: 7, cantidad: 1 },
  ],
};

const venta: IVenta = {
  id: 1,
  folio: 'V-00000001',
  usuario_id: 2,
  turno_id: 5,
  cliente_id: null,
  metodo_pago: 'Efectivo',
  total: '50.70',
  created_at: '2026-10-26T12:00:00.000Z',
  detalles: [],
};

const ventaDetalle: IVentaDetalle = {
  ...venta,
  usuario: { id: 2, nombre: 'Cajero' },
  detalles: [],
};

const cajero: IAuthUser = {
  id: 2,
  nombre: 'Cajero',
  email: 'cajero@boxes.local',
  rol: { id: 3, nombre: 'cajero' },
  permisos: ['ventas'],
  activo: true,
};

const supervisor: IAuthUser = { ...cajero, id: 1, permisos: ['cajas'] };

describe('SalesService', () => {
  let salesService: SalesService;
  let salesRepository: ISalesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: SALES_REPOSITORY,
          useValue: {
            create: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
          } satisfies ISalesRepository,
        },
      ],
    }).compile();

    salesService = module.get<SalesService>(SalesService);
    salesRepository = module.get<ISalesRepository>(SALES_REPOSITORY);
  });

  describe('processSale', () => {
    it('sends only products and quantities; prices come from the database', async () => {
      vi.mocked(salesRepository.create).mockResolvedValue(venta);

      await expect(salesService.processSale(createSaleDto, 2)).resolves.toBe(
        venta,
      );
      expect(salesRepository.create).toHaveBeenCalledWith({
        usuario_id: 2,
        cliente_id: undefined,
        metodo_pago: 'Efectivo',
        detalles: [
          { producto_id: 4, cantidad: 3 },
          { producto_id: 7, cantidad: 1 },
        ],
      });
    });

    it('maps a missing open shift to 409', async () => {
      vi.mocked(salesRepository.create).mockRejectedValue(
        new NoOpenShiftError(2),
      );

      await expect(salesService.processSale(createSaleDto, 2)).rejects.toThrow(
        new ConflictException('Abre un turno antes de vender.'),
      );
    });

    it('maps insufficient stock to 400 with one message per product', async () => {
      vi.mocked(salesRepository.create).mockRejectedValue(
        new InsufficientStockError([
          { producto_id: 4, solicitado: 3, disponible: 1 },
        ]),
      );

      const error: unknown = await salesService
        .processSale(createSaleDto, 2)
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: [
          'No hay existencia suficiente del producto 4. Hay 1 y se piden 3.',
        ],
      });
    });

    it('maps missing products to 404', async () => {
      vi.mocked(salesRepository.create).mockRejectedValue(
        new SaleProductsNotFoundError([7]),
      );

      await expect(salesService.processSale(createSaleDto, 2)).rejects.toThrow(
        new NotFoundException('Producto 7 no existe.'),
      );
    });

    it('maps inactive products to 409', async () => {
      vi.mocked(salesRepository.create).mockRejectedValue(
        new SaleProductsInactiveError([4, 7]),
      );

      await expect(salesService.processSale(createSaleDto, 2)).rejects.toThrow(
        new ConflictException('Productos 4, 7 están inactivos.'),
      );
    });

    it('rethrows unexpected errors untouched', async () => {
      const databaseError: Error = new Error('connection lost');
      vi.mocked(salesRepository.create).mockRejectedValue(databaseError);

      await expect(salesService.processSale(createSaleDto, 2)).rejects.toBe(
        databaseError,
      );
    });
  });

  describe('findAllSales', () => {
    beforeEach(() => {
      vi.mocked(salesRepository.findAll).mockResolvedValue({
        items: [],
        total: 0,
      });
    });

    it('limits a cashier to their own sales', async () => {
      await salesService.findAllSales({ usuario_id: 9 }, cajero);

      expect(salesRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ usuario_id: 2 }),
      );
    });

    it('lets a supervisor filter by any user', async () => {
      await salesService.findAllSales({ usuario_id: 9 }, supervisor);

      expect(salesRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ usuario_id: 9 }),
      );
    });
  });

  describe('findSaleById', () => {
    it('returns the cashier own sale', async () => {
      vi.mocked(salesRepository.findById).mockResolvedValue(ventaDetalle);

      await expect(salesService.findSaleById(1, cajero)).resolves.toBe(
        ventaDetalle,
      );
    });

    it('forbids a cashier from reading another user sale', async () => {
      vi.mocked(salesRepository.findById).mockResolvedValue({
        ...ventaDetalle,
        usuario_id: 9,
      });

      await expect(salesService.findSaleById(1, cajero)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws 404 when the sale does not exist', async () => {
      vi.mocked(salesRepository.findById).mockResolvedValue(null);

      await expect(salesService.findSaleById(1, cajero)).rejects.toThrow(
        new NotFoundException('Venta 1 no existe.'),
      );
    });
  });
});
