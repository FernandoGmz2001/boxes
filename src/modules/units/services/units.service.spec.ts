import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type {
  IPage,
  IPageResult,
} from '../../../shared/pagination/paginated.interface.js';
import type { IUnidad } from '../interfaces/unidad.interface.js';
import {
  UNITS_REPOSITORY,
  type IUnitsRepository,
} from '../interfaces/units-repository.interface.js';
import { UnitsService } from './units.service.js';

const unidad: IUnidad = {
  id: 1,
  nombre: 'Unidad',
  simbolo: 'pza',
};

describe('UnitsService', () => {
  let unitsService: UnitsService;
  let unitsRepository: IUnitsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        {
          provide: UNITS_REPOSITORY,
          useValue: {
            findAll: vi.fn(),
            findById: vi.fn(),
          } satisfies IUnitsRepository,
        },
      ],
    }).compile();

    unitsService = module.get<UnitsService>(UnitsService);
    unitsRepository = module.get<IUnitsRepository>(UNITS_REPOSITORY);
  });

  it('lists units with the default page', async () => {
    const page: IPageResult<IUnidad> = { items: [unidad], total: 10 };
    vi.mocked(unitsRepository.findAll).mockResolvedValue(page);

    const result: IPage<IUnidad> = await unitsService.findAllUnits({});

    expect(result.data).toEqual([unidad]);
    expect(result.total).toBe(10);
    expect(unitsRepository.findAll).toHaveBeenCalledWith({
      pagina: 1,
      limite: 20,
    });
  });

  it('throws when the unit does not exist', async () => {
    vi.mocked(unitsRepository.findById).mockResolvedValue(null);

    await expect(unitsService.findUnitById(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
