import { daysBetween, type ISODate } from './dates.js';

// Client alert, one per client, highest priority first (spec section 17;
// Retainer Calculator V).

export type ClientAlert =
  | 'Over allowance'
  | 'Confirm past days'
  | 'Nearly used'
  | 'Unused days at risk'
  | 'Notice deadline soon'
  | 'OK';

export interface AlertInputs {
  overageDays: number;         // booked beyond allowance (allowance basis)
  unconfirmedPastDays: number;
  allowanceDays: number;
  remainingDays: number;       // allowance - booked
  asAt: ISODate;
  currentTermEnd?: ISODate;    // absent when no contract start is set
  noticeDeadline?: ISODate;
}

export function clientAlert(i: AlertInputs): ClientAlert {
  if (i.overageDays > 0) return 'Over allowance';
  if (i.unconfirmedPastDays > 0) return 'Confirm past days';
  if (i.allowanceDays > 0 && i.remainingDays <= i.allowanceDays * 0.1) return 'Nearly used';
  if (!i.currentTermEnd || !i.noticeDeadline) return 'OK';
  if (
    daysBetween(i.asAt, i.currentTermEnd) <= 60 &&
    i.remainingDays > i.allowanceDays * 0.25
  ) {
    return 'Unused days at risk';
  }
  const toDeadline = daysBetween(i.asAt, i.noticeDeadline);
  if (toDeadline >= 0 && toDeadline <= 30) return 'Notice deadline soon';
  return 'OK';
}
