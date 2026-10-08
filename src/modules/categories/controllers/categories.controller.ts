import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateCategoryDto } from '../dtos/create-category.dto.js';
import { ListCategoriesQueryDto } from '../dtos/list-categories-query.dto.js';
import { UpdateCategoryDto } from '../dtos/update-category.dto.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import type { ICategoria } from '../interfaces/categoria.interface.js';
import { CategoriesService } from '../services/categories.service.js';

@Controller('categorias')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAllCategories(
    @Query() query: ListCategoriesQueryDto,
  ): Promise<IPage<ICategoria>> {
    return this.categoriesService.findAllCategories(query);
  }

  @Get(':id')
  async findCategoryById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ICategoria> {
    return this.categoriesService.findCategoryById(id);
  }

  @Post()
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ICategoria> {
    return this.categoriesService.createCategory(createCategoryDto);
  }

  @Patch(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ICategoria> {
    return this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.deleteCategory(id);
  }
}
