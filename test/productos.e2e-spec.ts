import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import {
  buildProductsSpreadsheet,
  parseProductsSpreadsheet,
} from '../src/modules/products/spreadsheet/product-spreadsheet.js';
import { authed, loginAsAdmin } from './login.js';

describe('Productos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let categoriaId: number;
  let api: ReturnType<typeof authed>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    api = authed(app, await loginAsAdmin(app));

    prisma = app.get<PrismaService>(PrismaService);
    const categoria = await prisma.client.categoria.create({
      data: {
        nombre: `Categoria e2e ${Date.now()}`,
        color_ui: '#336699',
      },
    });
    categoriaId = categoria.id;
  });

  afterAll(async () => {
    await prisma.client.producto_impuesto.deleteMany({
      where: { producto: { id_categoria: categoriaId } },
    });
    await prisma.client.producto.deleteMany({
      where: { id_categoria: categoriaId },
    });
    await prisma.client.categoria.delete({ where: { id: categoriaId } });
    await app.close();
  });

  it('POST /productos creates a product', async () => {
    const response = await api
      .post('/productos')
      .send({
        nombre_producto: 'Caja mediana',
        imagen_url: 'https://example.com/caja.png',
        cantidad_en_existencia: 10,
        stock_minimo: 2,
        sku: 'CAJA-MED',
        codigo_barras: '7501234567890',
        precio_venta: 199.5,
        costo_compra: 80,
        es_servicio: false,
        id_categoria: categoriaId,
        clave_producto_servicio: '01010101',
        clave_unidad_medida: 'H87',
        objeto_impuesto: '02',
        impuesto_preset_ids: [3],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      nombre_producto: 'Caja mediana',
      codigo_barras: '7501234567890',
      precio_venta: '199.50',
      costo_compra: '80.00',
      es_servicio: false,
      activo: true,
      id_categoria: categoriaId,
      impuestos: [3],
    });
    expect(response.body.id).toEqual(expect.any(Number));
  });

  it('POST /productos returns 404 when the category does not exist', async () => {
    const response = await api
      .post('/productos')
      .send({
        nombre_producto: 'Sin categoria',
        cantidad_en_existencia: 1,
        stock_minimo: 0,
        precio_venta: 10,
        costo_compra: 5,
        es_servicio: false,
        id_categoria: 999999999,
      })
      .expect(404);

    expect(response.body.message).toBe('Categoría 999999999 no existe.');
  });

  it('POST /productos returns 400 when the body is invalid', async () => {
    const response = await api
      .post('/productos')
      .send({ nombre_producto: '' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toContain(
      'El nombre del producto es obligatorio.',
    );
  });

  it('POST /productos returns Spanish validation messages', async () => {
    const response = await api
      .post('/productos')
      .send({
        nombre_producto: 1,
        cantidad_en_existencia: 10,
        stock_minimo: 2,
        precio_venta: 10,
        costo_compra: 5,
        es_servicio: false,
        id_categoria: 1,
      })
      .expect(400);

    expect(response.body.message).toContain(
      'El nombre del producto debe ser un texto.',
    );
  });

  it('lists, reads, updates and deactivates a product', async () => {
    const created = await api
      .post('/productos')
      .send({
        nombre_producto: 'Caja grande',
        cantidad_en_existencia: 4,
        stock_minimo: 1,
        precio_venta: 50,
        costo_compra: 20,
        es_servicio: false,
        id_categoria: categoriaId,
        impuesto_preset_ids: [1, 2],
      })
      .expect(201);

    const productoId: number = created.body.id;

    const list = await api
      .get('/productos')
      .query({ activo: 'true' })
      .expect(200);

    expect(list.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: productoId, activo: true }),
      ]),
    );
    expect(list.body.pagina).toBe(1);
    expect(list.body.limite).toBe(20);

    const searched = await api
      .get('/productos')
      .query({ busqueda: 'caja grande' })
      .expect(200);

    expect(searched.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productoId,
          nombre_producto: 'Caja grande',
        }),
      ]),
    );

    const unmatched = await api
      .get('/productos')
      .query({ busqueda: 'producto-inexistente-e2e' })
      .expect(200);

    expect(unmatched.body.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: productoId })]),
    );

    const found = await api.get(`/productos/${productoId}`).expect(200);

    expect(found.body.nombre_producto).toBe('Caja grande');
    expect(found.body.impuestos).toEqual([1, 2]);

    await api
      .patch(`/productos/${productoId}`)
      .send({ cantidad_en_existencia: 99 })
      .expect(400);

    const updated = await api
      .patch(`/productos/${productoId}`)
      .send({
        nombre_producto: 'Caja grande reforzada',
        precio_venta: 75.5,
        impuesto_preset_ids: [8],
      })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: productoId,
      nombre_producto: 'Caja grande reforzada',
      precio_venta: '75.50',
      costo_compra: '20.00',
      impuestos: [8],
    });

    const deactivated = await api
      .delete(`/productos/${productoId}`)
      .expect(200);

    expect(deactivated.body.activo).toBe(false);

    const activeOnly = await api
      .get('/productos')
      .query({ activo: 'true' })
      .expect(200);

    expect(activeOnly.body.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: productoId })]),
    );

    await api.get('/productos/999999999').expect(404);
  });

  it('PATCH /productos updates several products or none', async () => {
    const first = await api
      .post('/productos')
      .send({
        nombre_producto: 'Lote A',
        cantidad_en_existencia: 1,
        stock_minimo: 1,
        precio_venta: 10,
        costo_compra: 4,
        es_servicio: false,
        id_categoria: categoriaId,
      })
      .expect(201);
    const second = await api
      .post('/productos')
      .send({
        nombre_producto: 'Lote B',
        cantidad_en_existencia: 2,
        stock_minimo: 1,
        precio_venta: 20,
        costo_compra: 8,
        es_servicio: false,
        id_categoria: categoriaId,
      })
      .expect(201);
    const firstId: number = first.body.id;
    const secondId: number = second.body.id;

    const updated = await api
      .patch('/productos')
      .send({
        productos: [
          {
            id: firstId,
            nombre_producto: 'Lote A editado',
            precio_venta: 11,
          },
          { id: secondId, stock_minimo: 9, activo: false },
        ],
      })
      .expect(200);

    expect(updated.body).toEqual([
      expect.objectContaining({
        id: firstId,
        nombre_producto: 'Lote A editado',
        precio_venta: '11.00',
      }),
      expect.objectContaining({
        id: secondId,
        stock_minimo: 9,
        activo: false,
        precio_venta: '20.00',
      }),
    ]);

    const rejected = await api
      .patch('/productos')
      .send({
        productos: [
          { id: firstId, nombre_producto: 'No debe guardarse' },
          { id: 999999999, nombre_producto: 'Fantasma' },
        ],
      })
      .expect(404);

    expect(rejected.body.message).toBe('Producto 999999999 no existe.');

    const unchanged = await api.get(`/productos/${firstId}`).expect(200);
    expect(unchanged.body.nombre_producto).toBe('Lote A editado');

    await api
      .patch('/productos')
      .send({ productos: [{ id: firstId }] })
      .expect(400);

    await api
      .patch('/productos')
      .send({
        productos: [
          { id: firstId, precio_venta: 1 },
          { id: firstId, precio_venta: 2 },
        ],
      })
      .expect(400);
  });

  it('GET /productos/plantilla downloads an empty workbook', async () => {
    const response = await api
      .get('/productos/plantilla')
      .buffer(true)
      .parse(readBinaryBody)
      .expect(200);

    expect(response.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(response.headers['content-disposition']).toContain(
      'plantilla-productos.xlsx',
    );

    const parsed = await parseProductsSpreadsheet(response.body as Buffer);

    expect(parsed.errores).toEqual(['El archivo no tiene productos.']);
  });

  it('POST /productos/importacion creates products from an xlsx file', async () => {
    const file = await buildProductsSpreadsheet([
      {
        nombre_producto: 'Importado excel',
        cantidad_en_existencia: 3,
        stock_minimo: 1,
        precio_venta: 15.5,
        costo_compra: 4,
        es_servicio: false,
        id_categoria: categoriaId,
        clave_producto_servicio: '01010101',
        clave_unidad_medida: 'H87',
        objeto_impuesto: '02',
        impuesto_preset_ids: '3',
      },
      {
        nombre_producto: 'Servicio importado',
        cantidad_en_existencia: 0,
        stock_minimo: 0,
        precio_venta: 100,
        costo_compra: 0,
        es_servicio: 'sí',
        activo: 'no',
        id_categoria: categoriaId,
      },
    ]);

    const response = await api
      .post('/productos/importacion')
      .attach('archivo', file, 'productos.xlsx')
      .expect(201);

    expect(response.body.creados).toBe(2);
    expect(response.body.productos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nombre_producto: 'Importado excel',
          precio_venta: '15.50',
          id_categoria: categoriaId,
          impuestos: [3],
        }),
        expect.objectContaining({
          nombre_producto: 'Servicio importado',
          es_servicio: true,
          activo: false,
          impuestos: [],
        }),
      ]),
    );
  });

  it('POST /productos/importacion saves nothing when a row is invalid', async () => {
    const before = await prisma.client.producto.count({
      where: { id_categoria: categoriaId },
    });
    const file = await buildProductsSpreadsheet([
      {
        nombre_producto: 'No debe guardarse',
        cantidad_en_existencia: 1,
        stock_minimo: 0,
        precio_venta: 10,
        costo_compra: 1,
        es_servicio: false,
        id_categoria: categoriaId,
      },
      {
        nombre_producto: 'Categoria mala',
        cantidad_en_existencia: 1,
        stock_minimo: 0,
        precio_venta: 10,
        costo_compra: 1,
        es_servicio: false,
        id_categoria: 999999999,
      },
    ]);

    const response = await api
      .post('/productos/importacion')
      .attach('archivo', file, 'productos.xlsx')
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Fila 3: Categoría 999999999 no existe.'),
      ]),
    );

    const after = await prisma.client.producto.count({
      where: { id_categoria: categoriaId },
    });
    expect(after).toBe(before);
  });
});

function readBinaryBody(
  response: Response,
  callback: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];

  response.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });
  response.on('end', () => {
    callback(null, Buffer.concat(chunks));
  });
}
