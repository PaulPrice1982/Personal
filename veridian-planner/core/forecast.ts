import { addDays, edate, type ISODate } from './dates.js';

// 12-month revenue forecast (spec section 13; Revenue Forecast sheet).
// Retainers count in full for any month the contract is live. Pencilled
// weighting: client win probability, else the monday stage probability, else
// the default (0.5). Monthly overage comes in as the pre-computed delta of
// cumulative charges (see overage.ts).

export interface ForecastClient {
  status: 'Signed' | 'Pencilled';
  monthlyFee: number;
  liveFrom: ISODate;        // contract start, or the forecast start when none set
  liveTo: ISODate | null;   // term end when notice was given in time; null = open-ended
  winProbability?: number;  // explicit probability on the client
  mondayStageProbability?: number; // from the monday CRM stage mapping
}

export function pencilledProbability(c: ForecastClient, defaultProbability: number): number {
  if (c.status === 'Signed') return 1;
  if (c.winProbability !== undefined) return c.winProbability;
  if (c.mondayStageProbability !== undefined) return c.mondayStageProbability;
  return defaultProbability;
}

// Review F-002: a monthly fee falls in the calendar month containing a
// term-month anniversary of liveFrom, so a 12-month term yields exactly 12
// fees even when it starts mid-month. Billing and statements must use the
// same rule, so the forecast and the invoices agree.
export function feeFallsInMonth(
  c: Pick<ForecastClient, 'liveFrom' | 'liveTo'>,
  monthStart: ISODate,
): boolean {
  const [ly, lm] = c.liveFrom.split('-').map(Number) as [number, number];
  const [my, mm] = monthStart.split('-').map(Number) as [number, number];
  const k = my * 12 + mm - (ly * 12 + lm);
  if (k < 0) return false;
  return c.liveTo === null || edate(c.liveFrom, k) <= c.liveTo;
}

export interface ForecastMonth {
  monthStart: ISODate;
  monthEnd: ISODate;
  signed: number;
  pencilled: number;
  pencilledWeighted: number;
  overageBooked: number;
  rechargeableExpenses: number;
  committed: number; // signed + overage + expenses
  weighted: number;  // committed + pencilled weighted
  clientDays: number;
  capacityDays: number;
  utilisation: number;
}

export interface ForecastInputs {
  forecastStart: ISODate; // first of a month
  clients: readonly ForecastClient[];
  defaultProbability: number;
  monthlyOverageCharges: readonly number[];      // 12 entries
  monthlyRechargeableExpenses: readonly number[]; // 12 entries
  monthlyClientDays: readonly number[];           // 12 entries
  monthlyCapacityDays: readonly number[];         // 12 entries
}

export function buildForecast(i: ForecastInputs): ForecastMonth[] {
  const rows: ForecastMonth[] = [];
  for (let m = 0; m < 12; m++) {
    const monthStart = edate(i.forecastStart, m);
    const monthEnd = addDays(edate(i.forecastStart, m + 1), -1);

    let signed = 0;
    let pencilled = 0;
    let pencilledWeighted = 0;
    for (const c of i.clients) {
      if (!feeFallsInMonth(c, monthStart)) continue;
      if (c.status === 'Signed') signed += c.monthlyFee;
      else {
        pencilled += c.monthlyFee;
        pencilledWeighted += c.monthlyFee * pencilledProbability(c, i.defaultProbability);
      }
    }

    const overageBooked = i.monthlyOverageCharges[m] ?? 0;
    const rechargeableExpenses = i.monthlyRechargeableExpenses[m] ?? 0;
    const clientDays = i.monthlyClientDays[m] ?? 0;
    const capacityDays = i.monthlyCapacityDays[m] ?? 0;
    const committed = signed + overageBooked + rechargeableExpenses;

    rows.push({
      monthStart,
      monthEnd,
      signed,
      pencilled,
      pencilledWeighted,
      overageBooked,
      rechargeableExpenses,
      committed,
      weighted: committed + pencilledWeighted,
      clientDays,
      capacityDays,
      utilisation: capacityDays === 0 ? 0 : clientDays / capacityDays,
    });
  }
  return rows;
}

export function forecastTotals(rows: readonly ForecastMonth[]) {
  const sum = (f: (r: ForecastMonth) => number) => rows.reduce((a, r) => a + f(r), 0);
  return {
    signed: sum((r) => r.signed),
    pencilled: sum((r) => r.pencilled),
    pencilledWeighted: sum((r) => r.pencilledWeighted),
    overageBooked: sum((r) => r.overageBooked),
    rechargeableExpenses: sum((r) => r.rechargeableExpenses),
    committed: sum((r) => r.committed),
    weighted: sum((r) => r.weighted),
    clientDays: sum((r) => r.clientDays),
    capacityDays: sum((r) => r.capacityDays),
  };
}
