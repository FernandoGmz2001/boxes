import type { IStockFaltante } from '../interfaces/venta.interface.js';

export class SaleProductsNotFoundError extends Error {
  constructor(readonly productoIds: number[]) {
    super(`Productos inexistentes: ${productoIds.join(', ')}`);
    this.name = 'SaleProductsNotFoundError';
  }
}

export class SaleProductsInactiveError extends Error {
  constructor(readonly productoIds: number[]) {
    super(`Productos inactivos: ${productoIds.join(', ')}`);
    this.name = 'SaleProductsInactiveError';
  }
}

export class InsufficientStockError extends Error {
  constructor(readonly faltantes: IStockFaltante[]) {
    super(
      `Stock insuficiente: ${faltantes.map((faltante: IStockFaltante) => faltante.producto_id).join(', ')}`,
    );
    this.name = 'InsufficientStockError';
  }
}

export class SaleTotalExceededError extends Error {
  constructor(readonly total: string) {
    super(`Total fuera de rango: ${total}`);
    this.name = 'SaleTotalExceededError';
  }
}

export class NoOpenShiftError extends Error {
  constructor(readonly usuarioId: number) {
    super(`El usuario ${usuarioId} no tiene turno abierto.`);
    this.name = 'NoOpenShiftError';
  }
}
