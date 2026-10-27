import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ICaja } from '../interfaces/caja.interface.js';
import {
  CASH_REGISTERS_REPOSITORY,
  type ICashRegistersRepository,
} from '../interfaces/cash-registers-repository.interface.js';
import { CashRegistersService } from './cash-registers.service.js';

const caja: ICaja = { id: 1, nombre: 'Caja 1', activa: true };

describe('CashRegistersService', () => {
  let cashRegistersService: CashRegistersService;
  let cashRegistersRepository: ICashRegistersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashRegistersService,
        {
          provide: CASH_REGISTERS_REPOSITORY,
          useValue: {
            findAll: vi.fn(),
            findById: vi.fn(),
            findByNombre: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            hasTurnoAbierto: vi.fn(),
          } satisfies ICashRegistersRepository,
        },
      ],
    }).compile();

    cashRegistersService =
      module.get<CashRegistersService>(CashRegistersService);
    cashRegistersRepository = module.get<ICashRegistersRepository>(
      CASH_REGISTERS_REPOSITORY,
    );
  });

  it('creates an active cash register by default', async () => {
    vi.mocked(cashRegistersRepository.findByNombre).mockResolvedValue(null);
    vi.mocked(cashRegistersRepository.create).mockResolvedValue(caja);

    await expect(
      cashRegistersService.createCashRegister({ nombre: 'Caja 1' }),
    ).resolves.toEqual(caja);
    expect(cashRegistersRepository.create).toHaveBeenCalledWith({
      nombre: 'Caja 1',
      activa: true,
    });
  });

  it('rejects a duplicated name', async () => {
    vi.mocked(cashRegistersRepository.findByNombre).mockResolvedValue(caja);

    await expect(
      cashRegistersService.createCashRegister({ nombre: 'Caja 1' }),
    ).rejects.toThrow(new ConflictException('La caja Caja 1 ya existe.'));
    expect(cashRegistersRepository.create).not.toHaveBeenCalled();
  });

  it('allows keeping its own name on update', async () => {
    vi.mocked(cashRegistersRepository.findById).mockResolvedValue(caja);
    vi.mocked(cashRegistersRepository.findByNombre).mockResolvedValue(caja);
    vi.mocked(cashRegistersRepository.update).mockResolvedValue(caja);

    await expect(
      cashRegistersService.updateCashRegister(1, { nombre: 'Caja 1' }),
    ).resolves.toEqual(caja);
  });

  it('refuses to deactivate a cash register with an open shift', async () => {
    vi.mocked(cashRegistersRepository.findById).mockResolvedValue(caja);
    vi.mocked(cashRegistersRepository.hasTurnoAbierto).mockResolvedValue(true);

    await expect(
      cashRegistersService.updateCashRegister(1, { activa: false }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(cashRegistersRepository.update).not.toHaveBeenCalled();
  });

  it('throws when the cash register does not exist', async () => {
    vi.mocked(cashRegistersRepository.findById).mockResolvedValue(null);

    await expect(cashRegistersService.findCashRegisterById(9)).rejects.toThrow(
      new NotFoundException('Caja 9 no existe.'),
    );
  });
});
