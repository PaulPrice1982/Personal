import type { CapacitySettings, Thresholds } from './settings.js';

// Annual capacity model (spec section 11; spreadsheet Assumptions + What If B16).
// Leave is shared across businesses in proportion to their weekly days.
// Bank holidays are absorbed by Detent first, then Other, then Veridian.

export interface AnnualCapacity {
  veridian: number;
  detent: number;
  other: number;
  leaveOnVeridian: number;
  leaveOnDetent: number;
  leaveOnOther: number;
}

export function annualCapacity(s: CapacitySettings): AnnualCapacity {
  const total = s.veridianPerWeek + s.detentPerWeek + s.otherPerWeek;
  const leaveShare = (perWeek: number) => (total === 0 ? 0 : (s.leaveDays * perWeek) / total);

  const leaveOnVeridian = leaveShare(s.veridianPerWeek);
  const leaveOnDetent = leaveShare(s.detentPerWeek);
  const leaveOnOther = leaveShare(s.otherPerWeek);

  const detentBase = 52 * s.detentPerWeek - leaveOnDetent;
  const otherBase = 52 * s.otherPerWeek - leaveOnOther;
  const veridianBase = 52 * s.veridianPerWeek - leaveOnVeridian;

  const detent = Math.max(0, detentBase - s.bankHolidays);
  const afterDetent = Math.max(0, s.bankHolidays - detentBase);
  const other = Math.max(0, otherBase - afterDetent);
  const afterOther = Math.max(0, afterDetent - otherBase);
  const veridian = Math.max(0, veridianBase - afterOther);

  return { veridian, detent, other, leaveOnVeridian, leaveOnDetent, leaveOnOther };
}

export function revenueAtFullCapacity(veridianDays: number, dayRate: number): number {
  return veridianDays * dayRate;
}

// Utilisation status (Dashboard B15 / What If B23).
export type CapacityStatus = 'STOP: no new clients' | 'Thin: selective only' | 'Open for new clients';

export function capacityStatus(utilisation: number, t: Thresholds): CapacityStatus {
  if (utilisation >= t.red) return 'STOP: no new clients';
  if (utilisation >= t.amber) return 'Thin: selective only';
  return 'Open for new clients';
}

// --- Weekly capacity (spreadsheet Weekly Capacity sheet) ---

export interface WeekInputs {
  workingDays: number;   // weekdays in the week minus bank holidays
  leave: number;         // counted leave values in the week
  detent: number;
  adminBd: number;
  other: number;
  clientDays: number;    // counted client values in the week
}

export interface WeekSummary extends WeekInputs {
  veridianCapacity: number;
  unallocated: number;
  status: WeekStatus;
}

export type WeekStatus = 'Off' | 'Overbooked' | 'Full' | 'Thin' | 'Open';

export function weeklyVeridianCapacity(workingDays: number, leave: number, veridianPerWeek: number): number {
  return Math.max(0, Math.min(veridianPerWeek, workingDays - leave));
}

export function weekStatus(clientDays: number, veridianCapacity: number): WeekStatus {
  if (veridianCapacity === 0) return clientDays > 0 ? 'Overbooked' : 'Off';
  if (clientDays > veridianCapacity) return 'Overbooked';
  if (clientDays >= veridianCapacity) return 'Full';
  if (clientDays > 0 && clientDays >= (veridianCapacity * 2) / 3) return 'Thin';
  return 'Open';
}

export function summariseWeek(inputs: WeekInputs, veridianPerWeek: number): WeekSummary {
  const veridianCapacity = weeklyVeridianCapacity(inputs.workingDays, inputs.leave, veridianPerWeek);
  const allocated =
    inputs.leave + inputs.detent + inputs.adminBd + inputs.other + inputs.clientDays;
  return {
    ...inputs,
    veridianCapacity,
    unallocated: inputs.workingDays - allocated,
    status: weekStatus(inputs.clientDays, veridianCapacity),
  };
}
