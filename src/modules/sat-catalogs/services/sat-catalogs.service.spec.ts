import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IClaveProdServ } from '../interfaces/sat-catalog.interface.js';
import {
  SAT_CATALOGS_REPOSITORY,
  type ISatCatalogsRepository,
} from '../interfaces/sat-catalogs-repository.interface.js';
import { SatCatalogsService } from './sat-catalogs.service.js';

const clave: IClaveProdServ = {
  clave: '01010101',
  descripcion: 'No existe en el catálogo',
  incluir_iva_trasladado: 'Opcional',
  incluir_ieps_trasladado: 'Opcional',
  fecha_inicio_vigencia: '2022-01-01',
  fecha_fin_vigencia: null,
};

describe('SatCatalogsService', () => {
  let satCatalogsService: SatCatalogsService;
  let satCatalogsRepository: ISatCatalogsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SatCatalogsService,
        {
          provide: SAT_CATALOGS_REPOSITORY,
          useValue: {
            findAllClavesProdServ: vi.fn(),
            findClaveProdServ: vi.fn(),
            findAllClavesUnidad: vi.fn(),
            findClaveUnidad: vi.fn(),
            findAllObjetosImp: vi.fn(),
            findObjetoImp: vi.fn(),
          } satisfies ISatCatalogsRepository,
        },
      ],
    }).compile();

    satCatalogsService = module.get<SatCatalogsService>(SatCatalogsService);
    satCatalogsRepository = module.get<ISatCatalogsRepository>(
      SAT_CATALOGS_REPOSITORY,
    );
  });

  it('returns a product service key', async () => {
    vi.mocked(satCatalogsRepository.findClaveProdServ).mockResolvedValue(
      clave,
    );

    const result: IClaveProdServ =
      await satCatalogsService.findClaveProdServ('01010101');

    expect(result).toEqual(clave);
  });

  it('throws when the product service key does not exist', async () => {
    vi.mocked(satCatalogsRepository.findClaveProdServ).mockResolvedValue(null);

    await expect(
      satCatalogsService.findClaveProdServ('99999999'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
