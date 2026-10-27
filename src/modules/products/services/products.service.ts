import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { parseValidationErrors } from '../../../shared/errors/parse-validation-errors.js';
import { CreateProductDto } from '../dtos/create-product.dto.js';
import type { DeleteProductsDto } from '../dtos/delete-products.dto.js';
import type { ListProductsQueryDto } from '../dtos/list-products-query.dto.js';
import type { UpdateProductDto } from '../dtos/update-product.dto.js';
import type {
  UpdateProductItemDto,
  UpdateProductsDto,
} from '../dtos/update-products.dto.js';
import {
  resolvePagination,
  toPage,
  type IPage,
  type IPagination,
} from '../../../shared/pagination/paginated.interface.js';
import type {
  IImportProductosResult,
  IImportReferences,
  IImportReferencesQuery,
  ISpreadsheetUpload,
} from '../interfaces/import-productos.interface.js';
import type { IProducto } from '../interfaces/producto.interface.js';
import {
  PRODUCTS_REPOSITORY,
  type ICategoriaRef,
  type ICreateProducto,
  type IDeactivateManyProductosResult,
  type IProductsRepository,
  type IUpdateManyProductosResult,
  type IUpdateProducto,
  type IUpdateProductoItem,
} from '../interfaces/products-repository.interface.js';
import {
  buildProductsSpreadsheet,
  parseProductsSpreadsheet,
  MAX_IMPORT_FILE_BYTES,
  type IParsedProductRow,
  type IParsedProductsSheet,
} from '../spreadsheet/product-spreadsheet.js';

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
        busqueda: query.busqueda,
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

    return this.productsRepository.create(toCreateInput(createProductDto));
  }

  async buildProductsTemplate(): Promise<Buffer> {
    return buildProductsSpreadsheet();
  }

  async importProducts(
    file: ISpreadsheetUpload | undefined,
  ): Promise<IImportProductosResult> {
    const parsed: IParsedProductsSheet = await readUploadedSpreadsheet(file);
    const drafts: IImportDraft[] = parsed.rows.map((row: IParsedProductRow) =>
      validateImportRow(row),
    );
    const validDrafts: IValidImportDraft[] = drafts.filter(isValidDraft);
    const referenceErrors: Map<number, string[]> =
      validDrafts.length === 0
        ? new Map<number, string[]>()
        : await this.collectReferenceErrors(validDrafts);
    const errores: string[] = [];

    for (const draft of drafts) {
      for (const message of draft.errores) {
        errores.push(`Fila ${draft.fila}: ${message}`);
      }

      for (const message of referenceErrors.get(draft.fila) ?? []) {
        errores.push(`Fila ${draft.fila}: ${message}`);
      }
    }

    if (errores.length > 0) {
      throw new BadRequestException(errores);
    }

    const productos: IProducto[] = await this.productsRepository.createMany(
      validDrafts.map((draft: IValidImportDraft) => toCreateInput(draft.dto)),
    );

    return {
      creados: productos.length,
      productos,
    };
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

  async updateProducts(dto: UpdateProductsDto): Promise<IProducto[]> {
    const items: IUpdateProductoItem[] = dto.productos.map(
      (producto: UpdateProductItemDto) => {
        const changes: IUpdateProducto = toUpdateInput(producto);

        if (Object.keys(changes).length === 0) {
          throw new BadRequestException(
            `El producto ${producto.id} no incluye campos para actualizar.`,
          );
        }

        return { id: producto.id, ...changes };
      },
    );

    for (const producto of dto.productos) {
      if (producto.id_categoria !== undefined) {
        await this.assertCategoriaExists(producto.id_categoria);
      }
      await this.assertSatKeys(producto);
    }

    const result: IUpdateManyProductosResult =
      await this.productsRepository.updateMany(items);

    if (result.missingIds.length > 0) {
      throw new NotFoundException(missingProductsMessage(result.missingIds));
    }

    return result.productos;
  }

  async deleteProduct(id: number): Promise<IProducto> {
    const deactivated: IProducto | null =
      await this.productsRepository.deactivate(id);

    if (!deactivated) {
      throw new NotFoundException(`Producto ${id} no existe.`);
    }

    return deactivated;
  }

  async deleteProducts(dto: DeleteProductsDto): Promise<IProducto[]> {
    const result: IDeactivateManyProductosResult =
      await this.productsRepository.deactivateMany(dto.ids);

    if (result.missingIds.length > 0) {
      throw new NotFoundException(missingProductsMessage(result.missingIds));
    }

    return result.productos;
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
      const exists: boolean =
        await this.productsRepository.objetoImpuestoExists(dto.objeto_impuesto);

      if (!exists) {
        throw new NotFoundException(
          `El objeto de impuesto ${dto.objeto_impuesto} no existe en el catálogo.`,
        );
      }
    }
  }

  private async collectReferenceErrors(
    rows: IValidImportDraft[],
  ): Promise<Map<number, string[]>> {
    const query: IImportReferencesQuery = {
      categoriaIds: uniqueNumbers(
        rows.map((row: IValidImportDraft) => row.dto.id_categoria),
      ),
      clavesProductoServicio: uniqueStrings(
        rows.flatMap((row: IValidImportDraft) =>
          row.dto.clave_producto_servicio
            ? [row.dto.clave_producto_servicio]
            : [],
        ),
      ),
      clavesUnidad: uniqueStrings(
        rows.flatMap((row: IValidImportDraft) =>
          row.dto.clave_unidad_medida ? [row.dto.clave_unidad_medida] : [],
        ),
      ),
      objetosImpuesto: uniqueStrings(
        rows.flatMap((row: IValidImportDraft) =>
          row.dto.objeto_impuesto ? [row.dto.objeto_impuesto] : [],
        ),
      ),
      impuestoPresetIds: uniqueNumbers(
        rows.flatMap(
          (row: IValidImportDraft) => row.dto.impuesto_preset_ids ?? [],
        ),
      ),
    };
    const found: IImportReferences =
      await this.productsRepository.findImportReferences(query);
    const categorias: Set<number> = new Set(found.categoriaIds);
    const clavesProducto: Set<string> = new Set(found.clavesProductoServicio);
    const clavesUnidad: Set<string> = new Set(found.clavesUnidad);
    const objetos: Set<string> = new Set(found.objetosImpuesto);
    const presets: Set<number> = new Set(found.impuestoPresetIds);
    const errors: Map<number, string[]> = new Map();

    for (const row of rows) {
      const messages: string[] = [];

      if (!categorias.has(row.dto.id_categoria)) {
        messages.push(`Categoría ${row.dto.id_categoria} no existe.`);
      }

      if (
        row.dto.clave_producto_servicio &&
        !clavesProducto.has(row.dto.clave_producto_servicio)
      ) {
        messages.push(
          `La clave de producto o servicio ${row.dto.clave_producto_servicio} no existe en el catálogo.`,
        );
      }

      if (
        row.dto.clave_unidad_medida &&
        !clavesUnidad.has(row.dto.clave_unidad_medida)
      ) {
        messages.push(
          `La clave de unidad ${row.dto.clave_unidad_medida} no existe en el catálogo.`,
        );
      }

      if (row.dto.objeto_impuesto && !objetos.has(row.dto.objeto_impuesto)) {
        messages.push(
          `El objeto de impuesto ${row.dto.objeto_impuesto} no existe en el catálogo.`,
        );
      }

      for (const impuestoId of row.dto.impuesto_preset_ids ?? []) {
        if (!presets.has(impuestoId)) {
          messages.push(`El impuesto ${impuestoId} no existe.`);
        }
      }

      if (messages.length > 0) {
        errors.set(row.fila, messages);
      }
    }

    return errors;
  }

  private async assertCategoriaExists(idCategoria: number): Promise<void> {
    const categoria: ICategoriaRef | null =
      await this.productsRepository.findCategoriaById(idCategoria);

    if (!categoria) {
      throw new NotFoundException(`Categoría ${idCategoria} no existe.`);
    }
  }
}

