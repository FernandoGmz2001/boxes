import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { authed, loginAsAdmin } from './login.js';

describe('Categorias (e2e)', () => {
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
  });

  afterAll(async () => {
    if (categoriaId) {
      await prisma.client.categoria.deleteMany({ where: { id: categoriaId } });
    }
    await app.close();
  });

  it('creates, lists, updates and deletes a category', async () => {
    const created = await api
      .post('/categorias')
      .send({ nombre: 'Empaques', color_ui: '#336699' })
      .expect(201);

    categoriaId = created.body.id;
    expect(created.body).toMatchObject({
      nombre: 'Empaques',
      color_ui: '#336699',
    });

    const list = await api
      .get('/categorias')
      .expect(200);

    expect(list.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: categoriaId, nombre: 'Empaques' }),
      ]),
    );
    expect(list.body.pagina).toBe(1);
    expect(list.body.total).toBeGreaterThan(0);

    const updated = await api
      .patch(`/categorias/${categoriaId}`)
      .send({ nombre: 'Empaques retail' })
      .expect(200);

    expect(updated.body.nombre).toBe('Empaques retail');

    await api
      .delete(`/categorias/${categoriaId}`)
      .expect(204);

    await api
      .get(`/categorias/${categoriaId}`)
      .expect(404);

    categoriaId = 0;
  });
});