import { INestApplication } from '@nestjs/common';
import request, { type Test } from 'supertest';

const adminEmail: string =
  process.env.SEED_ADMIN_EMAIL ?? 'admin@boxes.local';
const adminPassword: string =
  process.env.SEED_ADMIN_PASSWORD ?? '4dm1n1str4t0r';

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: adminEmail, password: adminPassword })
    .expect(200);

  return response.body.access_token as string;
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
