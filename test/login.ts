import { INestApplication } from '@nestjs/common';
import request, { type Test } from 'supertest';
import { hashPassword } from '../src/shared/password/password.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';

const adminEmail: string = process.env.SEED_ADMIN_EMAIL ?? 'admin@boxes.local';
const adminPassword: string =
  process.env.SEED_ADMIN_PASSWORD ?? '4dm1n1str4t0r';

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  return login(app, adminEmail, adminPassword);
}

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.access_token as string;
}

export interface ITestUser {
  id: number;
  token: string;
}

/** Crea un usuario con un rol del seed y devuelve su token. Bórralo en el afterAll. */
export async function createUserWithRole(
  app: INestApplication,
  rolNombre: string,
  etiqueta: string,
): Promise<ITestUser> {
  const prisma: PrismaService = app.get<PrismaService>(PrismaService);
  const rol = await prisma.client.rol.findUniqueOrThrow({
    where: { nombre: rolNombre },
  });
  const email: string = `${etiqueta}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@boxes.local`;
  const password: string = 'clave-e2e';
  const usuario = await prisma.client.usuario.create({
    data: {
      nombre: etiqueta,
      email,
      password: await hashPassword(password),
      rol_id: rol.id,
    },
  });

  return { id: usuario.id, token: await login(app, email, password) };
}

export function authed(app: INestApplication, token: string) {
  const server = app.getHttpServer();
  const authorization = `Bearer ${token}`;

  return {
    get: (url: string): Test =>
      request(server).get(url).set('Authorization', authorization),
    post: (url: string): Test =>
      request(server).post(url).set('Authorization', authorization),
    patch: (url: string): Test =>
      request(server).patch(url).set('Authorization', authorization),
    delete: (url: string): Test =>
      request(server).delete(url).set('Authorization', authorization),
  };
}
