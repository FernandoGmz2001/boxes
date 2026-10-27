import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { authed, loginAsAdmin } from './login.js';

describe('Unidades (e2e)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof authed>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    api = authed(app, await loginAsAdmin(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the unit catalog', async () => {
    const response = await api.get('/unidades?pagina=1&limite=20').expect(200);

    expect(response.body.total).toBe(10);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, nombre: 'Unidad', simbolo: 'pza' }),
        expect.objectContaining({ id: 2, nombre: 'Metro', simbolo: 'm' }),
        expect.objectContaining({ id: 6, nombre: 'Gramo', simbolo: 'g' }),
      ]),
    );
  });

  it('returns metro by id', async () => {
    const response = await api.get('/unidades/2').expect(200);

    expect(response.body).toEqual({
      id: 2,
      nombre: 'Metro',
      simbolo: 'm',
    });
  });
});
