import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IMovimiento } from '../interfaces/movimiento.interface.js';
import {
  MOVEMENTS_REPOSITORY,
  type IMovementsRepository,
} from '../interfaces/movements-repository.interface.js';
import { MovementsService } from './movements.service.js';

const movimiento: IMovimiento = {
  id: 1,
  producto_id: 4,
  tipo_movimiento: 'Entrada',
  cantidad: 3,
  stock_previo: 10,
  stock_nuevo: 13,
  motivo: 'Compra',
  usuario_id: 2,
  created_at: '2026-10-07T12:00:00.000Z',
};

describe('MovementsService', () => {
  let movementsService: MovementsService;
  let movementsRepository: IMovementsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        {
          provide: MOVEMENTS_REPOSITORY,
          useValue: {
            findAll: vi.fn(),
            findById: vi.fn(),
            findProductoStock: vi.fn(),
            findUsuario: vi.fn(),
            create: vi.fn(),
          } satisfies IMovementsRepository,
        },
      ],
    }).compile();

    movementsService = module.get<MovementsService>(MovementsService);
    movementsRepository = module.get<IMovementsRepository>(
      MOVEMENTS_REPOSITORY,
    );
  });

  it('registers an entrada and stores the resulting stock', async () => {
    vi.mocked(movementsRepository.findProductoStock).mockResolvedValue({
      id: 4,
      cantidad_en_existencia: 10,
      activo: true,
    });
    vi.mocked(movementsRepository.findUsuario).mockResolvedValue({
      id: 2,
      activo: true,
    });
    vi.mocked(movementsRepository.create).mockResolvedValue(movimiento);

    const result: IMovimiento = await movementsService.createMovement(
      {
        producto_id: 4,
        tipo_movimiento: 'Entrada',
        cantidad: 3,
        motivo: 'Compra',
      },
      2,
    );

    expect(result).toEqual(movimiento);
    expect(movementsRepository.create).toHaveBeenCalledWith({
      producto_id: 4,
      usuario_id: 2,
      tipo_movimiento: 'Entrada',
      cantidad: 3,
      stock_previo: 10,
      stock_nuevo: 13,
      motivo: 'Compra',
    });
  });

  it('rejects a salida that exceeds the stock', async () => {
    vi.mocked(movementsRepository.findProductoStock).mockResolvedValue({
      id: 4,
      cantidad_en_existencia: 1,
      activo: true,
    });
    vi.mocked(movementsRepository.findUsuario).mockResolvedValue({
      id: 2,
      activo: true,
    });

    await expect(
      movementsService.createMovement(
        {
          producto_id: 4,
          tipo_movimiento: 'Salida',
          cantidad: 5,
        },
        2,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(movementsRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an ajuste of zero', async () => {
    vi.mocked(movementsRepository.findProductoStock).mockResolvedValue({
      id: 4,
      cantidad_en_existencia: 10,
      activo: true,
    });
    vi.mocked(movementsRepository.findUsuario).mockResolvedValue({
      id: 2,
      activo: true,
    });

    await expect(
      movementsService.createMovement(
        {
          producto_id: 4,
          tipo_movimiento: 'Ajuste',
          cantidad: 0,
        },
        2,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when the product does not exist', async () => {
    vi.mocked(movementsRepository.findProductoStock).mockResolvedValue(null);

    await expect(
      movementsService.createMovement(
        {
          producto_id: 9,
          tipo_movimiento: 'Entrada',
          cantidad: 1,
        },
        2,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
