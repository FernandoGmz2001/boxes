import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { authed, loginAsAdmin } from './login.js';

describe('Producto impuestos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let categoriaId: number;
  let productoId: number;
  let api: ReturnType<typeof authed>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    api = authed(app, await loginAsAdmin(app));

    const categoria = await prisma.client.categoria.create({
      data: { nombre: `Impuestos e2e ${Date.now()}` },
    });
    categoriaId = categoria.id;

    const producto = await prisma.client.producto.create({
      data: {
        nombre_producto: 'Caja impuesto',
        cantidad_en_existencia: 1,
        stock_minimo: 0,
        precio_venta: '10.00',
        costo_compra: '5.00',
        es_servicio: false,
        id_categoria: categoriaId,
      },
    });
    productoId = producto.id;
  });

  afterAll(async () => {
    await prisma.client.producto_impuesto.deleteMany({
      where: { producto_id: productoId },
    });
    await prisma.client.producto.delete({ where: { id: productoId } });
    await prisma.client.categoria.delete({ where: { id: categoriaId } });
    await app.close();
  });

  it('creates, lists, updates and deletes a product tax', async () => {
    const created = await api
      .post(`/productos/${productoId}/impuestos`)
      .send({ impuesto_preset_id: 3 })
      .expect(201);

    const impuestoId: number = created.body.id;
    expect(created.body).toMatchObject({
      producto_id: productoId,
      impuesto_preset_id: 3,
    });

    await api
      .post(`/productos/${productoId}/impuestos`)
      .send({ impuesto_preset_id: 3 })
      .expect(409);

    const list = await api
      .get(`/productos/${productoId}/impuestos`)
      .expect(200);

    expect(list.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: impuestoId, impuesto_preset_id: 3 }),
      ]),
    );

    const updated = await api
      .patch(`/productos/${productoId}/impuestos/${impuestoId}`)
      .send({ impuesto_preset_id: 8 })
      .expect(200);

    expect(updated.body.impuesto_preset_id).toBe(8);

    await api
      .delete(`/productos/${productoId}/impuestos/${impuestoId}`)
      .expect(204);

    await api
      .get(`/productos/${productoId}/impuestos/${impuestoId}`)
      .expect(404);
  });
});