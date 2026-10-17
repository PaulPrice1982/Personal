// Expenses (spec section 15; Expenses sheet). The spreadsheet charges all
// mileage at the high rate; the spec adds the 10,000-mile tax-year threshold
// (45p up to 10,000 miles, 25p after, test A19), receipts required over £25
// (A20), VAT treatment by entity registration, and foreign amounts at the
// day's FX rate. Where they differ, the spec wins.

import { pennies } from './money.js';

export interface MileageRates {
  high: number;           // e.g. 0.45
  low: number;            // e.g. 0.25
  thresholdMiles: number; // e.g. 10000 per tax year
}

export function mileageCost(
  tripMiles: number,
  milesAlreadyThisTaxYear: number,
  rates: MileageRates,
): number {
  const highMiles = Math.max(
    0,
    Math.min(tripMiles, rates.thresholdMiles - milesAlreadyThisTaxYear),
  );
  const lowMiles = tripMiles - highMiles;
  return pennies(highMiles * rates.high + lowMiles * rates.low);
}

export interface ExpenseInput {
  category: string;        // Travel, Mileage, Accommodation, Subsistence, Other, ...
  amountExVat?: number;    // for non-mileage
  miles?: number;
  milesAlreadyThisTaxYear?: number;
  rechargeable: boolean;
  receiptRef?: string;
  fxRate?: number;         // foreign currency: amount * day rate -> entity currency
}

export function netCost(e: ExpenseInput, mileage: MileageRates): number {
  const base =
    e.category === 'Mileage'
      ? mileageCost(e.miles ?? 0, e.milesAlreadyThisTaxYear ?? 0, mileage)
      : (e.amountExVat ?? 0) * (e.fxRate ?? 1);
  return pennies(base);
}

export function rechargeAmount(net: number, rechargeable: boolean, markup: number): number {
  return rechargeable ? pennies(net * (1 + markup)) : 0;
}

export function receiptMissing(e: ExpenseInput, net: number, receiptRequiredOver: number): boolean {
  if (e.category === 'Mileage') return false; // mileage has a ledger, not receipts
  return net > receiptRequiredOver && !e.receiptRef;
}

// Currency conversion for the team view (ECB rate via Frankfurter at the app
// layer; the core just applies a rate).
export function convert(amount: number, rate: number): number {
  return amount * rate;
}
