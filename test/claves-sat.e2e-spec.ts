import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { authed, loginAsAdmin } from './login.js';

describe('Claves SAT (e2e)', () => {
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
    prisma = app.get<PrismaService>(PrismaService);
    api = authed(app, await loginAsAdmin(app));

    const categoria = await prisma.client.categoria.create({
      data: { nombre: `Claves SAT e2e ${Date.now()}` },
    });
    categoriaId = categoria.id;
  });

  afterAll(async () => {
    await prisma.client.categoria.delete({ where: { id: categoriaId } });
    await app.close();
  });

  it('reads the product service key, the unit and the tax object', async () => {
    const producto = await api
      .get('/claves-producto-servicio/01010101')
      .expect(200);
    expect(producto.body).toMatchObject({
      clave: '01010101',
      descripcion: 'No existe en el catálogo',
    });

    const unidad = await api
      .get('/claves-unidad/H87')
      .expect(200);
    expect(unidad.body).toMatchObject({ clave: 'H87', nombre: 'Pieza' });

    const objeto = await api
      .get('/objetos-impuesto/02')
      .expect(200);
    expect(objeto.body).toMatchObject({
      clave: '02',
      descripcion: 'Sí objeto de impuesto.',
    });
  });

  it('rejects a product whose SAT key is not in the catalog', async () => {
    await api
      .post('/productos')
      .send({
        nombre_producto: 'Caja sin clave',
        cantidad_en_existencia: 1,
        stock_minimo: 0,
        precio_venta: 10,
        costo_compra: 5,
        es_servicio: false,
        id_categoria: categoriaId,
        clave_producto_servicio: '99999999',
      })
      .expect(404);
  });
});
