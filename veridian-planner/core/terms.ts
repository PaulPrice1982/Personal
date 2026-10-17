import { addDays, edate, formatUK, type ISODate } from './dates.js';

// Contract term maths (spec section 10; Retainer Calculator K..O, U).
// Terms auto-renew for the same length; unused days expire at term end.
// Review F-001: terms are counted by walking edate anniversaries rather than
// DATEDIF months, so starts on the 29th to 31st (including 29/02) roll over
// on the clamped renewal date instead of a day late.

export interface TermPosition {
  termsCompleted: number;
  currentTermStart: ISODate;
  currentTermEnd: ISODate;
  renewalDate: ISODate;
  noticeDeadline: ISODate;
}

export function termPosition(
  contractStart: ISODate,
  asAt: ISODate,
  termMonths = 12,
  noticeDays = 90,
): TermPosition {
  let termsCompleted = 0;
  if (asAt >= contractStart) {
    while (edate(contractStart, termMonths * (termsCompleted + 1)) <= asAt) termsCompleted++;
  }
  const currentTermStart = edate(contractStart, termMonths * termsCompleted);
  const renewalDate = edate(contractStart, termMonths * (termsCompleted + 1));
  const currentTermEnd = addDays(renewalDate, -1);
  return {
    termsCompleted,
    currentTermStart,
    currentTermEnd,
    renewalDate,
    noticeDeadline: addDays(renewalDate, -noticeDays),
  };
}

export type ContractStatusKind = 'auto_renews' | 'ends' | 'late_notice';

export interface ContractStatus {
  kind: ContractStatusKind;
  date: ISODate; // renewal date for auto_renews / late_notice; term end for ends
  label: string;
}

export function contractStatus(pos: TermPosition, noticeGivenOn?: ISODate): ContractStatus {
  if (!noticeGivenOn) {
    return {
      kind: 'auto_renews',
      date: pos.renewalDate,
      label: `Auto-renews ${formatUK(pos.renewalDate)}`,
    };
  }
  if (noticeGivenOn <= pos.noticeDeadline) {
    return {
      kind: 'ends',
      date: pos.currentTermEnd,
      label: `Ends ${formatUK(pos.currentTermEnd)}`,
    };
  }
  // Late notice stands but does not stop the renewal (admin can override; the
  // override is logged at the app layer).
  return {
    kind: 'late_notice',
    date: pos.renewalDate,
    label: `Late notice: renews ${formatUK(pos.renewalDate)}`,
  };
}
