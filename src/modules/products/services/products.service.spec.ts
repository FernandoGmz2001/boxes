import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { CreateProductDto } from '../dtos/create-product.dto.js';
import type { IPage } from '../../../shared/pagination/paginated.interface.js';
import type { IProducto } from '../interfaces/producto.interface.js';
import {
  PRODUCTS_REPOSITORY,
  type IProductsRepository,
} from '../interfaces/products-repository.interface.js';
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
            update: vi.fn(),
            deactivate: vi.fn(),
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

  it('deactivates a product', async () => {
    vi.mocked(productsRepository.deactivate).mockResolvedValue({
      ...createdProduct,
      activo: false,
    });

    const result: IProducto = await productsService.deleteProduct(1);

    expect(result.activo).toBe(false);
    expect(productsRepository.deactivate).toHaveBeenCalledWith(1);
  });
});
