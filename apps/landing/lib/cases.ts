/**
 * Real startup cases (anonymised). Single source for /build, the homepage and module pages.
 * Keep every line true. To add a case, add it here and tag the modules it used.
 */
export interface CaseStudy {
  id: string;
  /** Module slugs this case belongs to (shown on those module pages). */
  modules: string[];
  asked: string;
  /** One-line hook for compact cards. */
  hook: string;
  found: string;
  built: string;
  outcome: string;
}

export const CASES: CaseStudy[] = [
  {
    id: 'private-hrms',
    modules: ['peopleops'],
    asked: '“We need an HRMS.”',
    hook: 'The real problem was privacy, on a startup budget.',
    found:
      "The real worry was privacy. They didn't want employee records sitting in a third-party system, and as a startup they couldn't pay for fully custom software.",
    built:
      'PeopleOps from INNOSTES, running on their own server, shaped to their policies. Dedicated software without dedicated-software cost.',
    outcome: 'Their employee data stays with them, for a fraction of the cost of building from scratch.',
  },
  {
    id: 'hours-to-invoices',
    modules: ['peopleops', 'ledgerflow'],
    asked: '“We need invoicing software.”',
    hook: 'The real problem was re-typing the same hours twice.',
    found:
      "An agency already tracked log-ins and log-outs, then re-typed the same hours into timesheets by hand to bill clients. Invoicing tools were too costly, and they didn't want client data with a third party.",
    built:
      'Attendance flows straight into timesheets, and approved timesheets become client invoices. One system, on their own server.',
    outcome: 'No more re-typing hours. Invoices come from the same record as the work.',
  },
];
