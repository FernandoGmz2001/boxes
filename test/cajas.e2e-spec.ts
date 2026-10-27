import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import {
  authed,
  createUserWithRole,
  loginAsAdmin,
  type ITestUser,
} from './login.js';

describe('Cajas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: ReturnType<typeof authed>;
  let cajero: ITestUser;
  const cajaIds: number[] = [];
  const sufijo: number = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    api = authed(app, await loginAsAdmin(app));
    cajero = await createUserWithRole(app, 'cajero', 'cajero-cajas');
  });

  afterAll(async () => {
    await prisma.client.caja.deleteMany({ where: { id: { in: cajaIds } } });
    await prisma.client.usuario.delete({ where: { id: cajero.id } });
    await app.close();
  });

  it('creates, renames and deactivates a cash register', async () => {
    const created = await api
      .post('/cajas')
      .send({ nombre: `Caja e2e ${sufijo}` })
      .expect(201);

    cajaIds.push(created.body.id);
    expect(created.body).toEqual({
      id: expect.any(Number),
      nombre: `Caja e2e ${sufijo}`,
      activa: true,
    });

    const renamed = await api
      .patch(`/cajas/${created.body.id}`)
      .send({ nombre: `Caja e2e ${sufijo} B`, activa: false })
      .expect(200);

    expect(renamed.body).toMatchObject({
      nombre: `Caja e2e ${sufijo} B`,
      activa: false,
    });

    const inactivas = await api
      .get('/cajas?activa=false&limite=100')
      .expect(200);

    expect(
      inactivas.body.data.map((caja: { id: number }) => caja.id),
    ).toContain(created.body.id);
  });

  it('rejects a duplicated name', async () => {
    const created = await api
      .post('/cajas')
      .send({ nombre: `Caja duplicada ${sufijo}` })
      .expect(201);

    cajaIds.push(created.body.id);

    const response = await api
      .post('/cajas')
      .send({ nombre: `Caja duplicada ${sufijo}` })
      .expect(409);

    expect(response.body.message).toBe(
      `La caja Caja duplicada ${sufijo} ya existe.`,
    );
  });

  it('validates the name', async () => {
    const response = await api.post('/cajas').send({ nombre: '' }).expect(400);

    expect(response.body.message).toEqual([
      'El nombre de la caja es obligatorio.',
    ]);
  });

  it('lets a cashier list cash registers but not manage them', async () => {
    const cajeroApi = authed(app, cajero.token);

    await cajeroApi.get('/cajas').expect(200);
    await cajeroApi.post('/cajas').send({ nombre: 'Intrusa' }).expect(403);
  });

  it('returns 404 for a missing cash register', async () => {
    await api.get('/cajas/999999999').expect(404);
  });
});
