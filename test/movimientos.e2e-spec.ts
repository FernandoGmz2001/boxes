import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { authed, loginAsAdmin } from './login.js';

describe('Movimientos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: ReturnType<typeof authed>;
  let categoriaId: number;
  let productoId: number;
  let usuarioId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    const token: string = await loginAsAdmin(app);
    api = authed(app, token);

    const admin = await prisma.client.usuario.findUnique({
      where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@boxes.local' },
      select: { id: true },
    });

    if (!admin) {
      throw new Error('El admin del seed no existe.');
    }

    usuarioId = admin.id;

    const categoria = await prisma.client.categoria.create({
      data: { nombre: `Movimientos e2e ${Date.now()}` },
    });
    categoriaId = categoria.id;

    const producto = await prisma.client.producto.create({
      data: {
        nombre_producto: 'Caja movimiento',
        cantidad_en_existencia: 10,
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
    await prisma.client.movimiento.deleteMany({
      where: { producto_id: productoId },
    });
    await prisma.client.producto.delete({ where: { id: productoId } });
    await prisma.client.categoria.delete({ where: { id: categoriaId } });
    await app.close();
  });

  it('registers an entrada and updates the product stock', async () => {
    const created = await api
      .post('/movimientos')
      .send({
        producto_id: productoId,
        tipo_movimiento: 'Entrada',
        cantidad: 5,
        motivo: 'Compra',
      })
      .expect(201);

    expect(created.body).toMatchObject({
      producto_id: productoId,
      usuario_id: usuarioId,
      tipo_movimiento: 'Entrada',
      cantidad: 5,
      stock_previo: 10,
      stock_nuevo: 15,
      motivo: 'Compra',
    });

    const producto = await api.get(`/productos/${productoId}`).expect(200);

    expect(producto.body.cantidad_en_existencia).toBe(15);

    const list = await api
      .get(`/movimientos?producto_id=${productoId}`)
      .expect(200);

    expect(list.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, stock_nuevo: 15 }),
      ]),
    );
  });

  it('rejects a salida larger than the stock', async () => {
    await api
      .post('/movimientos')
      .send({
        producto_id: productoId,
        tipo_movimiento: 'Salida',
        cantidad: 100,
      })
      .expect(409);
  });
});
