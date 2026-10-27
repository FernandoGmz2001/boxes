import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { CreateProductDto } from '../dtos/create-product.dto.js';
import type { ISpreadsheetUpload } from '../interfaces/import-productos.interface.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import type { IProducto } from '../interfaces/producto.interface.js';
import {
  PRODUCTS_REPOSITORY,
  type IProductsRepository,
} from '../interfaces/products-repository.interface.js';
import {
  buildProductsSpreadsheet,
  type ProductSpreadsheetRow,
} from '../spreadsheet/product-spreadsheet.js';
import { ProductsService } from './products.service.js';

const createProductDto: CreateProductDto = {
  nombre_producto: 'Caja mediana',
  cantidad_en_existencia: 10,
  stock_minimo: 2,
  precio_venta: 199.5,
  costo_compra: 80,
  es_servicio: false,
  id_categoria: 1,
  codigo_barras: '7501234567890',
  impuesto_preset_ids: [1, 1, 2],
};

const createdProduct: IProducto = {
  id: 1,
  nombre_producto: 'Caja mediana',
  imagen_url: null,
  cantidad_en_existencia: 10,
  stock_minimo: 2,
  sku: null,
  codigo_barras: '7501234567890',
  precio_venta: '199.50',
  costo_compra: '80.00',
  es_servicio: false,
  activo: true,
  id_categoria: 1,
  clave_producto_servicio: null,
  clave_unidad_medida: null,
  objeto_impuesto: null,
  created_at: new Date('2026-10-07T00:00:00.000Z'),
  updated_at: new Date('2026-10-07T00:00:00.000Z'),
  impuestos: [1, 2],
};

