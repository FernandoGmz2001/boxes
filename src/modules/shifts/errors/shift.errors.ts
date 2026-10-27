export class ShiftAlreadyOpenError extends Error {
  constructor() {
    super('La caja o el usuario ya tienen un turno abierto.');
    this.name = 'ShiftAlreadyOpenError';
  }
}

export class ShiftNotOpenError extends Error {
  constructor(readonly turnoId: number) {
    super(`Turno ${turnoId} no está abierto.`);
    this.name = 'ShiftNotOpenError';
  }
}

export class ShiftNotFoundError extends Error {
  constructor(readonly turnoId: number) {
    super(`Turno ${turnoId} no existe.`);
    this.name = 'ShiftNotFoundError';
  }
}

export class InsufficientCashError extends Error {
  constructor(
    readonly disponible: string,
    readonly solicitado: string,
  ) {
    super(`Efectivo insuficiente: hay ${disponible} y se piden ${solicitado}.`);
    this.name = 'InsufficientCashError';
  }
}
