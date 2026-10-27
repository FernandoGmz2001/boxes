/** Los importes se suman en centavos enteros para no arrastrar errores de punto flotante. */
export function toCentavos(amount: number | string): number {
  return Math.round(Number(amount) * 100);
}

export function fromCentavos(centavos: number): string {
  return (centavos / 100).toFixed(2);
}
