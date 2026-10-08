import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IProductoImpuesto } from '../interfaces/producto-impuesto.interface.js';
import {
  PRODUCT_TAXES_REPOSITORY,
  type IProductTaxesRepository,
} from '../interfaces/product-taxes-repository.interface.js';
import { ProductTaxesService } from './product-taxes.service.js';

const impuesto: IProductoImpuesto = {
  id: 4,
  producto_id: 1,
  impuesto_preset_id: 3,
};

describe('ProductTaxesService', () => {
  let productTaxesService: ProductTaxesService;
  let productTaxesRepository: IProductTaxesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductTaxesService,
        {
          provide: PRODUCT_TAXES_REPOSITORY,
          useValue: {
            productExists: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
            findByPreset: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
          } satisfies IProductTaxesRepository,
        },
      ],
    }).compile();

    productTaxesService = module.get<ProductTaxesService>(ProductTaxesService);
    productTaxesRepository = module.get<IProductTaxesRepository>(
      PRODUCT_TAXES_REPOSITORY,
    );
  });

  it('creates a tax when the product exists and the preset is free', async () => {
    vi.mocked(productTaxesRepository.productExists).mockResolvedValue(true);
    vi.mocked(productTaxesRepository.findByPreset).mockResolvedValue(null);
    vi.mocked(productTaxesRepository.create).mockResolvedValue(impuesto);

    const result: IProductoImpuesto =
      await productTaxesService.createProductTax(1, {
        impuesto_preset_id: 3,
      });

    expect(result).toEqual(impuesto);
  });

  it('rejects a preset that is already assigned', async () => {
    vi.mocked(productTaxesRepository.productExists).mockResolvedValue(true);
    vi.mocked(productTaxesRepository.findByPreset).mockResolvedValue(impuesto);

    await expect(
      productTaxesService.createProductTax(1, { impuesto_preset_id: 3 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(productTaxesRepository.create).not.toHaveBeenCalled();
  });

  it('throws when the product does not exist', async () => {
    vi.mocked(productTaxesRepository.productExists).mockResolvedValue(false);

    await expect(
      productTaxesService.findProductTaxById(9, 4),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
