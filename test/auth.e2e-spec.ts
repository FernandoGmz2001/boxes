import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/shared/configure-app.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { authed, loginAsAdmin } from './login.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let operadorId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    token = await loginAsAdmin(app);
  });

  afterAll(async () => {
    if (operadorId) {
      await prisma.client.usuario.delete({ where: { id: operadorId } });
    }
    await app.close();
  });

  it('rejects a bad password', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@boxes.local',
        password: 'clave-incorrecta',
      })
      .expect(401);

    expect(response.body.message).toBe('Credenciales incorrectas.');
  });

  it('returns the profile with the role permissions', async () => {
    const response = await authed(app, token).get('/auth/perfil').expect(200);

    expect(response.body.rol.nombre).toBe('admin');
    expect(response.body.permisos).toEqual([
      'productos',
      'movimientos',
      'usuarios',
      'roles',
      'ventas',
      'cajas',
    ]);
    expect(response.body.password).toBeUndefined();
  });

  it('lets an admin create a user and blocks an operador', async () => {
    const operadorRol = await prisma.client.rol.findUniqueOrThrow({
      where: { nombre: 'operador' },
    });
    const created = await authed(app, token)
      .post('/usuarios')
      .send({
        nombre: 'Operador e2e',
        email: `operador-${Date.now()}@boxes.local`,
        password: 'operador-clave',
        rol_id: operadorRol.id,
      })
      .expect(201);

    operadorId = created.body.id;
    expect(created.body.password).toBeUndefined();
    expect(created.body.rol).toEqual({
      id: operadorRol.id,
      nombre: 'operador',
    });

    const operadorToken = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: created.body.email, password: 'operador-clave' })
        .expect(200)
    ).body.access_token as string;

    await authed(app, operadorToken)
      .post('/usuarios')
      .send({
        nombre: 'Intruso',
        email: `intruso-${Date.now()}@boxes.local`,
        password: 'intruso-clave',
        rol_id: operadorRol.id,
      })
      .expect(403);
    await authed(app, operadorToken).get('/roles').expect(403);
    await authed(app, operadorToken).get('/productos').expect(200);

    await authed(app, token)
      .patch(`/usuarios/${operadorId}`)
      .send({ activo: false })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: created.body.email, password: 'operador-clave' })
      .expect(401);
  });
});
