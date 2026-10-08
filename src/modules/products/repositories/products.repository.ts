import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { IPageResult } from '../../../shared/pagination/paginated.interface.js';
import type { IProducto } from '../interfaces/producto.interface.js';
import type {
  ICategoriaRef,
  ICreateProducto,
  IListProductos,
  IProductsRepository,
  IUpdateProducto,
} from '../interfaces/products-repository.interface.js';

type ProductoRecord = Prisma.productoGetPayload<{
  include: { impuestos: true };
}>;

const productoInclude = { impuestos: true } as const;

@Injectable()
export class ProductsRepository implements IProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCategoriaById(id: number): Promise<ICategoriaRef | null> {
    const categoria: ICategoriaRef | null =
      await this.prisma.client.categoria.findUnique({
        where: { id },
        select: { id: true },
      });

    return categoria;
  }

  async claveProductoServicioExists(clave: string): Promise<boolean> {
    const record: { clave: string } | null =
      await this.prisma.client.clave_prod_serv.findUnique({
        where: { clave },
        select: { clave: true },
      });

    return record !== null;
  }

  async claveUnidadExists(clave: string): Promise<boolean> {
    const record: { clave: string } | null =
      await this.prisma.client.clave_unidad.findUnique({
        where: { clave },
        select: { clave: true },
      });

    return record !== null;
  }

  async objetoImpuestoExists(clave: string): Promise<boolean> {
    const record: { clave: string } | null =
      await this.prisma.client.objeto_imp.findUnique({
        where: { clave },
        select: { clave: true },
      });

    return record !== null;
  }

  async findAll(filter: IListProductos): Promise<IPageResult<IProducto>> {
    const where: Prisma.productoWhereInput | undefined =
      filter.activo === undefined ? undefined : { activo: filter.activo };
    const skip: number = (filter.pagina - 1) * filter.limite;

    const [records, total]: [ProductoRecord[], number] = await Promise.all([
      this.prisma.client.producto.findMany({
        where,
        include: productoInclude,
        orderBy: { id: 'asc' },
        skip,
        take: filter.limite,
      }),
      this.prisma.client.producto.count({ where }),
    ]);

    return {
      items: records.map((record: ProductoRecord) => toProducto(record)),
      total,
    };
  }

  async findById(id: number): Promise<IProducto | null> {
    const record: ProductoRecord | null =
      await this.prisma.client.producto.findUnique({
        where: { id },
        include: productoInclude,
      });

    return record ? toProducto(record) : null;
  }

  async create(input: ICreateProducto): Promise<IProducto> {
    const created: ProductoRecord = await this.prisma.client.$transaction(
      async (transaction): Promise<ProductoRecord> => {
        return transaction.producto.create({
          data: {
            nombre_producto: input.nombre_producto,
            imagen_url: input.imagen_url,
            cantidad_en_existencia: input.cantidad_en_existencia,
            stock_minimo: input.stock_minimo,
            sku: input.sku,
            codigo_barras: input.codigo_barras,
            precio_venta: input.precio_venta,
            costo_compra: input.costo_compra,
            es_servicio: input.es_servicio,
            activo: input.activo,
            id_categoria: input.id_categoria,
            clave_producto_servicio: input.clave_producto_servicio,
            clave_unidad_medida: input.clave_unidad_medida,
            objeto_impuesto: input.objeto_impuesto,
            impuestos: {
              create: input.impuesto_preset_ids.map(
                (impuesto_preset_id: number) => ({
                  impuesto_preset_id,
                }),
              ),
            },
          },
          include: productoInclude,
        });
      },
    );

    return toProducto(created);
  }

  async update(id: number, input: IUpdateProducto): Promise<IProducto | null> {
    const updated: ProductoRecord | null = await this.prisma.client.$transaction(
      async (transaction): Promise<ProductoRecord | null> => {
        const existing: { id: number } | null =
          await transaction.producto.findUnique({
            where: { id },
            select: { id: true },
          });

        if (!existing) {
          return null;
        }

        return transaction.producto.update({
          where: { id },
          data: toUpdateData(input),
          include: productoInclude,
        });
      },
    );

    return updated ? toProducto(updated) : null;
  }

  async deactivate(id: number): Promise<IProducto | null> {
    const updated: ProductoRecord | null = await this.prisma.client.$transaction(
      async (transaction): Promise<ProductoRecord | null> => {
        const existing: { id: number } | null =
          await transaction.producto.findUnique({
            where: { id },
            select: { id: true },
          });

        if (!existing) {
          return null;
        }

        return transaction.producto.update({
          where: { id },
          data: { activo: false },
          include: productoInclude,
        });
      },
    );

    return updated ? toProducto(updated) : null;
  }
}

function toUpdateData(input: IUpdateProducto): Prisma.productoUpdateInput {
  const data: Prisma.productoUpdateInput = {};

  if (input.nombre_producto !== undefined) {
    data.nombre_producto = input.nombre_producto;
  }
  if (input.imagen_url !== undefined) {
    data.imagen_url = input.imagen_url;
  }
  if (input.stock_minimo !== undefined) {
    data.stock_minimo = input.stock_minimo;
  }
  if (input.sku !== undefined) {
    data.sku = input.sku;
  }
  if (input.codigo_barras !== undefined) {
    data.codigo_barras = input.codigo_barras;
  }
  if (input.precio_venta !== undefined) {
    data.precio_venta = input.precio_venta;
  }
  if (input.costo_compra !== undefined) {
    data.costo_compra = input.costo_compra;
  }
  if (input.es_servicio !== undefined) {
    data.es_servicio = input.es_servicio;
  }
  if (input.activo !== undefined) {
    data.activo = input.activo;
  }
  if (input.id_categoria !== undefined) {
    data.categoria = { connect: { id: input.id_categoria } };
  }
  if (input.clave_producto_servicio !== undefined) {
    data.clave_prod_serv =
      input.clave_producto_servicio === null
        ? { disconnect: true }
        : { connect: { clave: input.clave_producto_servicio } };
  }
  if (input.clave_unidad_medida !== undefined) {
    data.clave_unidad =
      input.clave_unidad_medida === null
        ? { disconnect: true }
        : { connect: { clave: input.clave_unidad_medida } };
  }
  if (input.objeto_impuesto !== undefined) {
    data.objeto_imp =
      input.objeto_impuesto === null
        ? { disconnect: true }
        : { connect: { clave: input.objeto_impuesto } };
  }
  if (input.impuesto_preset_ids !== undefined) {
    data.impuestos = {
      deleteMany: {},
      create: input.impuesto_preset_ids.map((impuesto_preset_id: number) => ({
        impuesto_preset_id,
      })),
    };
  }

  return data;
}

function toProducto(record: ProductoRecord): IProducto {
  return {
    id: record.id,
    nombre_producto: record.nombre_producto,
    imagen_url: record.imagen_url,
    cantidad_en_existencia: record.cantidad_en_existencia,
    stock_minimo: record.stock_minimo,
    sku: record.sku,
    codigo_barras: record.codigo_barras,
    precio_venta: record.precio_venta.toFixed(2),
    costo_compra: record.costo_compra.toFixed(2),
    es_servicio: record.es_servicio,
    activo: record.activo,
    id_categoria: record.id_categoria,
    clave_producto_servicio: record.clave_producto_servicio,
    clave_unidad_medida: record.clave_unidad_medida,
    objeto_impuesto: record.objeto_impuesto,
    created_at: record.created_at,
    updated_at: record.updated_at,
    impuestos: record.impuestos.map(
      (impuesto: { impuesto_preset_id: number }) => impuesto.impuesto_preset_id,
    ),
  };
}