describe('ProductsService', () => {
  let productsService: ProductsService;
  let productsRepository: IProductsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PRODUCTS_REPOSITORY,
          useValue: {
            findCategoriaById: vi.fn(),
            claveProductoServicioExists: vi.fn(),
            claveUnidadExists: vi.fn(),
            objetoImpuestoExists: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            createMany: vi.fn(),
            findImportReferences: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            deactivate: vi.fn(),
            deactivateMany: vi.fn(),
          } satisfies IProductsRepository,
        },
      ],
    }).compile();

    productsService = module.get<ProductsService>(ProductsService);
    productsRepository = module.get<IProductsRepository>(PRODUCTS_REPOSITORY);
  });

  it('creates a product when the category exists', async () => {
    vi.mocked(productsRepository.findCategoriaById).mockResolvedValue({
      id: 1,
    });
    vi.mocked(productsRepository.create).mockResolvedValue(createdProduct);

    const result: IProducto =
      await productsService.createProduct(createProductDto);

    expect(result).toEqual(createdProduct);
    expect(productsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_producto: 'Caja mediana',
        codigo_barras: '7501234567890',
        precio_venta: '199.50',
        costo_compra: '80.00',
        activo: true,
        impuesto_preset_ids: [1, 1, 2],
      }),
    );
  });

  it('throws when the product service key is not in the catalog', async () => {
    vi.mocked(productsRepository.findCategoriaById).mockResolvedValue({
      id: 1,
    });
    vi.mocked(productsRepository.claveProductoServicioExists).mockResolvedValue(
      false,
    );

    await expect(
      productsService.createProduct({
        ...createProductDto,
        clave_producto_servicio: '99999999',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(productsRepository.create).not.toHaveBeenCalled();
  });

  it('throws when the category does not exist', async () => {
    vi.mocked(productsRepository.findCategoriaById).mockResolvedValue(null);

    await expect(
      productsService.createProduct(createProductDto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(productsRepository.create).not.toHaveBeenCalled();
  });

  it('returns the product list from the repository', async () => {
    vi.mocked(productsRepository.findAll).mockResolvedValue({
      items: [createdProduct],
      total: 1,
    });

    const result: IPage<IProducto> = await productsService.findAllProducts({
      busqueda: 'caja',
      activo: true,
      pagina: 1,
      limite: 20,
    });

    expect(result).toEqual({
      data: [createdProduct],
      pagina: 1,
      limite: 20,
      total: 1,
      total_paginas: 1,
    });
    expect(productsRepository.findAll).toHaveBeenCalledWith({
      busqueda: 'caja',
      activo: true,
      pagina: 1,
      limite: 20,
    });
  });

  it('throws when the product does not exist', async () => {
    vi.mocked(productsRepository.findById).mockResolvedValue(null);

    await expect(productsService.findProductById(9)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates a product and converts prices', async () => {
    vi.mocked(productsRepository.findCategoriaById).mockResolvedValue({
      id: 2,
    });
    vi.mocked(productsRepository.update).mockResolvedValue(createdProduct);

    await productsService.updateProduct(1, {
      nombre_producto: 'Caja grande',
      precio_venta: 10,
      id_categoria: 2,
    });

    expect(productsRepository.update).toHaveBeenCalledWith(1, {
      nombre_producto: 'Caja grande',
      precio_venta: '10.00',
      id_categoria: 2,
    });
  });

  it('updates several products and converts prices', async () => {
    vi.mocked(productsRepository.findCategoriaById).mockResolvedValue({
      id: 2,
    });
    vi.mocked(productsRepository.updateMany).mockResolvedValue({
      missingIds: [],
      productos: [createdProduct, { ...createdProduct, id: 2 }],
    });

    const result: IProducto[] = await productsService.updateProducts({
      productos: [
        { id: 1, precio_venta: 10, id_categoria: 2 },
        { id: 2, nombre_producto: 'Caja chica' },
      ],
    });

    expect(productsRepository.updateMany).toHaveBeenCalledWith([
      { id: 1, precio_venta: '10.00', id_categoria: 2 },
      { id: 2, nombre_producto: 'Caja chica' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('does not update the batch when a product does not exist', async () => {
    vi.mocked(productsRepository.updateMany).mockResolvedValue({
      missingIds: [9],
      productos: [],
    });

    await expect(
      productsService.updateProducts({
        productos: [{ id: 9, nombre_producto: 'Nadie' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not update the batch when a category does not exist', async () => {
    vi.mocked(productsRepository.findCategoriaById).mockResolvedValue(null);

    await expect(
      productsService.updateProducts({
        productos: [{ id: 1, id_categoria: 9 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(productsRepository.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a batch item without fields to update', async () => {
    await expect(
      productsService.updateProducts({
        productos: [{ id: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(productsRepository.updateMany).not.toHaveBeenCalled();
  });

  it('imports every row when the spreadsheet is valid', async () => {
    vi.mocked(productsRepository.findImportReferences).mockResolvedValue({
      categoriaIds: [1],
      clavesProductoServicio: ['01010101'],
      clavesUnidad: [],
      objetosImpuesto: ['02'],
      impuestoPresetIds: [3],
    });
    vi.mocked(productsRepository.createMany).mockResolvedValue([
      createdProduct,
    ]);

    const result = await productsService.importProducts(
      await spreadsheetUpload([
        {
          nombre_producto: 'Caja importada',
          cantidad_en_existencia: 4,
          stock_minimo: 1,
          precio_venta: 15.5,
          costo_compra: 4,
          es_servicio: 'sí',
          id_categoria: 1,
          clave_producto_servicio: 1010101,
          objeto_impuesto: 2,
          impuesto_preset_ids: '3',
        },
      ]),
    );

    expect(result.creados).toBe(1);
    expect(productsRepository.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        nombre_producto: 'Caja importada',
        es_servicio: true,
        activo: true,
        precio_venta: '15.50',
        costo_compra: '4.00',
        clave_producto_servicio: '01010101',
        objeto_impuesto: '02',
        impuesto_preset_ids: [3],
      }),
    ]);
  });

  it('does not create products when a row is invalid', async () => {
    vi.mocked(productsRepository.findImportReferences).mockResolvedValue({
      categoriaIds: [1],
      clavesProductoServicio: [],
      clavesUnidad: [],
      objetosImpuesto: [],
      impuestoPresetIds: [],
    });
    const file: ISpreadsheetUpload = await spreadsheetUpload([
      {
        nombre_producto: 'Caja válida',
        cantidad_en_existencia: 1,
        stock_minimo: 0,
        precio_venta: 10,
        costo_compra: 5,
        es_servicio: false,
        id_categoria: 1,
      },
      {
        nombre_producto: 'Sin precio',
        cantidad_en_existencia: 1,
        stock_minimo: 0,
        costo_compra: 5,
        es_servicio: false,
        id_categoria: 1,
      },
    ]);

    await expect(productsService.importProducts(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(productsRepository.createMany).not.toHaveBeenCalled();
  });

  it('reports a missing category and skips the insert', async () => {
    vi.mocked(productsRepository.findImportReferences).mockResolvedValue({
      categoriaIds: [],
      clavesProductoServicio: [],
      clavesUnidad: [],
      objetosImpuesto: [],
      impuestoPresetIds: [],
    });

    await expect(
      productsService.importProducts(
        await spreadsheetUpload([
          {
            nombre_producto: 'Huérfano',
            cantidad_en_existencia: 1,
            stock_minimo: 0,
            precio_venta: 10,
            costo_compra: 5,
            es_servicio: false,
            id_categoria: 9,
          },
        ]),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(productsRepository.createMany).not.toHaveBeenCalled();
  });

  it('deactivates a product', async () => {
    vi.mocked(productsRepository.deactivate).mockResolvedValue({
      ...createdProduct,
      activo: false,
    });

    const result: IProducto = await productsService.deleteProduct(1);

    expect(result.activo).toBe(false);
    expect(productsRepository.deactivate).toHaveBeenCalledWith(1);
  });

  it('deactivates several products', async () => {
    vi.mocked(productsRepository.deactivateMany).mockResolvedValue({
      missingIds: [],
      productos: [
        { ...createdProduct, activo: false },
        { ...createdProduct, id: 2, activo: false },
      ],
    });

    const result: IProducto[] = await productsService.deleteProducts({
      ids: [1, 2],
    });

    expect(productsRepository.deactivateMany).toHaveBeenCalledWith([1, 2]);
    expect(result).toHaveLength(2);
    expect(result.every((producto: IProducto) => !producto.activo)).toBe(true);
  });

  it('does not deactivate the batch when a product does not exist', async () => {
    vi.mocked(productsRepository.deactivateMany).mockResolvedValue({
      missingIds: [9],
      productos: [],
    });

    await expect(
      productsService.deleteProducts({ ids: [1, 9] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

async function spreadsheetUpload(
  rows: ProductSpreadsheetRow[],
): Promise<ISpreadsheetUpload> {
  const buffer: Buffer = await buildProductsSpreadsheet(rows);

  return {
    originalname: 'productos.xlsx',
    buffer,
    size: buffer.length,
  };
}