interface IImportDraft {
  fila: number;
  errores: string[];
  dto?: CreateProductDto;
}

interface IValidImportDraft {
  fila: number;
  errores: string[];
  dto: CreateProductDto;
}

async function readUploadedSpreadsheet(
  file: ISpreadsheetUpload | undefined,
): Promise<IParsedProductsSheet> {
  if (!file) {
    throw new BadRequestException(
      'Debes enviar un archivo Excel en el campo archivo.',
    );
  }

  if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
    throw new BadRequestException('El archivo debe ser un Excel .xlsx.');
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new BadRequestException(
      'El archivo supera el tamaño máximo de 2 MB.',
    );
  }

  try {
    const parsed: IParsedProductsSheet = await parseProductsSpreadsheet(
      file.buffer,
    );

    if (parsed.errores.length > 0) {
      throw new BadRequestException(parsed.errores);
    }

    return parsed;
  } catch (error: unknown) {
    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new BadRequestException('El archivo no es un Excel válido (.xlsx).');
  }
}

function validateImportRow(row: IParsedProductRow): IImportDraft {
  const dto: CreateProductDto = plainToInstance(CreateProductDto, row.values);
  const errors: ValidationError[] = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    return {
      fila: row.fila,
      errores: parseValidationErrors(errors),
    };
  }

  return {
    fila: row.fila,
    errores: [],
    dto,
  };
}

function isValidDraft(draft: IImportDraft): draft is IValidImportDraft {
  return draft.dto !== undefined;
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function missingProductsMessage(ids: number[]): string {
  if (ids.length === 1) {
    return `Producto ${ids[0]} no existe.`;
  }

  return `Productos ${ids.join(', ')} no existen.`;
}

function toMoney(amount: number): string {
  return amount.toFixed(2);
}

function toCreateInput(dto: CreateProductDto): ICreateProducto {
  return {
    nombre_producto: dto.nombre_producto,
    imagen_url: dto.imagen_url,
    cantidad_en_existencia: dto.cantidad_en_existencia,
    stock_minimo: dto.stock_minimo,
    sku: dto.sku,
    codigo_barras: dto.codigo_barras,
    precio_venta: toMoney(dto.precio_venta),
    costo_compra: toMoney(dto.costo_compra),
    es_servicio: dto.es_servicio,
    activo: dto.activo ?? true,
    id_categoria: dto.id_categoria,
    clave_producto_servicio: dto.clave_producto_servicio,
    clave_unidad_medida: dto.clave_unidad_medida,
    objeto_impuesto: dto.objeto_impuesto,
    impuesto_preset_ids: dto.impuesto_preset_ids ?? [],
  };
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
