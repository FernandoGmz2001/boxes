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
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import { CreateProductTaxDto } from '../dtos/create-product-tax.dto.js';
import { ListProductTaxesQueryDto } from '../dtos/list-product-taxes-query.dto.js';
import { UpdateProductTaxDto } from '../dtos/update-product-tax.dto.js';
import type { IProductoImpuesto } from '../interfaces/producto-impuesto.interface.js';
import { ProductTaxesService } from '../services/product-taxes.service.js';

@RequirePermissions('productos')
@Controller('productos/:productoId/impuestos')
export class ProductTaxesController {
  constructor(private readonly productTaxesService: ProductTaxesService) {}

  @Get()
  async findAllProductTaxes(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Query() query: ListProductTaxesQueryDto,
  ): Promise<IPage<IProductoImpuesto>> {
    return this.productTaxesService.findAllProductTaxes(productoId, query);
  }

  @Get(':id')
  async findProductTaxById(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IProductoImpuesto> {
    return this.productTaxesService.findProductTaxById(productoId, id);
  }

  @Post()
  async createProductTax(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Body() createProductTaxDto: CreateProductTaxDto,
  ): Promise<IProductoImpuesto> {
    return this.productTaxesService.createProductTax(
      productoId,
      createProductTaxDto,
    );
  }

  @Patch(':id')
  async updateProductTax(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductTaxDto: UpdateProductTaxDto,
  ): Promise<IProductoImpuesto> {
    return this.productTaxesService.updateProductTax(
      productoId,
      id,
      updateProductTaxDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProductTax(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.productTaxesService.deleteProductTax(productoId, id);
  }
}
