import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateCategoryDto } from '../dtos/create-category.dto.js';
import type { ListCategoriesQueryDto } from '../dtos/list-categories-query.dto.js';
import type { UpdateCategoryDto } from '../dtos/update-category.dto.js';
import {
  resolvePagination,
  toPage,
  type IPage,
  type IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { ICategoria } from '../interfaces/categoria.interface.js';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
  type IUpdateCategoria,
} from '../interfaces/categories-repository.interface.js';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,
  ) {}

  async findAllCategories(
    query: ListCategoriesQueryDto,
  ): Promise<IPage<ICategoria>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.categoriesRepository.findAll(pagination),
      pagination,
    );
  }

  async findCategoryById(id: number): Promise<ICategoria> {
    const categoria: ICategoria | null =
      await this.categoriesRepository.findById(id);

    if (!categoria) {
      throw new NotFoundException(`Categoría ${id} no existe.`);
    }

    return categoria;
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<ICategoria> {
    return this.categoriesRepository.create({
      nombre: createCategoryDto.nombre,
      color_ui: createCategoryDto.color_ui,
    });
  }

  async updateCategory(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<ICategoria> {
    const input: IUpdateCategoria = {};

    if (updateCategoryDto.nombre !== undefined) {
      input.nombre = updateCategoryDto.nombre;
    }
    if (updateCategoryDto.color_ui !== undefined) {
      input.color_ui = updateCategoryDto.color_ui;
    }

    const updated: ICategoria | null = await this.categoriesRepository.update(
      id,
      input,
    );

    if (!updated) {
      throw new NotFoundException(`Categoría ${id} no existe.`);
    }

    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    const categoria: ICategoria | null =
      await this.categoriesRepository.findById(id);

    if (!categoria) {
      throw new NotFoundException(`Categoría ${id} no existe.`);
    }

    const productos: number = await this.categoriesRepository.countProductos(id);

    if (productos > 0) {
      throw new ConflictException(
        `Categoría ${id} tiene productos y no se puede borrar.`,
      );
    }

    await this.categoriesRepository.delete(id);
  }
}
