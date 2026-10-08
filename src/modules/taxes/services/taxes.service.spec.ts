import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type {
  IPage,
  IPageResult,
} from '../../../shared/pagination/paginated.interface.js';
import type { IImpuesto } from '../interfaces/impuesto.interface.js';
import {
  TAXES_REPOSITORY,
  type ITaxesRepository,
} from '../interfaces/taxes-repository.interface.js';
import { TaxesService } from './taxes.service.js';

const impuesto: IImpuesto = {
  id: 2,
  clave_impuesto: '002',
  impuesto: 'IVA',
  factor: 'Tasa',
  rango_o_fijo: 'Fijo',
  valor_minimo: null,
  valor_maximo: '0.160000',
  traslado: true,
  retencion: false,
  fecha_inicio_vigencia: '2022-01-01',
  fecha_fin_vigencia: null,
};

describe('TaxesService', () => {
  let taxesService: TaxesService;
  let taxesRepository: ITaxesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxesService,
        {
          provide: TAXES_REPOSITORY,
          useValue: {
            findAll: vi.fn(),
            findById: vi.fn(),
          } satisfies ITaxesRepository,
        },
      ],
    }).compile();

    taxesService = module.get<TaxesService>(TaxesService);
    taxesRepository = module.get<ITaxesRepository>(TAXES_REPOSITORY);
  });

  it('lists taxes with the default page', async () => {
    const page: IPageResult<IImpuesto> = { items: [impuesto], total: 19 };
    vi.mocked(taxesRepository.findAll).mockResolvedValue(page);

    const result: IPage<IImpuesto> = await taxesService.findAllTaxes({});

    expect(result.data).toEqual([impuesto]);
    expect(result.total).toBe(19);
    expect(taxesRepository.findAll).toHaveBeenCalledWith({
      pagina: 1,
      limite: 20,
    });
  });

  it('throws when the tax does not exist', async () => {
    vi.mocked(taxesRepository.findById).mockResolvedValue(null);

    await expect(taxesService.findTaxById(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
