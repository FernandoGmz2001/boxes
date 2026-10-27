import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import { CreateProductDto } from '../dtos/create-product.dto.js';
import { DeleteProductsDto } from '../dtos/delete-products.dto.js';
import { ListProductsQueryDto } from '../dtos/list-products-query.dto.js';
import { UpdateProductDto } from '../dtos/update-product.dto.js';
import { UpdateProductsDto } from '../dtos/update-products.dto.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import type {
  IImportProductosResult,
  ISpreadsheetUpload,
} from '../interfaces/import-productos.interface.js';
import type { IProducto } from '../interfaces/producto.interface.js';
import { ProductsService } from '../services/products.service.js';
import {
  MAX_IMPORT_FILE_BYTES,
  PRODUCTS_TEMPLATE_FILENAME,
  SPREADSHEET_CONTENT_TYPE,
} from '../spreadsheet/product-spreadsheet.js';

@RequirePermissions('productos')
@Controller('productos')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('plantilla')
  @Header('Content-Type', SPREADSHEET_CONTENT_TYPE)
  @Header(
    'Content-Disposition',
    `attachment; filename="${PRODUCTS_TEMPLATE_FILENAME}"`,
  )
  async downloadProductsTemplate(): Promise<StreamableFile> {
    const file: Buffer = await this.productsService.buildProductsTemplate();

    return new StreamableFile(file);
  }

  /** Movimientos y el punto de venta también consultan el catálogo de productos. */
  @RequirePermissions('productos', 'movimientos', 'ventas')
  @Get()
  async findAllProducts(
    @Query() query: ListProductsQueryDto,
  ): Promise<IPage<IProducto>> {
    return this.productsService.findAllProducts(query);
  }

  @RequirePermissions('productos', 'movimientos', 'ventas')
  @Get(':id')
  async findProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IProducto> {
    return this.productsService.findProductById(id);
  }

  @Post('importacion')
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: MAX_IMPORT_FILE_BYTES },
    }),
  )
  async importProducts(
    @UploadedFile() file: ISpreadsheetUpload | undefined,
  ): Promise<IImportProductosResult> {
    return this.productsService.importProducts(file);
  }

  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<IProducto> {
    return this.productsService.createProduct(createProductDto);
  }

  @Patch()
  async updateProducts(
    @Body() updateProductsDto: UpdateProductsDto,
  ): Promise<IProducto[]> {
    return this.productsService.updateProducts(updateProductsDto);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<IProducto> {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete()
  async deleteProducts(
    @Body() deleteProductsDto: DeleteProductsDto,
  ): Promise<IProducto[]> {
    return this.productsService.deleteProducts(deleteProductsDto);
  }

  @Delete(':id')
  async deleteProduct(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IProducto> {
    return this.productsService.deleteProduct(id);
  }
}
