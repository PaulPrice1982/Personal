import {
  annualCapacity,
  capacityStatus,
  summariseWeek,
  type CapacityStatus,
  type WeekInputs,
  type WeekStatus,
} from './capacity.js';
import type { PlannerSettings, Rates } from './settings.js';
import { pricePackage, workingWeeks, type Frequency } from './packages.js';

// What-if scenarios (spec section 16; What If sheet). Scenarios never touch
// real data; "Make pencilled" is an app-layer action that copies the scenario
// clients in as pencilled.

export interface ScenarioClient {
  name: string;
  frequency: Frequency;
}

export interface ScenarioInputs {
  includePencilled: boolean;
  veridianDaysPerWeek: number; // scenario override
  rates: Rates;                // scenario override (defaults to settings rates)
  signedDaysToday: number;     // signed allowance days
  pencilledDaysToday: number;  // pencilled allowance days
  signedRevenueToday: number;  // annual retainer revenue, signed
  pencilledRevenueToday: number;
  newClients: readonly ScenarioClient[];
}

export interface ScenarioResult {
  capacityDays: number;
  committedDays: number;
  addedDays: number;
  headroomDays: number;
  utilisation: number;
  capacityStatus: CapacityStatus;
  averageClientDaysPerWeek: number;
  weeklyFit: string;
  revenueToday: number;
  revenueAdded: number;
  totalAnnualRevenue: number;
  verdict: string;
}

// A22: the week strip shows what each real week's status becomes once the
// scenario's extra client days land on it (from the scenario clients'
// frequencies and start dates, projected per week by the caller).
export function weekStrip(
  weeks: readonly WeekInputs[],
  scenarioDaysByWeek: readonly number[],
  veridianPerWeek: number,
): WeekStatus[] {
  return weeks.map(
    (w, i) =>
      summariseWeek(
        { ...w, clientDays: w.clientDays + (scenarioDaysByWeek[i] ?? 0) },
        veridianPerWeek,
      ).status,
  );
}

export function runScenario(i: ScenarioInputs, settings: PlannerSettings): ScenarioResult {
  // Scenario capacity: the days moved away from Veridian go to the other
  // businesses (and vice versa), bank holidays re-absorbed there first.
  const totalPerWeek =
    settings.capacity.veridianPerWeek +
    settings.capacity.detentPerWeek +
    settings.capacity.otherPerWeek;
  const capacityDays = annualCapacity({
    veridianPerWeek: i.veridianDaysPerWeek,
    detentPerWeek: Math.max(0, totalPerWeek - i.veridianDaysPerWeek),
    otherPerWeek: 0,
    leaveDays: settings.capacity.leaveDays,
    bankHolidays: settings.capacity.bankHolidays,
  }).veridian;

  const wks = workingWeeks(settings.capacity.leaveDays);
  let addedDays = 0;
  let revenueAdded = 0;
  for (const c of i.newClients) {
    const p = pricePackage(c.frequency, i.rates, wks);
    addedDays += p.allowanceDays;
    revenueAdded += p.annualFee;
  }

  const pencilledDays = i.includePencilled ? i.pencilledDaysToday : 0;
  const committedDays = i.signedDaysToday + pencilledDays + addedDays;
  const utilisation = capacityDays === 0 ? 0 : committedDays / capacityDays;
  const status = capacityStatus(utilisation, settings.thresholds);
  const avgPerWeek = committedDays / wks;

  const revenueToday =
    i.signedRevenueToday + (i.includePencilled ? i.pencilledRevenueToday : 0);

  const verdict =
    utilisation >= settings.thresholds.red
      ? 'No: over the stop threshold'
      : utilisation >= settings.thresholds.amber
        ? 'Yes, but capacity becomes thin'
        : 'Yes: fits comfortably';

  return {
    capacityDays,
    committedDays,
    addedDays,
    headroomDays: capacityDays - committedDays,
    utilisation,
    capacityStatus: status,
    averageClientDaysPerWeek: avgPerWeek,
    weeklyFit:
      avgPerWeek <= i.veridianDaysPerWeek
        ? `Fits in ${i.veridianDaysPerWeek} days a week`
        : `Needs ${avgPerWeek.toFixed(1)} days a week`,
    revenueToday,
    revenueAdded,
    totalAnnualRevenue: revenueToday + revenueAdded,
    verdict,
  };
}
