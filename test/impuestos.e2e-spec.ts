import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { authed, loginAsAdmin } from './login.js';

describe('Impuestos (e2e)', () => {
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

  it('lists the SAT tax catalog', async () => {
    const response = await api
      .get('/impuestos?pagina=1&limite=20')
      .expect(200);

    expect(response.body.total).toBe(19);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
          clave_impuesto: '002',
          impuesto: 'IVA',
          valor_maximo: '0.160000',
          traslado: true,
          retencion: false,
        }),
      ]),
    );
  });

  it('returns IVA 16% by id', async () => {
    const response = await api
      .get('/impuestos/2')
      .expect(200);

    expect(response.body).toMatchObject({
      id: 2,
      clave_impuesto: '002',
      impuesto: 'IVA',
      factor: 'Tasa',
      rango_o_fijo: 'Fijo',
      valor_minimo: null,
      valor_maximo: '0.160000',
      traslado: true,
      retencion: false,
      fecha_inicio_vigencia: '2022-01-01',
      fecha_fin_vigencia: null,
    });
  });
});
