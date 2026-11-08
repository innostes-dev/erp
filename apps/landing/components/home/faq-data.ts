/**
 * Questions founders actually ask, answered plainly. The same list is emitted as
 * FAQPage structured data so search engines and AI assistants can quote it directly.
 * Keep every answer true; edit here and both the page and the schema update.
 */
export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is INNOSTES?',
    a: 'INNOSTES is an open-source business operating system. Hiring, HR, payroll, sales, inventory, projects, documents and accounting run as connected modules on one shared core, so every team works from the same data.',
  },
  {
    q: 'Is INNOSTES really free?',
    a: 'Yes. INNOSTES is MIT-licensed and free to self-host, with no per-seat fees. If you would rather not run it yourself, our team can set it up and manage it for you as a paid service.',
  },
  {
    q: 'Can I self-host INNOSTES?',
    a: 'Yes. You can run INNOSTES on your own servers with Docker. Your records stay in your own PostgreSQL database, and you can export everything at any time.',
  },
  {
    q: 'Which modules does INNOSTES include?',
    a: 'HireFlow (recruiting), PeopleOps (HR, attendance, leave and payroll), SalesFlow (CRM), LedgerFlow (accounting), StockFlow (inventory and assets), SprintFlow (projects) and DocFlow (documents). Some modules are still in preview.',
  },
  {
    q: 'Do I have to use every module?',
    a: 'No. Start with the modules you need and switch on others later. Each one shares data with the rest automatically, so nothing has to be re-entered.',
  },
  {
    q: 'Can my developers build on top of it?',
    a: 'Yes. Every module has a REST API with an OpenAPI spec, and the same React design system the product uses is available to your team.',
  },
  {
    q: 'Who is INNOSTES for?',
    a: 'Founders and growing companies that want one system for running the business instead of many disconnected tools.',
  },
];

