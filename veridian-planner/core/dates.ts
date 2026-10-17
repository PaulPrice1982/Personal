// Date helpers. All dates are ISO strings (YYYY-MM-DD); arithmetic is done on
// UTC day serials so no local timezone can shift a date.

export type ISODate = string;

export function toSerial(d: ISODate): number {
  const [y, m, dd] = d.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, dd) / 86400000;
}

export function fromSerial(n: number): ISODate {
  return new Date(n * 86400000).toISOString().slice(0, 10);
}

export function iso(y: number, m: number, d: number): ISODate {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parts(d: ISODate): { y: number; m: number; d: number } {
  const [y, m, dd] = d.split('-').map(Number) as [number, number, number];
  return { y, m, d: dd };
}

export function addDays(d: ISODate, n: number): ISODate {
  return fromSerial(toSerial(d) + n);
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return toSerial(b) - toSerial(a);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// Excel EDATE: same day n months on, clamped to the target month's length.
export function edate(d: ISODate, months: number): ISODate {
  const p = parts(d);
  const total = p.y * 12 + (p.m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12 + 12) % 12 + 1;
  return iso(ny, nm, Math.min(p.d, daysInMonth(ny, nm)));
}

// Excel EOMONTH: last day of the month n months on.
export function eomonth(d: ISODate, months: number): ISODate {
  const p = parts(d);
  const total = p.y * 12 + (p.m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12 + 12) % 12 + 1;
  return iso(ny, nm, daysInMonth(ny, nm));
}

export function startOfMonth(d: ISODate): ISODate {
  const p = parts(d);
  return iso(p.y, p.m, 1);
}

// Excel DATEDIF(start, end, "m"): complete calendar months between two dates.
export function completeMonthsBetween(start: ISODate, end: ISODate): number {
  const a = parts(start);
  const b = parts(end);
  let months = (b.y - a.y) * 12 + (b.m - a.m);
  if (b.d < a.d) months -= 1;
  return months;
}

// 0 = Monday ... 6 = Sunday (serial 0 = 1970-01-01, a Thursday).
export function weekdayMon0(d: ISODate): number {
  return (((toSerial(d) + 3) % 7) + 7) % 7;
}

export function isWeekend(d: ISODate): boolean {
  return weekdayMon0(d) >= 5;
}

export function weekCommencing(d: ISODate): ISODate {
  return addDays(d, -weekdayMon0(d));
}

export function isWorkingDay(d: ISODate, bankHolidays: ReadonlySet<ISODate>): boolean {
  return !isWeekend(d) && !bankHolidays.has(d);
}

// Working days strictly between two dates (exclusive of both ends).
export function workingDaysStrictlyBetween(
  a: ISODate,
  b: ISODate,
  bankHolidays: ReadonlySet<ISODate> = new Set(),
): number {
  let count = 0;
  for (let s = toSerial(a) + 1; s < toSerial(b); s++) {
    if (isWorkingDay(fromSerial(s), bankHolidays)) count++;
  }
  return count;
}

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let s = toSerial(from); s <= toSerial(to); s++) out.push(fromSerial(s));
  return out;
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a <= b ? a : b;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a >= b ? a : b;
}

export function formatUK(d: ISODate): string {
  const p = parts(d);
  return `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.y}`;
}
