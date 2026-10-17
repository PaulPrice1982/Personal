// Money helpers (review F-010). Every currency value that leaves the engine
// is a whole number of pennies; the app converts Prisma Decimal to number
// only at the engine boundary and writes back with toFixed(2).

export function pennies(x: number): number {
  return Math.round(x * 100) / 100;
}

export function toPennies(x: number): number {
  return Math.round(x * 100);
}

export function fromPennies(p: number): number {
  return p / 100;
}

// Twelve penny-rounded monthly fees whose total is exactly the annual fee:
// the twelfth absorbs the rounding difference (Nick's AUD 128,800 would
// otherwise lose 4 cents a year across 12 rounded invoices).
export function monthlyFeeSchedule(annualFee: number): number[] {
  const monthly = pennies(annualFee / 12);
  const fees = Array.from({ length: 11 }, () => monthly);
  const first11 = toPennies(monthly) * 11;
  fees.push(fromPennies(toPennies(annualFee) - first11));
  return fees;
}
