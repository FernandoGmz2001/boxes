import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateProductDto } from '../dtos/create-product.dto.js';
import { ListProductsQueryDto } from '../dtos/list-products-query.dto.js';
import { UpdateProductDto } from '../dtos/update-product.dto.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import type { IProducto } from '../interfaces/producto.interface.js';
import { ProductsService } from '../services/products.service.js';

@Controller('productos')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAllProducts(
    @Query() query: ListProductsQueryDto,
  ): Promise<IPage<IProducto>> {
    return this.productsService.findAllProducts(query);
  }

  @Get(':id')
  async findProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IProducto> {
    return this.productsService.findProductById(id);
  }

  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<IProducto> {
    return this.productsService.createProduct(createProductDto);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<IProducto> {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IProducto> {
    return this.productsService.deleteProduct(id);
  }
}
