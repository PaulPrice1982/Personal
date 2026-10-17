// Review F-001: month-end and leap-day contract starts roll over on the
// clamped renewal date, never a day late.
import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, fromSerial, termPosition, toSerial } from '../core/index.js';

describe('F-001 term edges', () => {
  it('29/02/2024 start, as at 28/02/2025: term 2 has begun', () => {
    expect(termPosition('2024-02-29', '2025-02-28').currentTermStart).toBe('2025-02-28');
  });
  it('29/02/2024 start, as at 27/02/2025: still term 1, ending 27/02/2025', () => {
    expect(termPosition('2024-02-29', '2025-02-27').currentTermEnd).toBe('2025-02-27');
  });
  it('6-month term from 31/08/2026, as at 28/02/2027: term 2 has begun', () => {
    expect(termPosition('2026-08-31', '2027-02-28', 6).currentTermStart).toBe('2027-02-28');
  });
  it('31/01/2026 start: notice deadline 02/11/2026 (renewal 31/01/2027 minus 90)', () => {
    expect(termPosition('2026-01-31', '2026-10-17').noticeDeadline).toBe('2026-11-02');
  });
  it('third term: start 01/03/2025, as at 02/03/2027', () => {
    const p = termPosition('2025-03-01', '2027-03-02');
    expect(p.termsCompleted).toBe(2);
    expect(p.currentTermStart).toBe('2027-03-01');
    expect(p.currentTermEnd).toBe('2028-02-29');
    expect(p.renewalDate).toBe('2028-03-01');
    expect(p.noticeDeadline).toBe('2027-12-02');
  });
  it('the as-at date always lies inside the reported term (2024-2028 sweep)', () => {
    const starts = [
      '2024-01-01', '2024-02-29', '2024-03-31', '2024-05-30', '2025-10-29',
      '2026-01-31', '2026-08-31', '2026-12-31',
    ];
    for (const start of starts) {
      for (let s = toSerial(start); s <= toSerial('2028-12-31'); s += 37) {
        const asAt = fromSerial(s);
        const p = termPosition(start, asAt);
        expect(p.currentTermStart <= asAt).toBe(true);
        expect(asAt <= p.currentTermEnd).toBe(true);
        expect(p.renewalDate).toBe(addDays(p.currentTermEnd, 1));
      }
    }
  });
  it('the notice deadline is exactly 90 days before renewal, for any start', () => {
    for (let k = 0; k < 100; k++) {
      const start = fromSerial(toSerial('2024-01-01') + ((k * 37) % 1200));
      const p = termPosition(start, '2026-10-17');
      expect(daysBetween(p.noticeDeadline, p.renewalDate)).toBe(90);
    }
  });
});
