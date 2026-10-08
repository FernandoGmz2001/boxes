import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProductDto } from '../dtos/create-product.dto.js';
import type { ListProductsQueryDto } from '../dtos/list-products-query.dto.js';
import type { UpdateProductDto } from '../dtos/update-product.dto.js';
import {
  resolvePagination,
  toPage,
  type IPage,
  type IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type { IProducto } from '../interfaces/producto.interface.js';
import {
  PRODUCTS_REPOSITORY,
  type ICategoriaRef,
  type ICreateProducto,
  type IProductsRepository,
  type IUpdateProducto,
} from '../interfaces/products-repository.interface.js';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
  ) {}

  async findAllProducts(
    query: ListProductsQueryDto,
  ): Promise<IPage<IProducto>> {
    const pagination: IPagination = resolvePagination(query);

    return toPage(
      await this.productsRepository.findAll({
        activo: query.activo,
        pagina: pagination.pagina,
        limite: pagination.limite,
      }),
      pagination,
    );
  }

  async findProductById(id: number): Promise<IProducto> {
    const producto: IProducto | null =
      await this.productsRepository.findById(id);

    if (!producto) {
      throw new NotFoundException(`Producto ${id} no existe.`);
    }

    return producto;
  }

  async createProduct(createProductDto: CreateProductDto): Promise<IProducto> {
    await this.assertCategoriaExists(createProductDto.id_categoria);
    await this.assertSatKeys(createProductDto);

    const input: ICreateProducto = {
      nombre_producto: createProductDto.nombre_producto,
      imagen_url: createProductDto.imagen_url,
      cantidad_en_existencia: createProductDto.cantidad_en_existencia,
      stock_minimo: createProductDto.stock_minimo,
      sku: createProductDto.sku,
      codigo_barras: createProductDto.codigo_barras,
      precio_venta: toMoney(createProductDto.precio_venta),
      costo_compra: toMoney(createProductDto.costo_compra),
      es_servicio: createProductDto.es_servicio,
      activo: createProductDto.activo ?? true,
      id_categoria: createProductDto.id_categoria,
      clave_producto_servicio: createProductDto.clave_producto_servicio,
      clave_unidad_medida: createProductDto.clave_unidad_medida,
      objeto_impuesto: createProductDto.objeto_impuesto,
      impuesto_preset_ids: createProductDto.impuesto_preset_ids ?? [],
    };

    return this.productsRepository.create(input);
  }

  async updateProduct(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<IProducto> {
    if (updateProductDto.id_categoria !== undefined) {
      await this.assertCategoriaExists(updateProductDto.id_categoria);
    }
    await this.assertSatKeys(updateProductDto);

    const updated: IProducto | null = await this.productsRepository.update(
      id,
      toUpdateInput(updateProductDto),
    );

    if (!updated) {
      throw new NotFoundException(`Producto ${id} no existe.`);
    }

    return updated;
  }

  async deleteProduct(id: number): Promise<IProducto> {
    const deactivated: IProducto | null =
      await this.productsRepository.deactivate(id);

    if (!deactivated) {
      throw new NotFoundException(`Producto ${id} no existe.`);
    }

    return deactivated;
  }

  private async assertSatKeys(dto: {
    clave_producto_servicio?: string | null;
    clave_unidad_medida?: string | null;
    objeto_impuesto?: string | null;
  }): Promise<void> {
    if (dto.clave_producto_servicio) {
      const exists: boolean =
        await this.productsRepository.claveProductoServicioExists(
          dto.clave_producto_servicio,
        );

      if (!exists) {
        throw new NotFoundException(
          `La clave de producto o servicio ${dto.clave_producto_servicio} no existe en el catálogo.`,
        );
      }
    }

    if (dto.clave_unidad_medida) {
      const exists: boolean = await this.productsRepository.claveUnidadExists(
        dto.clave_unidad_medida,
      );

      if (!exists) {
        throw new NotFoundException(
          `La clave de unidad ${dto.clave_unidad_medida} no existe en el catálogo.`,
        );
      }
    }

    if (dto.objeto_impuesto) {
      const exists: boolean = await this.productsRepository.objetoImpuestoExists(
        dto.objeto_impuesto,
      );

      if (!exists) {
        throw new NotFoundException(
          `El objeto de impuesto ${dto.objeto_impuesto} no existe en el catálogo.`,
        );
      }
    }
  }

  private async assertCategoriaExists(idCategoria: number): Promise<void> {
    const categoria: ICategoriaRef | null =
      await this.productsRepository.findCategoriaById(idCategoria);

    if (!categoria) {
      throw new NotFoundException(`Categoría ${idCategoria} no existe.`);
    }
  }
}

function toMoney(amount: number): string {
  return amount.toFixed(2);
}

function toUpdateInput(dto: UpdateProductDto): IUpdateProducto {
  const input: IUpdateProducto = {};

  if (dto.nombre_producto !== undefined) {
    input.nombre_producto = dto.nombre_producto;
  }
  if (dto.imagen_url !== undefined) {
    input.imagen_url = dto.imagen_url;
  }
  if (dto.stock_minimo !== undefined) {
    input.stock_minimo = dto.stock_minimo;
  }
  if (dto.sku !== undefined) {
    input.sku = dto.sku;
  }
  if (dto.codigo_barras !== undefined) {
    input.codigo_barras = dto.codigo_barras;
  }
  if (dto.precio_venta !== undefined) {
    input.precio_venta = toMoney(dto.precio_venta);
  }
  if (dto.costo_compra !== undefined) {
    input.costo_compra = toMoney(dto.costo_compra);
  }
  if (dto.es_servicio !== undefined) {
    input.es_servicio = dto.es_servicio;
  }
  if (dto.activo !== undefined) {
    input.activo = dto.activo;
  }
  if (dto.id_categoria !== undefined) {
    input.id_categoria = dto.id_categoria;
  }
  if (dto.clave_producto_servicio !== undefined) {
    input.clave_producto_servicio = dto.clave_producto_servicio;
  }
  if (dto.clave_unidad_medida !== undefined) {
    input.clave_unidad_medida = dto.clave_unidad_medida;
  }
  if (dto.objeto_impuesto !== undefined) {
    input.objeto_impuesto = dto.objeto_impuesto;
  }
  if (dto.impuesto_preset_ids !== undefined) {
    input.impuesto_preset_ids = dto.impuesto_preset_ids;
  }

  return input;
}
