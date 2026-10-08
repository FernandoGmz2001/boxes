import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
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

    const found = await api
      .get(`/productos/${productoId}`)
      .expect(200);

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
});
