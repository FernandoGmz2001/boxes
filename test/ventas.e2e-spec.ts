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

describe('Ventas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: ReturnType<typeof authed>;
  let api: ReturnType<typeof authed>;
  let cajero: ITestUser;
  let otroCajero: ITestUser;
  let operador: ITestUser;
  let categoriaId: number;
  let cajaRegistradoraId: number;
  let turnoId: number;
  let cajaId: number;
  let cintaId: number;
  let servicioId: number;
  let primeraVentaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    admin = authed(app, await loginAsAdmin(app));
    cajero = await createUserWithRole(app, 'cajero', 'cajero-ventas');
    otroCajero = await createUserWithRole(app, 'cajero', 'cajero-ventas-b');
    operador = await createUserWithRole(app, 'operador', 'operador-ventas');
    api = authed(app, cajero.token);

    const sufijo: number = Date.now();
    cajaRegistradoraId = (
      await prisma.client.caja.create({
        data: { nombre: `Ventas e2e ${sufijo}` },
      })
    ).id;
    turnoId = (
      await api
        .post('/turnos')
        .send({ caja_id: cajaRegistradoraId, fondo_inicial: 100 })
        .expect(201)
    ).body.id;

    const categoria = await prisma.client.categoria.create({
      data: { nombre: `Ventas e2e ${sufijo}` },
    });
    categoriaId = categoria.id;

    const baseProducto = {
      stock_minimo: 0,
      costo_compra: '5.00',
      id_categoria: categoriaId,
    };

    cajaId = (
      await prisma.client.producto.create({
        data: {
          ...baseProducto,
          nombre_producto: 'Caja venta',
          cantidad_en_existencia: 10,
          precio_venta: '12.50',
          es_servicio: false,
        },
      })
    ).id;
    cintaId = (
      await prisma.client.producto.create({
        data: {
          ...baseProducto,
          nombre_producto: 'Cinta venta',
          cantidad_en_existencia: 2,
          precio_venta: '30.00',
          es_servicio: false,
        },
      })
    ).id;
    servicioId = (
      await prisma.client.producto.create({
        data: {
          ...baseProducto,
          nombre_producto: 'Envoltura venta',
          cantidad_en_existencia: 0,
          precio_venta: '15.00',
          es_servicio: true,
        },
      })
    ).id;
  });

  afterAll(async () => {
    const productoIds: number[] = [cajaId, cintaId, servicioId];
    const ventas = await prisma.client.venta.findMany({
      where: { turno_id: turnoId },
      select: { id: true },
    });
    const ventaIds: number[] = ventas.map((venta) => venta.id);

    await prisma.client.detalle_venta.deleteMany({
      where: { venta_id: { in: ventaIds } },
    });
    await prisma.client.venta.deleteMany({ where: { id: { in: ventaIds } } });
    await prisma.client.movimiento.deleteMany({
      where: { producto_id: { in: productoIds } },
    });
    await prisma.client.producto.deleteMany({
      where: { id: { in: productoIds } },
    });
    await prisma.client.categoria.delete({ where: { id: categoriaId } });
    await prisma.client.turno_caja.delete({ where: { id: turnoId } });
    await prisma.client.caja.delete({ where: { id: cajaRegistradoraId } });
    await prisma.client.usuario.deleteMany({
      where: { id: { in: [cajero.id, otroCajero.id, operador.id] } },
    });
    await app.close();
  });

  it('prices the sale from the catalog, discounts stock and writes the kardex', async () => {
    const created = await api
      .post('/ventas')
      .send({
        metodo_pago: 'Efectivo',
        carrito: [
          { producto_id: cajaId, cantidad: 4 },
          { producto_id: cintaId, cantidad: 1 },
          { producto_id: servicioId, cantidad: 1 },
        ],
      })
      .expect(201);

    primeraVentaId = created.body.id;
    expect(created.body).toMatchObject({
      usuario_id: cajero.id,
      turno_id: turnoId,
      cliente_id: null,
      metodo_pago: 'Efectivo',
      total: '95.00',
    });
    expect(created.body.folio).toMatch(/^V-\d{8}$/);
    expect(created.body.detalles).toEqual([
      expect.objectContaining({
        producto_id: cajaId,
        cantidad: 4,
        precio_unitario: '12.50',
        subtotal: '50.00',
      }),
      expect.objectContaining({ producto_id: cintaId, subtotal: '30.00' }),
      expect.objectContaining({
        producto_id: servicioId,
        precio_unitario: '15.00',
        subtotal: '15.00',
      }),
    ]);

    const productos = await prisma.client.producto.findMany({
      where: { id: { in: [cajaId, cintaId, servicioId] } },
      select: { id: true, cantidad_en_existencia: true },
      orderBy: { id: 'asc' },
    });

    expect(productos).toEqual([
      { id: cajaId, cantidad_en_existencia: 6 },
      { id: cintaId, cantidad_en_existencia: 1 },
      { id: servicioId, cantidad_en_existencia: 0 },
    ]);

    const movimientos = await prisma.client.movimiento.findMany({
      where: { motivo: `Venta Folio: ${created.body.folio}` },
      orderBy: { producto_id: 'asc' },
    });

    expect(movimientos).toEqual([
      expect.objectContaining({
        producto_id: cajaId,
        tipo_movimiento: 'Salida',
        cantidad: 4,
        stock_previo: 10,
        stock_nuevo: 6,
        usuario_id: cajero.id,
      }),
      expect.objectContaining({
        producto_id: cintaId,
        tipo_movimiento: 'Salida',
        cantidad: 1,
        stock_previo: 2,
        stock_nuevo: 1,
      }),
    ]);
  });

  it('rejects client-side prices and totals', async () => {
    const response = await api
      .post('/ventas')
      .send({
        metodo_pago: 'Efectivo',
        total: 1,
        carrito: [{ producto_id: cajaId, cantidad: 1, precio_unitario: 0.01 }],
      })
      .expect(400);

    expect(response.body.message).toEqual([
      'El campo total no está permitido.',
      'El campo precio_unitario no está permitido.',
    ]);
  });

  it('rolls back the whole sale when one item lacks stock', async () => {
    const ventasAntes: number = await prisma.client.venta.count();

    const response = await api
      .post('/ventas')
      .send({
        metodo_pago: 'Tarjeta',
        carrito: [
          { producto_id: cajaId, cantidad: 1 },
          { producto_id: cintaId, cantidad: 2 },
        ],
      })
      .expect(400);

    expect(response.body.message).toEqual([
      `No hay existencia suficiente del producto ${cintaId}. Hay 1 y se piden 2.`,
    ]);
    expect(await prisma.client.venta.count()).toBe(ventasAntes);

    const caja = await prisma.client.producto.findUnique({
      where: { id: cajaId },
      select: { cantidad_en_existencia: true },
    });

    expect(caja?.cantidad_en_existencia).toBe(6);
  });

  it('sells the last unit only once under concurrent sales', async () => {
    const sale = {
      metodo_pago: 'Efectivo',
      carrito: [{ producto_id: cintaId, cantidad: 1 }],
    };

    const responses = await Promise.all([
      api.post('/ventas').send(sale),
      api.post('/ventas').send(sale),
    ]);
    const statuses: number[] = responses
      .map((response) => response.status)
      .sort();

    expect(statuses).toEqual([201, 400]);

    const cinta = await prisma.client.producto.findUnique({
      where: { id: cintaId },
      select: { cantidad_en_existencia: true },
    });

    expect(cinta?.cantidad_en_existencia).toBe(0);
  });

  it('returns 404 for a product that does not exist', async () => {
    await api
      .post('/ventas')
      .send({
        metodo_pago: 'Efectivo',
        carrito: [{ producto_id: 999_999_999, cantidad: 1 }],
      })
      .expect(404);
  });

  it('requires an open shift and the ventas permission', async () => {
    const sale = {
      metodo_pago: 'Efectivo',
      carrito: [{ producto_id: servicioId, cantidad: 1 }],
    };

    const sinTurno = await authed(app, otroCajero.token)
      .post('/ventas')
      .send(sale)
      .expect(409);

    expect(sinTurno.body.message).toBe('Abre un turno antes de vender.');
    await authed(app, operador.token).post('/ventas').send(sale).expect(403);
  });

  it('lists the cashier own sales and hides them from other cashiers', async () => {
    const propias = await api.get(`/ventas?turno_id=${turnoId}`).expect(200);

    expect(propias.body.total).toBe(2);
    expect(propias.body.data[0]).toMatchObject({
      turno_id: turnoId,
      usuario_id: cajero.id,
    });
    expect(propias.body.data[0].detalles).toBeUndefined();
    expect(
      propias.body.data.find(
        (venta: { id: number }) => venta.id === primeraVentaId,
      ),
    ).toMatchObject({ total: '95.00', articulos: 6 });

    const ajenas = await authed(app, otroCajero.token)
      .get(`/ventas?turno_id=${turnoId}`)
      .expect(200);

    expect(ajenas.body.total).toBe(0);
    await authed(app, otroCajero.token)
      .get(`/ventas/${primeraVentaId}`)
      .expect(403);

    const supervisor = await admin
      .get(`/ventas?turno_id=${turnoId}`)
      .expect(200);

    expect(supervisor.body.total).toBe(2);
  });

  it('returns the sale detail with product names for the ticket', async () => {
    const detalle = await api.get(`/ventas/${primeraVentaId}`).expect(200);

    expect(detalle.body).toMatchObject({
      id: primeraVentaId,
      total: '95.00',
      usuario: { id: cajero.id, nombre: 'cajero-ventas' },
    });
    expect(
      detalle.body.detalles.map(
        (linea: { nombre_producto: string }) => linea.nombre_producto,
      ),
    ).toEqual(['Caja venta', 'Cinta venta', 'Envoltura venta']);

    await api.get('/ventas/999999999').expect(404);
  });
});
