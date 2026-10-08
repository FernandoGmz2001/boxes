import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ICategoria } from '../interfaces/categoria.interface.js';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../interfaces/categories-repository.interface.js';
import { CategoriesService } from './categories.service.js';

const categoria: ICategoria = {
  id: 1,
  nombre: 'Empaques',
  color_ui: '#336699',
};

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;
  let categoriesRepository: ICategoriesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CATEGORIES_REPOSITORY,
          useValue: {
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            countProductos: vi.fn(),
            delete: vi.fn(),
          } satisfies ICategoriesRepository,
        },
      ],
    }).compile();

    categoriesService = module.get<CategoriesService>(CategoriesService);
    categoriesRepository = module.get<ICategoriesRepository>(
      CATEGORIES_REPOSITORY,
    );
  });

  it('creates a category', async () => {
    vi.mocked(categoriesRepository.create).mockResolvedValue(categoria);

    const result: ICategoria = await categoriesService.createCategory({
      nombre: 'Empaques',
      color_ui: '#336699',
    });

    expect(result).toEqual(categoria);
  });

  it('rejects deleting a category that still has products', async () => {
    vi.mocked(categoriesRepository.findById).mockResolvedValue(categoria);
    vi.mocked(categoriesRepository.countProductos).mockResolvedValue(2);

    await expect(categoriesService.deleteCategory(1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(categoriesRepository.delete).not.toHaveBeenCalled();
  });

  it('throws when the category does not exist', async () => {
    vi.mocked(categoriesRepository.findById).mockResolvedValue(null);

    await expect(categoriesService.findCategoryById(9)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
