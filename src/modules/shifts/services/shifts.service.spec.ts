import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IAuthUser } from '../../auth/interfaces/auth-user.interface.js';
import {
  InsufficientCashError,
  ShiftAlreadyOpenError,
  ShiftNotOpenError,
} from '../errors/shift.errors.js';
import {
  SHIFTS_REPOSITORY,
  type IShiftsRepository,
} from '../interfaces/shifts-repository.interface.js';
import type { ITurno } from '../interfaces/turno.interface.js';
import { ShiftsService } from './shifts.service.js';

const cajero: IAuthUser = {
  id: 2,
  nombre: 'Cajero',
  email: 'cajero@boxes.local',
  rol: { id: 3, nombre: 'cajero' },
  permisos: ['ventas'],
  activo: true,
};

const supervisor: IAuthUser = {
  ...cajero,
  id: 1,
  permisos: ['ventas', 'cajas'],
};

const turno: ITurno = {
  id: 5,
  caja_id: 1,
  usuario_id: 2,
  estado: 'Abierto',
  fondo_inicial: '500.00',
  efectivo_esperado: null,
  efectivo_contado: null,
  diferencia: null,
  notas: null,
  abierto_at: '2026-10-26T14:00:00.000Z',
  cerrado_at: null,
};

describe('ShiftsService', () => {
  let shiftsService: ShiftsService;
  let shiftsRepository: IShiftsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: SHIFTS_REPOSITORY,
          useValue: {
            findAll: vi.fn(),
            findById: vi.fn(),
            findDetalleById: vi.fn(),
            findAbiertoByUsuario: vi.fn(),
            findCaja: vi.fn(),
            findTotales: vi.fn(),
            open: vi.fn(),
            createMovimiento: vi.fn(),
            close: vi.fn(),
          } satisfies IShiftsRepository,
        },
      ],
    }).compile();

    shiftsService = module.get<ShiftsService>(ShiftsService);
    shiftsRepository = module.get<IShiftsRepository>(SHIFTS_REPOSITORY);
  });

  describe('openShift', () => {
    it('opens a shift for the token user with the fund as a fixed string', async () => {
      vi.mocked(shiftsRepository.findCaja).mockResolvedValue({
        id: 1,
        activa: true,
      });
      vi.mocked(shiftsRepository.findAbiertoByUsuario).mockResolvedValue(null);
      vi.mocked(shiftsRepository.open).mockResolvedValue(turno);

      await expect(
        shiftsService.openShift({ caja_id: 1, fondo_inicial: 500 }, cajero),
      ).resolves.toBe(turno);
      expect(shiftsRepository.open).toHaveBeenCalledWith({
        caja_id: 1,
        usuario_id: 2,
        fondo_inicial: '500.00',
      });
    });

    it('rejects an inactive cash register', async () => {
      vi.mocked(shiftsRepository.findCaja).mockResolvedValue({
        id: 1,
        activa: false,
      });

      await expect(
        shiftsService.openShift({ caja_id: 1, fondo_inicial: 0 }, cajero),
      ).rejects.toThrow(new ConflictException('Caja 1 está inactiva.'));
    });

    it('rejects a user who already has an open shift', async () => {
      vi.mocked(shiftsRepository.findCaja).mockResolvedValue({
        id: 1,
        activa: true,
      });
      vi.mocked(shiftsRepository.findAbiertoByUsuario).mockResolvedValue(turno);

      await expect(
        shiftsService.openShift({ caja_id: 1, fondo_inicial: 0 }, cajero),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(shiftsRepository.open).not.toHaveBeenCalled();
    });

    it('maps the open-shift unique index to 409', async () => {
      vi.mocked(shiftsRepository.findCaja).mockResolvedValue({
        id: 1,
        activa: true,
      });
      vi.mocked(shiftsRepository.findAbiertoByUsuario).mockResolvedValue(null);
      vi.mocked(shiftsRepository.open).mockRejectedValue(
        new ShiftAlreadyOpenError(),
      );

      await expect(
        shiftsService.openShift({ caja_id: 1, fondo_inicial: 0 }, cajero),
      ).rejects.toThrow(
        new ConflictException('La caja 1 ya tiene un turno abierto.'),
      );
    });
  });

  it('lists shifts with the cashier and cash register names', async () => {
    vi.mocked(shiftsRepository.findAll).mockResolvedValue({
      items: [
        {
          ...turno,
          usuario: { id: 2, nombre: 'Cajero' },
          caja: { id: 1, nombre: 'Caja 1' },
        },
      ],
      total: 1,
    });

    const page = await shiftsService.findAllShifts({});

    expect(page.data[0].usuario.nombre).toBe('Cajero');
    expect(page.data[0].caja.nombre).toBe('Caja 1');
  });

  it('returns the shift detail with the cashier and cash register names', async () => {
    vi.mocked(shiftsRepository.findDetalleById).mockResolvedValue({
      ...turno,
      usuario: { id: 2, nombre: 'Cajero' },
      caja: { id: 1, nombre: 'Caja 1' },
      movimientos: [],
    });

    const detalle = await shiftsService.findShiftById(5, cajero);

    expect(detalle.usuario.nombre).toBe('Cajero');
    expect(detalle.caja.nombre).toBe('Caja 1');
  });

  it('returns 404 when the user has no open shift', async () => {
    vi.mocked(shiftsRepository.findAbiertoByUsuario).mockResolvedValue(null);

    await expect(shiftsService.findCurrentShift(cajero)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forbids operating another user shift without the cajas permission', async () => {
    vi.mocked(shiftsRepository.findById).mockResolvedValue({
      ...turno,
      usuario_id: 9,
    });

    await expect(
      shiftsService.closeShift(5, { efectivo_contado: 0 }, cajero),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(shiftsRepository.close).not.toHaveBeenCalled();
  });

  it('lets a supervisor close another user shift', async () => {
    vi.mocked(shiftsRepository.findById).mockResolvedValue(turno);
    vi.mocked(shiftsRepository.close).mockResolvedValue({
      turno: { ...turno, estado: 'Cerrado' },
      corte: {
        turno_id: 5,
        fondo_inicial: '500.00',
        ventas: [],
        total_ventas: '0.00',
        entradas: '0.00',
        retiros: '0.00',
        efectivo_esperado: '500.00',
      },
    });

    await shiftsService.closeShift(
      5,
      { efectivo_contado: 480.5, notas: 'Faltante' },
      supervisor,
    );
    expect(shiftsRepository.close).toHaveBeenCalledWith({
      turno_id: 5,
      efectivo_contado: '480.50',
      notas: 'Faltante',
    });
  });

  it('maps closing an already closed shift to 409', async () => {
    vi.mocked(shiftsRepository.findById).mockResolvedValue(turno);
    vi.mocked(shiftsRepository.close).mockRejectedValue(
      new ShiftNotOpenError(5),
    );

    await expect(
      shiftsService.closeShift(5, { efectivo_contado: 0 }, cajero),
    ).rejects.toThrow(new ConflictException('Turno 5 ya está cerrado.'));
  });

  it('maps a withdrawal larger than the cash on hand to 400', async () => {
    vi.mocked(shiftsRepository.findById).mockResolvedValue(turno);
    vi.mocked(shiftsRepository.createMovimiento).mockRejectedValue(
      new InsufficientCashError('500.00', '600.00'),
    );

    await expect(
      shiftsService.createCashMovement(
        5,
        { tipo: 'Retiro', monto: 600, motivo: 'Depósito' },
        cajero,
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'No hay efectivo suficiente en caja. Hay 500.00 y se retiran 600.00.',
      ),
    );
  });

  it('builds the cut from the shift totals', async () => {
    vi.mocked(shiftsRepository.findById).mockResolvedValue(turno);
    vi.mocked(shiftsRepository.findTotales).mockResolvedValue({
      fondo_inicial: '500.00',
      ventas: [
        { metodo_pago: 'Efectivo', cantidad: 2, importe: '150.10' },
        { metodo_pago: 'Tarjeta', cantidad: 1, importe: '99.90' },
      ],
      entradas: '20.00',
      retiros: '100.00',
    });

    await expect(shiftsService.getShiftCorte(5, cajero)).resolves.toEqual({
      turno_id: 5,
      fondo_inicial: '500.00',
      ventas: [
        { metodo_pago: 'Efectivo', cantidad: 2, importe: '150.10' },
        { metodo_pago: 'Tarjeta', cantidad: 1, importe: '99.90' },
        { metodo_pago: 'Transferencia', cantidad: 0, importe: '0.00' },
      ],
      total_ventas: '250.00',
      entradas: '20.00',
      retiros: '100.00',
      efectivo_esperado: '570.10',
    });
  });
});
