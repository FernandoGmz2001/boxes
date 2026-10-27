import { fromCentavos, toCentavos } from '../../shared/money/money.js';
import { METODOS_PAGO } from '../sales/interfaces/venta.interface.js';
import type {
  ICorteTurno,
  ITotalesTurno,
  IVentasPorMetodo,
} from './interfaces/turno.interface.js';

const METODO_EFECTIVO: string = 'Efectivo';

/**
 * efectivo_esperado = fondo inicial + ventas en efectivo + entradas - retiros.
 * Lista todos los métodos de pago aunque no tengan ventas, para que el corte siempre tenga la misma forma.
 */
export function buildCorte(
  turnoId: number,
  totales: ITotalesTurno,
): ICorteTurno {
  const metodosConocidos: readonly string[] = METODOS_PAGO;
  const metodos: string[] = [
    ...metodosConocidos,
    ...totales.ventas
      .map((venta: IVentasPorMetodo) => venta.metodo_pago)
      .filter((metodo: string) => !metodosConocidos.includes(metodo)),
  ];
  const ventas: IVentasPorMetodo[] = metodos.map((metodo: string) => {
    const venta: IVentasPorMetodo | undefined = totales.ventas.find(
      (item: IVentasPorMetodo) => item.metodo_pago === metodo,
    );

    return {
      metodo_pago: metodo,
      cantidad: venta?.cantidad ?? 0,
      importe: fromCentavos(venta ? toCentavos(venta.importe) : 0),
    };
  });
  const totalVentasCentavos: number = ventas.reduce(
    (sum: number, venta: IVentasPorMetodo) => sum + toCentavos(venta.importe),
    0,
  );
  const efectivoCentavos: number = toCentavos(
    ventas.find(
      (venta: IVentasPorMetodo) => venta.metodo_pago === METODO_EFECTIVO,
    )?.importe ?? 0,
  );
  const esperadoCentavos: number =
    toCentavos(totales.fondo_inicial) +
    efectivoCentavos +
    toCentavos(totales.entradas) -
    toCentavos(totales.retiros);

  return {
    turno_id: turnoId,
    fondo_inicial: fromCentavos(toCentavos(totales.fondo_inicial)),
    ventas,
    total_ventas: fromCentavos(totalVentasCentavos),
    entradas: fromCentavos(toCentavos(totales.entradas)),
    retiros: fromCentavos(toCentavos(totales.retiros)),
    efectivo_esperado: fromCentavos(esperadoCentavos),
  };
}
