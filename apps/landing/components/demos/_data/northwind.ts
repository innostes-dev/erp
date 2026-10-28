export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percentage, e.g. 18
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerGstin: string;
  customerCity: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  items: InvoiceItem[];
}

export const NORTHWIND_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0801',
    customerName: 'Kirloskar Heavy Industries Ltd',
    customerGstin: '29AAACK1940P1ZB',
    customerCity: 'Bengaluru, Karnataka',
    issueDate: '2026-10-15',
    dueDate: '2026-11-14',
    subtotal: 380000,
    taxTotal: 68400,
    totalAmount: 448400,
    status: 'paid',
    items: [
      { id: 'item-1', description: 'Hydraulic high-pressure valve seals', hsn: '8481', quantity: 200, unitPrice: 1200, taxRate: 18, amount: 240000 },
      { id: 'item-2', description: 'High-tensile industrial gasket couplings', hsn: '4016', quantity: 140, unitPrice: 1000, taxRate: 18, amount: 140000 },
    ],
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-0802',
    customerName: 'Mysore Sandalwood Distilleries',
    customerGstin: '29AABCM8291Q1ZH',
    customerCity: 'Mysuru, Karnataka',
    issueDate: '2026-10-18',
    dueDate: '2026-11-17',
    subtotal: 125000,
    taxTotal: 22500,
    totalAmount: 147500,
    status: 'pending',
    items: [
      { id: 'item-3', description: 'Food-grade stainless steel storage canisters', hsn: '7310', quantity: 50, unitPrice: 2500, taxRate: 18, amount: 125000 },
    ],
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-0803',
    customerName: 'TVS Motor Logistics Division',
    customerGstin: '33AABCT2319K1Z5',
    customerCity: 'Hosur, Tamil Nadu',
    issueDate: '2026-09-20',
    dueDate: '2026-10-20',
    subtotal: 540000,
    taxTotal: 97200,
    totalAmount: 637200,
    status: 'overdue',
    items: [
      { id: 'item-4', description: 'Heavy-duty conveyor belt rollers 400mm', hsn: '8431', quantity: 120, unitPrice: 4500, taxRate: 18, amount: 540000 },
    ],
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-2026-0804',
    customerName: 'BHEL Electrical Systems',
    customerGstin: '29AAACB1209L1Z8',
    customerCity: 'Bengaluru, Karnataka',
    issueDate: '2026-10-22',
    dueDate: '2026-11-21',
    subtotal: 210000,
    taxTotal: 37800,
    totalAmount: 247800,
    status: 'pending',
    items: [
      { id: 'item-5', description: 'Copper busbar terminal connectors', hsn: '7407', quantity: 300, unitPrice: 700, taxRate: 18, amount: 210000 },
    ],
  },
  {
    id: 'inv-5',
    invoiceNumber: 'INV-2026-0805',
    customerName: 'Mangalore Chemicals & Fertilizers',
    customerGstin: '29AAACM3389J1ZX',
    customerCity: 'Mangaluru, Karnataka',
    issueDate: '2026-10-25',
    dueDate: '2026-11-24',
    subtotal: 82000,
    taxTotal: 14760,
    totalAmount: 96760,
    status: 'draft',
    items: [
      { id: 'item-6', description: 'PTFE acid-resistant pump seals', hsn: '3926', quantity: 40, unitPrice: 2050, taxRate: 18, amount: 82000 },
    ],
  },
];

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'on_leave';
  joinDate: string;
  directReportsCount: number;
}

export const NORTHWIND_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-101',
    name: 'Aarav Sharma',
    role: 'Head of Supply Chain & Logistics',
    department: 'Supply Chain',
    email: 'aarav.sharma@northwind.co.in',
    phone: '+91 98450 12831',
    location: 'Bengaluru Central Hub',
    status: 'active',
    joinDate: '12 Jan 2021',
    directReportsCount: 14,
  },
  {
    id: 'EMP-102',
    name: 'Priya Patel',
    role: 'Lead Quality Engineer',
    department: 'Quality Assurance',
    email: 'priya.patel@northwind.co.in',
    phone: '+91 98861 45920',
    location: 'Bengaluru Central Hub',
    status: 'active',
    joinDate: '04 Mar 2022',
    directReportsCount: 6,
  },
  {
    id: 'EMP-103',
    name: 'Rajesh Kumar',
    role: 'Senior Procurement Specialist',
    department: 'Procurement',
    email: 'rajesh.kumar@northwind.co.in',
    phone: '+91 97412 89014',
    location: 'Chennai Port Depot',
    status: 'active',
    joinDate: '18 Aug 2020',
    directReportsCount: 4,
  },
  {
    id: 'EMP-104',
    name: 'Sunita Rao',
    role: 'Chief Financial Controller',
    department: 'Finance & Accounts',
    email: 'sunita.rao@northwind.co.in',
    phone: '+91 99002 34189',
    location: 'Bengaluru Central Hub',
    status: 'active',
    joinDate: '15 Nov 2019',
    directReportsCount: 9,
  },
  {
    id: 'EMP-105',
    name: 'Vikram Mehta',
    role: 'Warehouse Dispatch Lead',
    department: 'Operations',
    email: 'vikram.mehta@northwind.co.in',
    phone: '+91 96118 70243',
    location: 'Hyderabad Distribution',
    status: 'on_leave',
    joinDate: '01 Jun 2023',
    directReportsCount: 11,
  },
];

export interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: 'Applied' | 'Screening' | 'Technical' | 'Offer' | 'Hired';
  experienceYears: number;
  expectedSalary: number;
  rating: number; // 1-5
  noticePeriodDays: number;
  notes: string;
}

export const NORTHWIND_CANDIDATES: Candidate[] = [
  {
    id: 'CND-401',
    name: 'Devendra Singh',
    role: 'Logistics Fleet Dispatcher',
    stage: 'Applied',
    experienceYears: 4,
    expectedSalary: 750000,
    rating: 4,
    noticePeriodDays: 30,
    notes: 'Prior experience managing multi-axle freight carriers across Karnataka and Tamil Nadu corridors.',
  },
  {
    id: 'CND-402',
    name: 'Ananya Sen',
    role: 'Procurement Intelligence Analyst',
    stage: 'Screening',
    experienceYears: 6,
    expectedSalary: 1200000,
    rating: 5,
    noticePeriodDays: 60,
    notes: 'Expert in commodity raw material pricing indexation and vendor e-auction negotiation.',
  },
  {
    id: 'CND-403',
    name: 'Karthik Nair',
    role: 'Warehouse Operations Lead',
    stage: 'Technical',
    experienceYears: 8,
    expectedSalary: 1450000,
    rating: 5,
    noticePeriodDays: 15,
    notes: 'Completed technical assignment on 3-tier warehouse layout optimization and pallet replenishment algorithms.',
  },
  {
    id: 'CND-404',
    name: 'Deepika Reddy',
    role: 'Quality Systems Auditor',
    stage: 'Offer',
    experienceYears: 5,
    expectedSalary: 950000,
    rating: 4,
    noticePeriodDays: 30,
    notes: 'Formal offer extended on 27 Oct 2026. Awaiting background check clearance from Bangalore Police verification portal.',
  },
  {
    id: 'CND-405',
    name: 'Manoj Pillai',
    role: 'Senior Inventory Controller',
    stage: 'Hired',
    experienceYears: 7,
    expectedSalary: 1100000,
    rating: 5,
    noticePeriodDays: 0,
    notes: 'Completed onboard joining ceremonies on 24 Oct 2026; assigned to Central Hub Section 4.',
  },
];
