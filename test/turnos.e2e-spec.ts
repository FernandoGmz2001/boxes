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

describe('Turnos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof authed>;
  let cajeroA: ITestUser;
  let cajeroB: ITestUser;
  let apiA: ReturnType<typeof authed>;
  let apiB: ReturnType<typeof authed>;
  let cajaId: number;
  let cajaNombre: string;
  let otraCajaId: number;
  let categoriaId: number;
  let productoId: number;
  let turnoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    admin = authed(app, await loginAsAdmin(app));
    cajeroA = await createUserWithRole(app, 'cajero', 'cajero-a');
    cajeroB = await createUserWithRole(app, 'cajero', 'cajero-b');
    apiA = authed(app, cajeroA.token);
    apiB = authed(app, cajeroB.token);

    const sufijo: number = Date.now();
    cajaNombre = `Turnos e2e ${sufijo}`;
    cajaId = (
      await prisma.client.caja.create({
        data: { nombre: cajaNombre },
      })
    ).id;
    otraCajaId = (
      await prisma.client.caja.create({
        data: { nombre: `Turnos e2e ${sufijo} B` },
      })
    ).id;
    categoriaId = (
      await prisma.client.categoria.create({
        data: { nombre: `Turnos e2e ${sufijo}` },
      })
    ).id;
    productoId = (
      await prisma.client.producto.create({
        data: {
          nombre_producto: 'Caja turno',
          cantidad_en_existencia: 50,
          stock_minimo: 0,
          precio_venta: '10.00',
          costo_compra: '5.00',
          es_servicio: false,
          id_categoria: categoriaId,
        },
      })
    ).id;
  });

  afterAll(async () => {
    const turnos = await prisma.client.turno_caja.findMany({
      where: { caja_id: { in: [cajaId, otraCajaId] } },
      select: { id: true },
    });
    const turnoIds: number[] = turnos.map((turno) => turno.id);
    const ventas = await prisma.client.venta.findMany({
      where: { turno_id: { in: turnoIds } },
      select: { id: true },
    });
    const ventaIds: number[] = ventas.map((venta) => venta.id);

    await prisma.client.detalle_venta.deleteMany({
      where: { venta_id: { in: ventaIds } },
    });
    await prisma.client.venta.deleteMany({ where: { id: { in: ventaIds } } });
    await prisma.client.movimiento.deleteMany({
      where: { producto_id: productoId },
    });
    await prisma.client.movimiento_caja.deleteMany({
      where: { turno_id: { in: turnoIds } },
    });
    await prisma.client.turno_caja.deleteMany({
      where: { id: { in: turnoIds } },
    });
    await prisma.client.caja.deleteMany({
      where: { id: { in: [cajaId, otraCajaId] } },
    });
    await prisma.client.producto.delete({ where: { id: productoId } });
    await prisma.client.categoria.delete({ where: { id: categoriaId } });
    await prisma.client.usuario.deleteMany({
      where: { id: { in: [cajeroA.id, cajeroB.id] } },
    });
    await app.close();
  });

  it('returns 404 for the current shift before opening one', async () => {
    const response = await apiA.get('/turnos/actual').expect(404);

    expect(response.body.message).toBe('No tienes un turno abierto.');
  });

  it('opens a shift once per user and per cash register', async () => {
    const opened = await apiA
      .post('/turnos')
      .send({ caja_id: cajaId, fondo_inicial: 500 })
      .expect(201);

    turnoId = opened.body.id;
    expect(opened.body).toMatchObject({
      caja_id: cajaId,
      usuario_id: cajeroA.id,
      estado: 'Abierto',
      fondo_inicial: '500.00',
      cerrado_at: null,
    });

    await apiA
      .post('/turnos')
      .send({ caja_id: otraCajaId, fondo_inicial: 0 })
      .expect(409);

    const ocupada = await apiB
      .post('/turnos')
      .send({ caja_id: cajaId, fondo_inicial: 0 })
      .expect(409);

    expect(ocupada.body.message).toBe(
      `La caja ${cajaId} ya tiene un turno abierto.`,
    );

    const actual = await apiA.get('/turnos/actual').expect(200);

    expect(actual.body.id).toBe(turnoId);
  });

  it('refuses to deactivate a cash register with an open shift', async () => {
    await admin.patch(`/cajas/${cajaId}`).send({ activa: false }).expect(409);
  });

  it('hides a shift from other cashiers but not from a supervisor', async () => {
    await apiB.get(`/turnos/${turnoId}`).expect(403);
    await apiB.get('/turnos').expect(403);

    const detalle = await admin.get(`/turnos/${turnoId}`).expect(200);

    expect(detalle.body.usuario).toEqual({
      id: cajeroA.id,
      nombre: 'cajero-a',
    });
    expect(detalle.body.caja).toEqual({ id: cajaId, nombre: cajaNombre });

    const lista = await admin.get(`/turnos?caja_id=${cajaId}`).expect(200);

    expect(lista.body.data.map((turno: { id: number }) => turno.id)).toEqual([
      turnoId,
    ]);
    expect(lista.body.data[0].usuario).toEqual({
      id: cajeroA.id,
      nombre: 'cajero-a',
    });
    expect(lista.body.data[0].caja).toEqual({ id: cajaId, nombre: cajaNombre });
  });

  it('records cash movements and refuses a withdrawal larger than the cash', async () => {
    await apiA
      .post('/ventas')
      .send({
        metodo_pago: 'Efectivo',
        carrito: [{ producto_id: productoId, cantidad: 3 }],
      })
      .expect(201);
    await apiA
      .post('/ventas')
      .send({
        metodo_pago: 'Tarjeta',
        carrito: [{ producto_id: productoId, cantidad: 1 }],
      })
      .expect(201);

    await apiA
      .post(`/turnos/${turnoId}/movimientos`)
      .send({ tipo: 'Entrada', monto: 50, motivo: 'Cambio extra' })
      .expect(201);

    const retiro = await apiA
      .post(`/turnos/${turnoId}/movimientos`)
      .send({ tipo: 'Retiro', monto: 100, motivo: 'Depósito' })
      .expect(201);

    expect(retiro.body).toMatchObject({
      turno_id: turnoId,
      usuario_id: cajeroA.id,
      tipo: 'Retiro',
      monto: '100.00',
    });

    const excesivo = await apiA
      .post(`/turnos/${turnoId}/movimientos`)
      .send({ tipo: 'Retiro', monto: 10000, motivo: 'Demasiado' })
      .expect(400);

    expect(excesivo.body.message).toBe(
      'No hay efectivo suficiente en caja. Hay 480.00 y se retiran 10000.00.',
    );
  });

  it('previews the cut without closing the shift', async () => {
    const corte = await apiA.get(`/turnos/${turnoId}/corte`).expect(200);

    expect(corte.body).toEqual({
      turno_id: turnoId,
      fondo_inicial: '500.00',
      ventas: [
        { metodo_pago: 'Efectivo', cantidad: 1, importe: '30.00' },
        { metodo_pago: 'Tarjeta', cantidad: 1, importe: '10.00' },
        { metodo_pago: 'Transferencia', cantidad: 0, importe: '0.00' },
      ],
      total_ventas: '40.00',
      entradas: '50.00',
      retiros: '100.00',
      efectivo_esperado: '480.00',
    });

    const actual = await apiA.get('/turnos/actual').expect(200);

    expect(actual.body.estado).toBe('Abierto');
  });

  it('closes the shift with the counted cash and blocks further operations', async () => {
    const cierre = await apiA
      .post(`/turnos/${turnoId}/cierre`)
      .send({ efectivo_contado: 470, notas: 'Faltan 10' })
      .expect(200);

    expect(cierre.body.turno).toMatchObject({
      id: turnoId,
      estado: 'Cerrado',
      efectivo_esperado: '480.00',
      efectivo_contado: '470.00',
      diferencia: '-10.00',
      notas: 'Faltan 10',
    });
    expect(cierre.body.turno.cerrado_at).not.toBeNull();
    expect(cierre.body.corte.efectivo_esperado).toBe('480.00');

    await apiA
      .post(`/turnos/${turnoId}/cierre`)
      .send({ efectivo_contado: 470 })
      .expect(409);
    await apiA
      .post(`/turnos/${turnoId}/movimientos`)
      .send({ tipo: 'Entrada', monto: 1, motivo: 'Tarde' })
      .expect(409);

    const venta = await apiA
      .post('/ventas')
      .send({
        metodo_pago: 'Efectivo',
        carrito: [{ producto_id: productoId, cantidad: 1 }],
      })
      .expect(409);

    expect(venta.body.message).toBe('Abre un turno antes de vender.');
    await apiA.get('/turnos/actual').expect(404);
    await admin.patch(`/cajas/${cajaId}`).send({ activa: false }).expect(200);
  });

  it('validates the open shift payload', async () => {
    const response = await apiB
      .post('/turnos')
      .send({ caja_id: 0, fondo_inicial: -1 })
      .expect(400);

    expect(response.body.message).toEqual([
      'La caja debe ser mayor a cero.',
      'El fondo inicial no puede ser negativo.',
    ]);
  });
});
