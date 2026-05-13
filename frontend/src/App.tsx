import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  CreditCard,
  TrendingUp,
  ArrowLeftRight,
  Search,
  Activity,
  Calculator,
  LogOut,
  ChevronRight,
  FileText,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
} from "lucide-react";
import {
  findDuplicateCustomers,
  findDuplicateIds,
  parseHashRoute,
} from "./crmLogic";
import "./styles/global.css";
import "./styles/appointment-workflow.css";
import "./styles/premium-modals.css";
import "./styles/premium-ui.css";
import "./styles/premium-desk.css";
import "./styles/premium-profile.css";
import "./styles/premium-lists.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type RoStatus =
  | "Check-In"
  | "In Progress"
  | "On Hold - Parts"
  | "Multi-Point"
  | "Ready"
  | "Closed";

type ServiceLine = {
  id: number;
  description: string;
  type: "Maintenance" | "Repair" | "Recall" | "Concern";
  laborHours: number;
  laborTotal: number;
  partsTotal: number;
  tech?: string;
  status: "Open" | "In Progress" | "Complete";
};

type RepairOrder = {
  id: number;
  roNumber: string;
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleMileageIn: number;
  vehicleVin?: string;
  advisor: string;
  technician: string;
  status: RoStatus;
  promisedTime?: string;
  lines: ServiceLine[];
  laborTotal: number;
  partsTotal: number;
  total: number;
  notes?: string;
  createdAt: string;
  closedAt?: string;
};

type CustomerStatus =
  | "New Lead"
  | "Contacted"
  | "Appt Set"
  | "Appt Show"
  | "Working"
  | "Sold"
  | "Lost";
type LeadTemp = "Hot" | "Warm" | "Cold";

type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  temperature?: LeadTemp;
  interestedVehicle: string;
  source?: string;
  assignedTo?: string;
  nextFollowUp?: string;
  createdAt?: string;
  address?: string;
};

type FinanceApplication = {
  id: number;
  customerId: number;
  applicantName?: string;
  dateOfBirth?: string;
  ssnLast4?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  employerName?: string;
  jobTitle?: string;
  employmentStatus: string;
  timeOnJob?: string;
  monthlyIncome: number;
  otherIncome?: number;
  creditRange: string;
  downPayment: number;
  requestedVehicle?: string;
  tradePayoff?: number;
  requestedAmount?: number;
  termMonths?: number;
  lender?: string;
  decisionNotes?: string;
  consentToPullCredit?: boolean;
  status: "New" | "Submitted" | "Approved" | "Needs Review";
};

type CreditApplication = {
  id: number;
  customerId: number;
  applicantName: string;
  dateOfBirth: string;
  ssnLast4: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  residenceType: string;
  timeAtAddress: string;
  employerName: string;
  jobTitle: string;
  employmentStatus: string;
  timeOnJob: string;
  monthlyIncome: number;
  otherIncome: number;
  bankName: string;
  downPayment: number;
  requestedVehicle: string;
  consentToPullCredit: boolean;
  status: "Draft" | "Submitted" | "Manager Review" | "Approved" | "Declined";
  submittedAt: string;
};

type TradeIn = {
  id: number;
  customerId: number;
  year: string;
  make: string;
  model: string;
  mileage: number;
  payoff: number;
  estimatedValue: number;
  notes?: string;
};

type VehicleSale = {
  id: number;
  customerId: number;
  stockNumber: string;
  year: string;
  make: string;
  model: string;
  salePrice: number;
  stage: "Working" | "Finance" | "Delivered" | "Lost";
};

type VinDecodedVehicle = {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  bodyClass: string;
  engine: string;
  driveType: string;
  transmission: string;
  doors: string;
  fuelType: string;
  manufacturer: string;
  country: string;
  warning?: string;
};

type Activity = {
  id: number;
  customerId: number;
  type: "Call" | "Text" | "Email" | "Appointment" | "Note";
  note: string;
  createdAt: string;
};

type CrmTask = {
  id: number;
  customerId: number;
  title: string;
  type: "Call" | "Text" | "Email" | "Appointment" | "Follow-Up";
  dueAt: string;
  assignedTo: string;
  priority: "Low" | "Normal" | "High";
  status: "Open" | "Showroom" | "Complete";
  createdAt: string;
  completedAt?: string;
};

type Message = {
  id: number;
  customerId: number;
  channel: "Text" | "Email";
  direction: "Outbound" | "Inbound";
  subject?: string;
  body: string;
  template?: string;
  createdAt: string;
};

type BootstrapData = {
  customers: Customer[];
  financeApplications: FinanceApplication[];
  creditApplications: CreditApplication[];
  tradeIns: TradeIn[];
  vehicleSales: VehicleSale[];
  activities: Activity[];
  tasks?: CrmTask[];
  messages?: Message[];
  repairOrders?: RepairOrder[];
};

type UserAccount = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
};
type CurrentUser = UserAccount;

type SavedDeskDeal = {
  id: number;
  customerId: number;
  desk: Record<string, string | boolean>;
  monthly: number;
  amountFinanced: number;
  createdAt: string;
};

type ProfileTab =
  | "overview"
  | "finance"
  | "credit"
  | "deals"
  | "followup"
  | "appointments"
  | "messages"
  | "activity"
  | "service";
type AppPage =
  | "dashboard"
  | "leads"
  | "customers"
  | "appointments"
  | "finance"
  | "pipeline"
  | "trades"
  | "vin"
  | "activities"
  | "desk"
  | "service";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:4000";

// ── Seed data ─────────────────────────────────────────────────────────────────

const initialRepairOrders: RepairOrder[] = [
  {
    id: 1,
    roNumber: "RO-240501",
    customerId: 1,
    customerName: "Jordan Lee",
    customerPhone: "(555) 123-0148",
    vehicleYear: "2021",
    vehicleMake: "Toyota",
    vehicleModel: "Camry",
    vehicleMileageIn: 38200,
    vehicleVin: "4T1B11HK0MU000001",
    advisor: "Avery",
    technician: "Mike T.",
    status: "In Progress",
    promisedTime: "3:00 PM Today",
    lines: [
      {
        id: 1,
        description: "Oil & Filter Change",
        type: "Maintenance",
        laborHours: 0.5,
        laborTotal: 45,
        partsTotal: 28,
        tech: "Mike T.",
        status: "Complete",
      },
      {
        id: 2,
        description: "Rotate & Balance Tires",
        type: "Maintenance",
        laborHours: 0.5,
        laborTotal: 45,
        partsTotal: 0,
        tech: "Mike T.",
        status: "In Progress",
      },
    ],
    laborTotal: 90,
    partsTotal: 28,
    total: 118,
    notes: "Customer waiting in lounge.",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 2,
    roNumber: "RO-240502",
    customerName: "Walk-in Customer",
    customerPhone: "(555) 000-1234",
    vehicleYear: "2019",
    vehicleMake: "Ford",
    vehicleModel: "Explorer",
    vehicleMileageIn: 61400,
    advisor: "Sarah",
    technician: "Dan W.",
    status: "On Hold - Parts",
    promisedTime: "Tomorrow AM",
    lines: [
      {
        id: 1,
        description: "Replace Front Brake Pads & Rotors",
        type: "Repair",
        laborHours: 1.5,
        laborTotal: 135,
        partsTotal: 210,
        tech: "Dan W.",
        status: "Open",
      },
    ],
    laborTotal: 135,
    partsTotal: 210,
    total: 345,
    notes: "Waiting on rotors — ordered from warehouse.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 3,
    roNumber: "RO-240503",
    customerId: 5,
    customerName: "Riley Wilson",
    customerPhone: "(555) 456-7890",
    vehicleYear: "2022",
    vehicleMake: "Nissan",
    vehicleModel: "Altima",
    vehicleMileageIn: 14800,
    advisor: "Avery",
    technician: "Mike T.",
    status: "Ready",
    promisedTime: "12:00 PM",
    lines: [
      {
        id: 1,
        description: "Multi-Point Inspection",
        type: "Maintenance",
        laborHours: 0.5,
        laborTotal: 0,
        partsTotal: 0,
        tech: "Mike T.",
        status: "Complete",
      },
      {
        id: 2,
        description: "Cabin Air Filter",
        type: "Maintenance",
        laborHours: 0.3,
        laborTotal: 27,
        partsTotal: 22,
        tech: "Mike T.",
        status: "Complete",
      },
    ],
    laborTotal: 27,
    partsTotal: 22,
    total: 49,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 4,
    roNumber: "RO-240504",
    customerName: "Marcus Bell",
    customerPhone: "(555) 321-7654",
    vehicleYear: "2020",
    vehicleMake: "Chevy",
    vehicleModel: "Silverado",
    vehicleMileageIn: 52300,
    advisor: "Sarah",
    technician: "Unassigned",
    status: "Check-In",
    promisedTime: "EOD",
    lines: [
      {
        id: 1,
        description: "Check Engine Light Diagnosis",
        type: "Concern",
        laborHours: 1.0,
        laborTotal: 125,
        partsTotal: 0,
        tech: "",
        status: "Open",
      },
    ],
    laborTotal: 125,
    partsTotal: 0,
    total: 125,
    notes: "P0420 code — needs catalyst evaluation.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

const initialCustomers: Customer[] = [
  {
    id: 1,
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan@example.com",
    phone: "(555) 123-0148",
    status: "Appt Show",
    temperature: "Hot",
    interestedVehicle: "2024 Toyota Camry",
    source: "Cars.com",
    assignedTo: "Avery",
    nextFollowUp: "Today",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 2,
    firstName: "Taylor",
    lastName: "Smith",
    email: "taylor@example.com",
    phone: "(555) 981-4432",
    status: "Working",
    temperature: "Hot",
    interestedVehicle: "2023 Ford F-150",
    source: "Walk-in",
    assignedTo: "Avery",
    nextFollowUp: "Tomorrow",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 3,
    firstName: "Morgan",
    lastName: "Davis",
    email: "morgan@example.com",
    phone: "(555) 234-5678",
    status: "New Lead",
    temperature: "Warm",
    interestedVehicle: "2024 Honda CR-V",
    source: "Website Lead",
    assignedTo: "",
    nextFollowUp: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
  {
    id: 4,
    firstName: "Casey",
    lastName: "Johnson",
    email: "casey@example.com",
    phone: "(555) 345-6789",
    status: "Contacted",
    temperature: "Warm",
    interestedVehicle: "2023 Chevy Silverado",
    source: "AutoTrader",
    assignedTo: "Avery",
    nextFollowUp: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 5,
    firstName: "Riley",
    lastName: "Wilson",
    email: "riley@example.com",
    phone: "(555) 456-7890",
    status: "Sold",
    interestedVehicle: "2022 Nissan Altima",
    source: "Referral",
    assignedTo: "Mike",
    nextFollowUp: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 6,
    firstName: "Alex",
    lastName: "Brown",
    email: "alex@example.com",
    phone: "(555) 567-8901",
    status: "New Lead",
    temperature: "Cold",
    interestedVehicle: "2024 Jeep Wrangler",
    source: "Cars.com",
    assignedTo: "",
    nextFollowUp: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 7,
    firstName: "Sam",
    lastName: "Torres",
    email: "sam@example.com",
    phone: "(555) 678-9012",
    status: "Appt Set",
    temperature: "Warm",
    interestedVehicle: "2024 Hyundai Tucson",
    source: "Phone Call",
    assignedTo: "Mike",
    nextFollowUp: "Tomorrow 10am",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 8,
    firstName: "Dana",
    lastName: "Park",
    email: "dana@example.com",
    phone: "(555) 789-0123",
    status: "Lost",
    interestedVehicle: "2023 BMW 3-Series",
    source: "Cars.com",
    assignedTo: "Avery",
    nextFollowUp: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 9,
    firstName: "Ernesto",
    lastName: "Alverez",
    email: "ernesto.alverez@gmail.com",
    phone: "(713) 555-0294",
    status: "Working",
    temperature: "Hot",
    interestedVehicle: "2024 Ford Bronco Raptor",
    source: "Walk-In",
    assignedTo: "Avery",
    nextFollowUp: "Tomorrow 2pm",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

const initialFinanceApplications: FinanceApplication[] = [
  {
    id: 1,
    customerId: 2,
    applicantName: "Taylor Smith",
    employmentStatus: "Full-time",
    monthlyIncome: 6200,
    creditRange: "680-719",
    downPayment: 3500,
    status: "Submitted",
    requestedVehicle: "2023 Ford F-150",
  },
];

const initialTradeIns: TradeIn[] = [
  {
    id: 1,
    customerId: 2,
    year: "2018",
    make: "Honda",
    model: "Accord",
    mileage: 82000,
    payoff: 4200,
    estimatedValue: 12800,
  },
  {
    id: 2,
    customerId: 9,
    year: "2023",
    make: "Ford",
    model: "Bronco Raptor",
    mileage: 18400,
    payoff: 52000,
    estimatedValue: 68500,
    notes: "this is my thunder buddy",
  },
];

const initialVehicleSales: VehicleSale[] = [
  {
    id: 1,
    customerId: 2,
    stockNumber: "A1024",
    year: "2023",
    make: "Ford",
    model: "F-150",
    salePrice: 38995,
    stage: "Finance",
  },
  {
    id: 2,
    customerId: 5,
    stockNumber: "B2051",
    year: "2022",
    make: "Nissan",
    model: "Altima",
    salePrice: 22500,
    stage: "Delivered",
  },
];

// ── Tax helpers ────────────────────────────────────────────────────────────────

function zipToState(zip: string): string | null {
  if (!/^\d{5}$/.test(zip)) return null;
  const n = parseInt(zip.slice(0, 3));
  if (n >= 10 && n <= 27) return "MA";
  if (n >= 28 && n <= 29) return "RI";
  if (n >= 30 && n <= 38) return "NH";
  if (n >= 39 && n <= 49) return "ME";
  if (n >= 50 && n <= 59) return "VT";
  if (n >= 60 && n <= 69) return "CT";
  if (n >= 70 && n <= 89) return "NJ";
  if (n >= 100 && n <= 149) return "NY";
  if (n >= 150 && n <= 196) return "PA";
  if (n >= 197 && n <= 199) return "DE";
  if (n >= 200 && n <= 205) return "DC";
  if (n >= 206 && n <= 219) return "MD";
  if (n >= 220 && n <= 246) return "VA";
  if (n >= 247 && n <= 268) return "WV";
  if (n >= 270 && n <= 289) return "NC";
  if (n >= 290 && n <= 299) return "SC";
  if (n >= 300 && n <= 319) return "GA";
  if (n >= 320 && n <= 349) return "FL";
  if (n >= 350 && n <= 369) return "AL";
  if (n >= 370 && n <= 385) return "TN";
  if (n >= 386 && n <= 397) return "MS";
  if (n >= 400 && n <= 427) return "KY";
  if (n >= 430 && n <= 459) return "OH";
  if (n >= 460 && n <= 479) return "IN";
  if (n >= 480 && n <= 499) return "MI";
  if (n >= 500 && n <= 528) return "IA";
  if (n >= 530 && n <= 549) return "WI";
  if (n >= 550 && n <= 567) return "MN";
  if (n >= 570 && n <= 577) return "SD";
  if (n >= 580 && n <= 588) return "ND";
  if (n >= 590 && n <= 599) return "MT";
  if (n >= 600 && n <= 629) return "IL";
  if (n >= 630 && n <= 658) return "MO";
  if (n >= 660 && n <= 679) return "KS";
  if (n >= 680 && n <= 693) return "NE";
  if (n >= 700 && n <= 714) return "LA";
  if (n >= 716 && n <= 729) return "AR";
  if (n >= 730 && n <= 749) return "OK";
  if (n >= 750 && n <= 799) return "TX";
  if (n >= 800 && n <= 816) return "CO";
  if (n >= 820 && n <= 831) return "WY";
  if (n >= 832 && n <= 838) return "ID";
  if (n >= 840 && n <= 847) return "UT";
  if (n >= 850 && n <= 865) return "AZ";
  if (n >= 870 && n <= 884) return "NM";
  if (n >= 889 && n <= 899) return "NV";
  if (n >= 900 && n <= 961) return "CA";
  if (n >= 967 && n <= 968) return "HI";
  if (n >= 970 && n <= 979) return "OR";
  if (n >= 980 && n <= 994) return "WA";
  if (n >= 995 && n <= 999) return "AK";
  return null;
}

// Combined state + weighted-average local rates (2024 Tax Foundation data)
// These are AVERAGES — exact city/county rates vary; use the local override field in the desk tool
const STATE_AUTO_TAX: Record<string, { rate: number; note: string }> = {
  AL: { rate: 9.29, note: "State 2% + avg county/city 7.29%" },
  AK: { rate: 1.76, note: "No state tax; local-only avg 1.76%" },
  AZ: { rate: 8.37, note: "State 5.6% + avg local 2.77%" },
  AR: { rate: 9.47, note: "State 6.5% + avg local 2.97%" },
  CA: { rate: 8.85, note: "State 7.25% + avg district 1.60%" },
  CO: { rate: 7.81, note: "State 2.9% + avg local 4.91%" },
  CT: { rate: 6.35, note: "State-only; no local vehicle tax" },
  DE: { rate: 0.0, note: "No sales tax" },
  FL: { rate: 7.02, note: "State 6% + avg county surtax 1.02%" },
  GA: { rate: 7.0, note: "Flat 7% Title Ad Valorem Tax (TAVT)" },
  HI: { rate: 4.44, note: "General excise tax avg 4.44%" },
  ID: { rate: 6.03, note: "State 6% + avg local 0.03%" },
  IL: { rate: 8.86, note: "State 6.25% + avg local 2.61%" },
  IN: { rate: 7.0, note: "State-only; no local vehicle tax" },
  IA: { rate: 6.94, note: "State 6% + avg local 0.94%" },
  KS: { rate: 8.7, note: "State 6.5% + avg local 2.20%" },
  KY: { rate: 6.0, note: "State-only; no local vehicle tax" },
  LA: { rate: 9.55, note: "State 4.45% + avg local 5.10%" },
  ME: { rate: 5.5, note: "State-only; no local vehicle tax" },
  MD: { rate: 6.0, note: "State-only; no local vehicle tax" },
  MA: { rate: 6.25, note: "State-only; no local vehicle tax" },
  MI: { rate: 6.0, note: "State-only; no local vehicle tax" },
  MN: { rate: 7.49, note: "State 6.5% + avg local 0.99%" },
  MS: { rate: 7.07, note: "State 5% + avg local 2.07%" },
  MO: { rate: 8.3, note: "State 4.225% + avg local 4.07%" },
  MT: { rate: 0.0, note: "No sales tax" },
  NE: { rate: 6.94, note: "State 5.5% + avg local 1.44%" },
  NV: { rate: 8.23, note: "State 6.85% + avg local 1.38%" },
  NH: { rate: 0.0, note: "No sales tax" },
  NJ: { rate: 6.63, note: "State-only; uniform rate" },
  NM: { rate: 7.59, note: "State 4.875% + avg local 2.71%" },
  NY: { rate: 8.52, note: "State 4% + avg county/city 4.52%" },
  NC: { rate: 3.0, note: "3% Highway Use Tax — capped at $450/vehicle" },
  ND: { rate: 5.97, note: "State 5% + avg local 0.97%" },
  OH: { rate: 7.23, note: "State 5.75% + avg county 1.48%" },
  OK: {
    rate: 8.98,
    note: "State 4.5% + avg local 4.48%; excise tax also applies",
  },
  OR: { rate: 0.0, note: "No sales tax" },
  PA: {
    rate: 6.34,
    note: "State 6% + local avg 0.34% (Phila/Allegheny add ~2%)",
  },
  RI: { rate: 7.0, note: "State-only; no local vehicle tax" },
  SC: { rate: 5.0, note: "5% capped at $500 per vehicle" },
  SD: { rate: 6.4, note: "State 4.5% + avg local 1.90%" },
  TN: { rate: 9.55, note: "State 7% + avg local 2.55%" },
  TX: { rate: 8.2, note: "State 6.25% + avg local 1.95%" },
  UT: { rate: 7.19, note: "State 4.85% + avg local 2.34%" },
  VT: { rate: 6.3, note: "State 6% + avg local 0.30%" },
  VA: { rate: 5.77, note: "State 4.15% + avg local 1.62%" },
  WA: { rate: 9.38, note: "State 6.5% + avg local 2.88%" },
  WV: { rate: 6.57, note: "State 6% + avg local 0.57%" },
  WI: { rate: 5.43, note: "State 5% + avg county 0.43%" },
  WY: { rate: 5.39, note: "State 4% + avg local 1.39%" },
  DC: { rate: 6.0, note: "District-only rate" },
};

const ZIP_AUTO_TAX: Record<string, { rate: number; note: string }> = {
  "86315": {
    rate: 9.18,
    note: "Prescott Valley, AZ exact combined TPT estimate: state 5.6% + county 0.75% + city 2.83%",
  },
};

function getAutoTaxInfo(
  zip: string,
): { rate: number; note: string; label: string; exact: boolean } | null {
  const exact = ZIP_AUTO_TAX[zip];
  if (exact) return { ...exact, label: zip, exact: true };
  const state = zipToState(zip);
  const fallback = state ? STATE_AUTO_TAX[state] : null;
  return fallback ? { ...fallback, label: state || zip, exact: false } : null;
}

// ── Book value estimator ───────────────────────────────────────────────────────

type BookValueResult = {
  low: number;
  avg: number;
  high: number;
  state: string;
  ageYears: number;
};

function estimateBookValue(
  year: string | number,
  make: string,
  model: string,
  mileage?: number,
): BookValueResult {
  const currentYear = new Date().getFullYear();
  const vehicleYear = typeof year === "string" ? parseInt(year) : year;
  if (!vehicleYear || isNaN(vehicleYear))
    return { low: 0, avg: 0, high: 0, state: "unknown", ageYears: 0 };
  const age = Math.max(0, currentYear - vehicleYear);
  const makeU = make.toUpperCase().trim();
  const modelU = model.toUpperCase().trim();

  // ── 2023-24 Average Transaction Prices by segment ──────────────────────────
  // Segment detection (most specific first)
  const isHeavyTruck = [
    "F-250",
    "F-350",
    "SILVERADO HD",
    "SIERRA HD",
    "RAM 2500",
    "RAM 3500",
    "TUNDRA",
  ].some((t) => modelU.includes(t));
  const isHalfTonTruck = [
    "F-150",
    "F150",
    "SILVERADO",
    "SIERRA",
    "RAM 1500",
    "RANGER",
    "COLORADO",
    "TACOMA",
    "MAVERICK",
    "RIDGELINE",
    "FRONTIER",
  ].some((t) => modelU.includes(t));
  const isFullSizeSUV = [
    "TAHOE",
    "SUBURBAN",
    "YUKON",
    "EXPEDITION",
    "NAVIGATOR",
    "ARMADA",
    "SEQUOIA",
  ].some((t) => modelU.includes(t));
  const isMidSizeSUV = [
    "EXPLORER",
    "PILOT",
    "HIGHLANDER",
    "PATHFINDER",
    "4RUNNER",
    "DURANGO",
    "TRAVERSE",
    "ATLAS",
    "ENCLAVE",
    "ASCENT",
  ].some((t) => modelU.includes(t));
  const isCompactSUV = [
    "RAV4",
    "CR-V",
    "EQUINOX",
    "ROGUE",
    "ESCAPE",
    "TUCSON",
    "SANTA FE",
    "FORESTER",
    "OUTBACK",
    "COMPASS",
    "CHEROKEE",
    "TIGUAN",
    "SPORTAGE",
    "EDGE",
    "MURANO",
    "PASSPORT",
    "CX-5",
    "CX-50",
    "BRONCO SPORT",
    "TRAILBLAZER",
  ].some((t) => modelU.includes(t));
  const isUltraLuxury = [
    "PORSCHE",
    "BENTLEY",
    "ROLLS-ROYCE",
    "MASERATI",
    "FERRARI",
    "LAMBORGHINI",
    "ASTON MARTIN",
  ].includes(makeU);
  const isLuxurySUV = isUltraLuxury
    ? false
    : [
        "X3",
        "X5",
        "X7",
        "GLE",
        "GLC",
        "GLS",
        "Q5",
        "Q7",
        "Q8",
        "RX",
        "GX",
        "LX",
        "XT5",
        "XT6",
        "MDX",
        "QX60",
        "QX80",
        "RANGE ROVER",
        "DISCOVERY",
        "DEFENDER",
        "XC60",
        "XC90",
        "CAYENNE",
        "MACAN",
      ].some((t) => modelU.includes(t));
  const isLuxuryCar =
    !isUltraLuxury &&
    [
      "BMW",
      "MERCEDES-BENZ",
      "MERCEDES",
      "AUDI",
      "LEXUS",
      "CADILLAC",
      "INFINITI",
      "ACURA",
      "LINCOLN",
      "VOLVO",
      "GENESIS",
      "ALFA ROMEO",
      "JAGUAR",
    ].includes(makeU) &&
    !isLuxurySUV &&
    !isFullSizeSUV &&
    !isMidSizeSUV;

  let base: number;
  if (isUltraLuxury) base = 130000;
  else if (isLuxurySUV) base = 82000;
  else if (isLuxuryCar) base = 62000;
  else if (isHeavyTruck) base = 72000;
  else if (isHalfTonTruck) base = 60000;
  else if (isFullSizeSUV) base = 68000;
  else if (isMidSizeSUV) base = 52000;
  else if (isCompactSUV) base = 38000;
  else if (
    ["FORD", "CHEVROLET", "DODGE", "CHRYSLER", "JEEP", "BUICK", "GMC"].includes(
      makeU,
    )
  )
    base = 32000;
  else if (["TOYOTA", "HONDA", "SUBARU"].includes(makeU)) base = 33000;
  else if (
    ["KIA", "HYUNDAI", "MAZDA", "NISSAN", "VOLKSWAGEN", "MITSUBISHI"].includes(
      makeU,
    )
  )
    base = 29000;
  else base = 30000;

  // ── Brand-tier depreciation retention tables ───────────────────────────────
  // Tier A: Toyota, Honda, Subaru, domestic trucks (strong retention)
  const tierA = ["TOYOTA", "HONDA", "SUBARU", "LEXUS"];
  // Tier C: Higher depreciation brands
  const tierC = [
    "CHRYSLER",
    "DODGE",
    "FIAT",
    "ALFA ROMEO",
    "MITSUBISHI",
    "LINCOLN",
    "BUICK",
    "CADILLAC",
    "LAND ROVER",
    "JAGUAR",
    "VOLVO",
    "MASERATI",
  ];

  const retA: Record<number, number> = {
    0: 1,
    1: 0.85,
    2: 0.75,
    3: 0.65,
    4: 0.57,
    5: 0.5,
    6: 0.44,
    7: 0.39,
    8: 0.35,
    9: 0.31,
    10: 0.28,
  };
  const retB: Record<number, number> = {
    0: 1,
    1: 0.8,
    2: 0.68,
    3: 0.58,
    4: 0.49,
    5: 0.42,
    6: 0.36,
    7: 0.31,
    8: 0.27,
    9: 0.24,
    10: 0.21,
  };
  const retC: Record<number, number> = {
    0: 1,
    1: 0.74,
    2: 0.61,
    3: 0.51,
    4: 0.43,
    5: 0.36,
    6: 0.3,
    7: 0.26,
    8: 0.22,
    9: 0.19,
    10: 0.17,
  };

  const retTable = tierA.includes(makeU)
    ? retA
    : tierC.includes(makeU)
      ? retC
      : retB;
  // Trucks hold value like Tier A regardless of make
  const effectiveTable = isHalfTonTruck || isHeavyTruck ? retA : retTable;

  const idx = Math.min(age, 10);
  const ret =
    effectiveTable[idx] ??
    Math.max(0.1, (effectiveTable[10] ?? 0.18) - (age - 10) * 0.015);
  let avg = base * ret;

  // ── Mileage adjustment ─────────────────────────────────────────────────────
  // Industry standard: ~$100-150 per 1,000 miles above/below 12k/yr average
  if (mileage && mileage > 0) {
    const expectedMiles = Math.max(1000, age * 12000);
    const diffK = (mileage - expectedMiles) / 1000;
    const perKAdj = avg > 40000 ? 140 : avg > 20000 ? 110 : 75;
    avg -= diffK * perKAdj;
  }

  avg = Math.max(800, avg);
  const label =
    age <= 1
      ? "Near-New"
      : age <= 3
        ? "Low-Miles"
        : age <= 6
          ? "Average"
          : age <= 10
            ? "High-Miles"
            : "High-Age";
  return {
    low: Math.round((avg * 0.87) / 100) * 100,
    avg: Math.round(avg / 100) * 100,
    high: Math.round((avg * 1.13) / 100) * 100,
    state: label,
    ageYears: age,
  };
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("crm-authenticated") === "true",
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem("crm-current-user");
    return saved ? (JSON.parse(saved) as CurrentUser) : null;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [soldCelebration, setSoldCelebration] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    avatarUrl: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(
    () =>
      (localStorage.getItem("crm-theme-mode") as "light" | "dark") || "light",
  );
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">(
    "login",
  );
  const [customers, setCustomers] = useState(initialCustomers);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(
    null,
  );
  const [financeApplications, setFinanceApplications] = useState(
    initialFinanceApplications,
  );
  const [creditApplications, setCreditApplications] = useState<
    CreditApplication[]
  >([]);
  const [tradeIns, setTradeIns] = useState(initialTradeIns);
  const [vehicleSales, setVehicleSales] = useState(initialVehicleSales);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [repairOrders, setRepairOrders] =
    useState<RepairOrder[]>(initialRepairOrders);
  const [roForm, setRoForm] = useState({
    customerName: "",
    customerPhone: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleMileageIn: "",
    vehicleVin: "",
    advisor: "",
    technician: "",
    promisedTime: "",
    concern: "",
    notes: "",
  });
  const [showRoForm, setShowRoForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [profileTab, setProfileTab] = useState<ProfileTab>("overview");

  const [customerSearch, setCustomerSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("All");
  const [customerSourceFilter, setCustomerSourceFilter] = useState("All");
  const [customerSortCol, setCustomerSortCol] = useState<
    "name" | "status" | "vehicle" | "rep" | "created"
  >("name");
  const [customerSortDir, setCustomerSortDir] = useState<"asc" | "desc">("asc");
  const [custPage, setCustPage] = useState(0);
  const [custPageSize, setCustPageSize] = useState(50);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dupMatches, setDupMatches] = useState<Customer[]>([]);
  const [quickActivityNote, setQuickActivityNote] = useState("");
  const [quickActivityType, setQuickActivityType] =
    useState<Activity["type"]>("Note");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalText, setNoteModalText] = useState("");

  const [loginForm, setLoginForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [appMessage, setAppMessage] = useState("");

  const [customerForm, setCustomerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "New Lead" as Customer["status"],
    interestedVehicle: "",
    source: "",
    assignedTo: "",
    nextFollowUp: "",
    address: "",
    temperature: "" as LeadTemp | "",
  });
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [financeForm, setFinanceForm] = useState({
    customerId: "1",
    applicantName: "",
    dateOfBirth: "",
    ssnLast4: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    employerName: "",
    jobTitle: "",
    employmentStatus: "Full-time",
    timeOnJob: "",
    monthlyIncome: "",
    otherIncome: "",
    creditRange: "680-719",
    downPayment: "",
    requestedVehicle: "",
    tradePayoff: "",
    requestedAmount: "",
    termMonths: "72",
    lender: "",
    decisionNotes: "",
    consentToPullCredit: false,
    status: "New" as FinanceApplication["status"],
  });
  const [creditForm, setCreditForm] = useState({
    applicantName: "",
    dateOfBirth: "",
    ssnLast4: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    residenceType: "Rent",
    timeAtAddress: "",
    employerName: "",
    jobTitle: "",
    employmentStatus: "Full-time",
    timeOnJob: "",
    monthlyIncome: "",
    otherIncome: "",
    bankName: "",
    downPayment: "",
    requestedVehicle: "",
    consentToPullCredit: false,
    status: "Draft" as CreditApplication["status"],
  });
  const [tradeForm, setTradeForm] = useState({
    customerId: "1",
    vin: "",
    year: "",
    make: "",
    model: "",
    mileage: "",
    payoff: "",
    estimatedValue: "",
    notes: "",
  });
  const [tradeVinLoading, setTradeVinLoading] = useState(false);
  const [tradeBookValue, setTradeBookValue] = useState<BookValueResult | null>(
    null,
  );
  const [saleForm, setSaleForm] = useState({
    customerId: "1",
    stockNumber: "",
    year: "",
    make: "",
    model: "",
    salePrice: "",
    stage: "Working" as VehicleSale["stage"],
  });
  const [activityForm, setActivityForm] = useState({
    customerId: "1",
    type: "Note" as Activity["type"],
    note: "",
  });
  const [activityReportRange, setActivityReportRange] = useState<
    "day" | "week"
  >("day");
  const [taskForm, setTaskForm] = useState({
    title: "",
    type: "Follow-Up" as CrmTask["type"],
    dueAt: "",
    priority: "Normal" as CrmTask["priority"],
  });
  const [appointmentForm, setAppointmentForm] = useState({
    title: "Sales appointment",
    dueAt: "",
    priority: "High" as CrmTask["priority"],
    notes: "",
  });
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    number | null
  >(null);
  const [messageForm, setMessageForm] = useState({
    channel: "Text" as Message["channel"],
    template: "First Response",
    body: "Hi, this is Avery with the dealership. I wanted to follow up and see how I can help.",
  });
  const [vin, setVin] = useState("");
  const [vinResult, setVinResult] = useState<VinDecodedVehicle | null>(null);
  const [vinError, setVinError] = useState("");
  const [vinLoading, setVinLoading] = useState(false);

  // Desk / Payment calculator
  const [deskCalc, setDeskCalc] = useState({
    salePrice: "",
    tradeACV: "",
    tradePayoff: "",
    downPayment: "",
    apr: "7.9",
    termMonths: "72",
    taxRate: "8.5",
  });
  // ── Desking Tool ─────────────────────────────────────────────────────────
  const [desk, setDesk] = useState({
    customerId: "",
    stockNumber: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    msrp: "",
    sellingPrice: "",
    tradeYear: "",
    tradeMake: "",
    tradeModel: "",
    tradeACV: "",
    tradePayoff: "",
    downPayment: "",
    rebate: "",
    docFee: "699",
    titleFee: "100",
    regFee: "200",
    taxRate: "8.5",
    gap: false,
    gapPrice: "895",
    warranty: false,
    warrantyPrice: "2495",
    tireWheel: false,
    tirewheelPrice: "1195",
    paintPro: false,
    paintProPrice: "799",
    creditLife: false,
    creditLifePrice: "599",
    apr: "7.9",
    termMonths: "72",
    lender: "",
    buyerZip: "",
  });
  const [targetPayment, setTargetPayment] = useState("");
  const [paymentGridDowns, setPaymentGridDowns] = useState([
    "0",
    "1000",
    "3000",
  ]);
  const [paymentGridScenarios, setPaymentGridScenarios] = useState([
    { apr: "7.9", term: "72" },
    { apr: "7.9", term: "72" },
    { apr: "7.9", term: "72" },
  ]);
  const [selectedPrintOptions, setSelectedPrintOptions] = useState([
    true,
    true,
    true,
  ]);
  const [savedDeskDeals, setSavedDeskDeals] = useState<SavedDeskDeal[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("crmSavedDeskDeals") || "[]");
    } catch {
      return [];
    }
  });

  const deskNumbers = useMemo(() => {
    const msrp = parseFloat(desk.msrp) || 0;
    const selling = parseFloat(desk.sellingPrice) || 0;
    const discount = msrp - selling;
    const acv = parseFloat(desk.tradeACV) || 0;
    const payoff = parseFloat(desk.tradePayoff) || 0;
    const equity = acv - payoff;
    const down = parseFloat(desk.downPayment) || 0;
    const rebate = parseFloat(desk.rebate) || 0;
    const docFee = parseFloat(desk.docFee) || 0;
    const titleFee = parseFloat(desk.titleFee) || 0;
    const regFee = parseFloat(desk.regFee) || 0;
    const taxRate = parseFloat(desk.taxRate) / 100;
    const fiItems: { name: string; price: number }[] = [];
    if (desk.gap)
      fiItems.push({
        name: "GAP Insurance",
        price: parseFloat(desk.gapPrice) || 0,
      });
    if (desk.warranty)
      fiItems.push({
        name: "Extended Warranty",
        price: parseFloat(desk.warrantyPrice) || 0,
      });
    if (desk.tireWheel)
      fiItems.push({
        name: "Tire & Wheel",
        price: parseFloat(desk.tirewheelPrice) || 0,
      });
    if (desk.paintPro)
      fiItems.push({
        name: "Paint Protection",
        price: parseFloat(desk.paintProPrice) || 0,
      });
    if (desk.creditLife)
      fiItems.push({
        name: "Credit Life/Disability",
        price: parseFloat(desk.creditLifePrice) || 0,
      });
    const fiTotal = fiItems.reduce((t, i) => t + i.price, 0);
    const salesTax = (selling + fiTotal) * taxRate;
    const totalFees = docFee + titleFee + regFee;
    const financed =
      selling + salesTax + totalFees + fiTotal - down - equity - rebate;
    const aprM = parseFloat(desk.apr) / 100 / 12;
    const term = parseInt(desk.termMonths) || 72;
    const monthly =
      financed > 0 && aprM > 0
        ? (financed * aprM) / (1 - Math.pow(1 + aprM, -term))
        : 0;
    return {
      discount,
      equity,
      fiItems,
      fiTotal,
      salesTax,
      totalFees,
      financed,
      monthly,
      selling,
      msrp,
    };
  }, [desk]);

  const paymentGrid = useMemo(() => {
    const downs = paymentGridDowns.map((down) => parseFloat(down) || 0);
    const selling = parseFloat(desk.sellingPrice) || 0;
    const acv = parseFloat(desk.tradeACV) || 0;
    const payoff = parseFloat(desk.tradePayoff) || 0;
    const equity = acv - payoff;
    const rebate = parseFloat(desk.rebate) || 0;
    const taxRate = (parseFloat(desk.taxRate) || 0) / 100;
    const fiTotal = deskNumbers.fiTotal;
    const salesTax = (selling + fiTotal) * taxRate;
    const fees = deskNumbers.totalFees;
    const base = selling + fiTotal + salesTax + fees - equity - rebate;
    return paymentGridScenarios.map((scenario, index) => {
      const term = parseInt(scenario.term) || 72;
      const aprM = (parseFloat(scenario.apr) || 0) / 100 / 12;
      const amt = base - downs[index];
      const payment =
        amt <= 0
          ? 0
          : aprM === 0
            ? amt / term
            : (amt * aprM) / (1 - Math.pow(1 + aprM, -term));
      return {
        apr: parseFloat(scenario.apr) || 0,
        down: downs[index],
        term,
        payment,
      };
    });
  }, [
    desk.rebate,
    desk.sellingPrice,
    desk.taxRate,
    desk.tradeACV,
    desk.tradePayoff,
    deskNumbers.fiTotal,
    deskNumbers.totalFees,
    paymentGridDowns,
    paymentGridScenarios,
  ]);

  const targetPaymentResult = useMemo(() => {
    const target = parseFloat(targetPayment) || 0;
    const currentDown = parseFloat(desk.downPayment) || 0;
    const baseAmount = deskNumbers.financed + currentDown;
    const term = parseInt(desk.termMonths) || 72;
    const aprM = parseFloat(desk.apr) / 100 / 12;
    if (!target || !baseAmount) return null;
    const targetPrincipal =
      aprM > 0
        ? target * ((1 - Math.pow(1 + aprM, -term)) / aprM)
        : target * term;
    const requiredDown = Math.max(0, baseAmount - targetPrincipal);
    return {
      requiredDown,
      additionalDown: Math.max(0, requiredDown - currentDown),
      isReachable: targetPrincipal >= 0,
    };
  }, [
    desk.apr,
    desk.downPayment,
    desk.termMonths,
    deskNumbers.financed,
    targetPayment,
  ]);
  const hasDeskAmountToCalculate =
    deskNumbers.financed + (parseFloat(desk.downPayment) || 0) > 0;

  const deskPayment = useMemo(() => {
    const price = parseFloat(deskCalc.salePrice) || 0;
    const acv = parseFloat(deskCalc.tradeACV) || 0;
    const payoff = parseFloat(deskCalc.tradePayoff) || 0;
    const down = parseFloat(deskCalc.downPayment) || 0;
    const apr = parseFloat(deskCalc.apr) / 100 / 12;
    const term = parseInt(deskCalc.termMonths) || 72;
    const taxRate = parseFloat(deskCalc.taxRate) / 100;
    const tradeEquity = acv - payoff;
    const taxed = price * taxRate;
    const amount = price + taxed - down - tradeEquity;
    if (amount <= 0 || apr === 0)
      return { monthly: 0, amount, tradeEquity, taxed };
    const monthly = (amount * apr) / (1 - Math.pow(1 + apr, -term));
    return { monthly, amount, tradeEquity, taxed };
  }, [deskCalc]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const pipelineValue = useMemo(
    () => vehicleSales.reduce((t, s) => t + s.salePrice, 0),
    [vehicleSales],
  );
  const pendingFinance = financeApplications.filter(
    (a) => a.status !== "Approved",
  ).length;
  const appointmentCount = customers.filter(
    (c) => c.status === "Appt Set" || c.status === "Appt Show",
  ).length;
  const soldCount = customers.filter((c) => c.status === "Sold").length;
  const lostCount = customers.filter((c) => c.status === "Lost").length;
  const workingCount = customers.filter((c) => c.status === "Working").length;
  const totalLeads = customers.filter((c) => c.status === "New Lead").length;
  const contactedCount = customers.filter(
    (c) => c.status === "Contacted",
  ).length;
  const apptSetCount = customers.filter((c) => c.status === "Appt Set").length;
  const apptShowCount = customers.filter(
    (c) => c.status === "Appt Show",
  ).length;

  // Funnel KPIs (Tekion/CDK style)
  const decidedDeals = soldCount + lostCount;
  const closingRatio =
    decidedDeals > 0 ? Math.round((soldCount / decidedDeals) * 100) : 0;
  const activeOpps =
    contactedCount + apptSetCount + apptShowCount + workingCount;
  const leadToContact =
    customers.length > 0
      ? Math.round(((customers.length - totalLeads) / customers.length) * 100)
      : 0;
  const apptShowRate =
    apptSetCount + apptShowCount > 0
      ? Math.round((apptShowCount / (apptSetCount + apptShowCount)) * 100)
      : 0;

  const urgentLeads = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.status === "New Lead" &&
          !activities.some((a) => a.customerId === c.id),
      ),
    [customers, activities],
  );

  const activeLeads = useMemo(
    () =>
      customers.filter((c) => !["New Lead", "Sold", "Lost"].includes(c.status)),
    [customers],
  );

  const soldReengagementTargets = useMemo(
    () => customers.filter((c) => c.status === "Sold"),
    [customers],
  );

  const serviceEquityTargets = useMemo(() => {
    const latestByCustomer = new Map<number, RepairOrder>();
    repairOrders.forEach((ro) => {
      if (!ro.customerId) return;
      const current = latestByCustomer.get(ro.customerId);
      if (
        !current ||
        new Date(ro.createdAt).getTime() > new Date(current.createdAt).getTime()
      ) {
        latestByCustomer.set(ro.customerId, ro);
      }
    });

    return [...latestByCustomer.values()]
      .map((ro) => {
        const customer = customers.find((item) => item.id === ro.customerId);
        if (!customer || customer.status === "Lost") return null;
        const age = Math.max(
          0,
          new Date().getFullYear() -
            Number(ro.vehicleYear || new Date().getFullYear()),
        );
        const estimatedValue = Math.max(
          3500,
          36000 - age * 3200 - ro.vehicleMileageIn * 0.09,
        );
        const serviceSpend = ro.total;
        const equityScore = Math.round(
          Math.max(0, estimatedValue - serviceSpend * 2),
        );
        if (equityScore < 12000) return null;
        return {
          customer,
          ro,
          estimatedValue: Math.round(estimatedValue),
          equityScore,
        };
      })
      .filter(
        (
          item,
        ): item is {
          customer: Customer;
          ro: RepairOrder;
          estimatedValue: number;
          equityScore: number;
        } => Boolean(item),
      )
      .sort((a, b) => b.equityScore - a.equityScore)
      .slice(0, 5);
  }, [customers, repairOrders]);

  // Stalled: in-progress leads with no activity in 3+ days
  const stalledLeads = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 72;
    return customers.filter((c) => {
      if (["New Lead", "Sold", "Lost"].includes(c.status)) return false;
      const lastAct = activities
        .filter((a) => a.customerId === c.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
      if (!lastAct) return true;
      return new Date(lastAct.createdAt).getTime() < cutoff;
    });
  }, [customers, activities]);

  const internetLeads = useMemo(
    () =>
      customers
        .filter((c) => {
          const src = (c.source || "").toLowerCase();
          return (
            c.status === "New Lead" ||
            [
              "cars.com",
              "autotrader",
              "website",
              "web",
              "internet",
              "online",
              "email lead",
              "third-party",
            ].some((s) => src.includes(s))
          );
        })
        .sort((a, b) => b.id - a.id),
    [customers],
  );

  const leadsBySource = useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach((c) => {
      const src = c.source || "Unknown";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [customers]);

  const pipelineStages = (
    ["Working", "Finance", "Delivered", "Lost"] as const
  ).map((stage) => ({
    stage,
    sales: vehicleSales.filter((s) => s.stage === stage),
    value: vehicleSales
      .filter((s) => s.stage === stage)
      .reduce((t, s) => t + s.salePrice, 0),
  }));

  const filteredCustomers = useMemo(() => {
    const q = activeSearch.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, "");
    const filtered = customers.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const matchSearch =
        !q ||
        name.includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && c.phone.replace(/\D/g, "").includes(qDigits)) ||
        c.phone.includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.interestedVehicle || "").toLowerCase().includes(q) ||
        (c.address || "").toLowerCase().includes(q);
      const matchStatus =
        customerStatusFilter === "All" || c.status === customerStatusFilter;
      const matchSource =
        customerSourceFilter === "All" ||
        (c.source || "")
          .toLowerCase()
          .includes(customerSourceFilter.toLowerCase());
      return matchSearch && matchStatus && matchSource;
    });
    filtered.sort((a, b) => {
      let av = "",
        bv = "";
      if (customerSortCol === "name") {
        av = `${a.firstName} ${a.lastName}`;
        bv = `${b.firstName} ${b.lastName}`;
      }
      if (customerSortCol === "status") {
        av = a.status;
        bv = b.status;
      }
      if (customerSortCol === "vehicle") {
        av = a.interestedVehicle || "";
        bv = b.interestedVehicle || "";
      }
      if (customerSortCol === "rep") {
        av = a.assignedTo || "";
        bv = b.assignedTo || "";
      }
      if (customerSortCol === "created") {
        av = a.createdAt || "";
        bv = b.createdAt || "";
      }
      return customerSortDir === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });
    return filtered;
  }, [
    customers,
    activeSearch,
    customerStatusFilter,
    customerSourceFilter,
    customerSortCol,
    customerSortDir,
  ]);

  const custTotalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / custPageSize),
  );
  const custSafePage = Math.min(custPage, custTotalPages - 1);
  const custPageSlice = filteredCustomers.slice(
    custSafePage * custPageSize,
    (custSafePage + 1) * custPageSize,
  );

  function toggleCustomerSort(col: typeof customerSortCol) {
    if (customerSortCol === col)
      setCustomerSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setCustomerSortCol(col);
      setCustomerSortDir("asc");
    }
    setCustPage(0);
  }
  function custSortIcon(col: typeof customerSortCol) {
    if (customerSortCol !== col)
      return <span className="sort-icon inactive">⇅</span>;
    return (
      <span className="sort-icon active">
        {customerSortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  function doCustomerSearch() {
    setActiveSearch(customerSearch.trim());
    setCustPage(0);
  }

  function CustomerProfile() {
    setActiveSearch(customerSearch.trim());
    setCustPage(0);
  }

  const selectedCustomer = selectedCustomerId
    ? (customers.find((c) => c.id === selectedCustomerId) ?? null)
    : null;
  const profileFinance = selectedCustomer
    ? financeApplications.filter((a) => a.customerId === selectedCustomer.id)
    : [];
  const profileCreditApps = selectedCustomer
    ? creditApplications.filter((a) => a.customerId === selectedCustomer.id)
    : [];
  const profileTrades = selectedCustomer
    ? tradeIns.filter((t) => t.customerId === selectedCustomer.id)
    : [];
  const profileSales = selectedCustomer
    ? vehicleSales.filter((s) => s.customerId === selectedCustomer.id)
    : [];
  const profileSavedDeskDeals = selectedCustomer
    ? savedDeskDeals.filter((deal) => deal.customerId === selectedCustomer.id)
    : [];
  const profileActivities = selectedCustomer
    ? activities
        .filter((a) => a.customerId === selectedCustomer.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    : [];
  const profileTasks = selectedCustomer
    ? tasks
        .filter((task) => task.customerId === selectedCustomer.id)
        .sort(
          (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
        )
    : [];
  const profileAppointments = profileTasks.filter(
    (task) => task.type === "Appointment",
  );
  const nextProfileAppointment = profileAppointments.find(
    (task) => task.status !== "Complete",
  );
  const profileMessages = selectedCustomer
    ? messages
        .filter((message) => message.customerId === selectedCustomer.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    : [];
  const activityReportRows = useMemo(() => {
    const start =
      Date.now() -
      (activityReportRange === "day"
        ? 1000 * 60 * 60 * 24
        : 1000 * 60 * 60 * 24 * 7);
    const rowMap = new Map<
      number,
      {
        customer: Customer;
        lastInteraction: string;
        calls: number;
        texts: number;
        emails: number;
        appointments: number;
        leads: number;
      }
    >();

    customers.forEach((customer) => {
      const createdAt = customer.createdAt
        ? new Date(customer.createdAt).getTime()
        : 0;
      if (createdAt >= start) {
        rowMap.set(customer.id, {
          customer,
          lastInteraction: customer.createdAt || new Date().toISOString(),
          calls: 0,
          texts: 0,
          emails: 0,
          appointments: 0,
          leads: 1,
        });
      }
    });

    activities
      .filter((activity) => activity.type !== "Note")
      .forEach((activity) => {
        const createdAt = new Date(activity.createdAt).getTime();
        if (createdAt < start) return;
        const customer = customers.find(
          (item) => item.id === activity.customerId,
        );
        if (!customer) return;
        const current = rowMap.get(customer.id) || {
          customer,
          lastInteraction: activity.createdAt,
          calls: 0,
          texts: 0,
          emails: 0,
          appointments: 0,
          leads: 0,
        };
        if (
          new Date(activity.createdAt).getTime() >
          new Date(current.lastInteraction).getTime()
        ) {
          current.lastInteraction = activity.createdAt;
        }
        if (activity.type === "Call") current.calls += 1;
        if (activity.type === "Text") current.texts += 1;
        if (activity.type === "Email") current.emails += 1;
        if (activity.type === "Appointment") current.appointments += 1;
        rowMap.set(customer.id, current);
      });

    return [...rowMap.values()].sort(
      (a, b) =>
        new Date(b.lastInteraction).getTime() -
        new Date(a.lastInteraction).getTime(),
    );
  }, [activities, activityReportRange, customers]);
  const activityReportTotals = activityReportRows.reduce(
    (totals, row) => ({
      calls: totals.calls + row.calls,
      texts: totals.texts + row.texts,
      emails: totals.emails + row.emails,
      appointments: totals.appointments + row.appointments,
      leads: totals.leads + row.leads,
    }),
    { calls: 0, texts: 0, emails: 0, appointments: 0, leads: 0 },
  );
  const openTasks = tasks.filter((task) => task.status === "Open");
  const allAppointmentTasks = tasks
    .filter((task) => task.type === "Appointment")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const showroomAppointments = allAppointmentTasks.filter(
    (task) => task.status === "Showroom",
  );
  const overdueTasks = openTasks.filter(
    (task) => new Date(task.dueAt).getTime() < Date.now(),
  );
  const todayTasks = openTasks.filter((task) => {
    const due = new Date(task.dueAt);
    const now = new Date();
    return (
      due.toDateString() === now.toDateString() || due.getTime() < now.getTime()
    );
  });
  const appointmentTasks = openTasks
    .filter((task) => task.type === "Appointment")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 8);
  const crmAlerts = [
    ...overdueTasks.slice(0, 3).map((task) => ({
      id: `task-${task.id}`,
      tone: "danger",
      title: "Overdue follow-up",
      detail: task.title,
      customerId: task.customerId,
    })),
    ...internetLeads.slice(0, 3).map((customer) => ({
      id: `lead-${customer.id}`,
      tone: "warning",
      title: "Uncontacted lead",
      detail: `${customer.firstName} ${customer.lastName} · ${customer.interestedVehicle}`,
      customerId: customer.id,
    })),
    ...stalledLeads.slice(0, 2).map((customer) => ({
      id: `stalled-${customer.id}`,
      tone: "info",
      title: "Stalled deal",
      detail: `${customer.firstName} ${customer.lastName} needs activity`,
      customerId: customer.id,
    })),
  ];

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    function syncRoute() {
      const route = parseHashRoute(window.location.hash);
      setSelectedCustomerId(route.selectedCustomerId);
      setCurrentPage(route.page);
    }
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`${API_BASE}/api/bootstrap`)
      .then((r) => r.json())
      .then((d: BootstrapData) => {
        const duplicateIds = findDuplicateIds(d.customers.map((c) => c.id));
        if (duplicateIds.length > 0) {
          console.warn(
            "[CRM bootstrap] Duplicate customer ids found",
            duplicateIds,
          );
        }
        setCustomers(d.customers);
        setFinanceApplications(d.financeApplications);
        setCreditApplications(d.creditApplications || []);
        setTradeIns(d.tradeIns);
        setVehicleSales(d.vehicleSales);
        setActivities(d.activities);
        setTasks(d.tasks || []);
        setMessages(d.messages || []);
        if (d.repairOrders) setRepairOrders(d.repairOrders);
      })
      .catch(() => setAppMessage("Could not load data from backend."));
  }, [isLoggedIn]);

  useEffect(() => {
    if (!selectedCustomer) return;
    setFinanceForm((f) => ({
      ...f,
      customerId: String(selectedCustomer.id),
      applicantName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      requestedVehicle: selectedCustomer.interestedVehicle,
    }));
    setCreditForm((f) => ({
      ...f,
      applicantName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      requestedVehicle: selectedCustomer.interestedVehicle,
    }));
    setProfileTab("overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function navigate(page: AppPage) {
    window.location.hash = `#/${page}`;
  }
  function openProfile(c: Customer) {
    window.location.hash = `#/customers/${c.id}`;
  }
  function getCustomerName(id: number) {
    const c = customers.find((customer) => customer.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "Unknown Customer";
  }
  function applyDeskCustomer(customerId: string) {
    const trade = tradeIns
      .filter((item) => item.customerId === Number(customerId))
      .sort((a, b) => b.id - a.id)[0];
    setDesk({
      ...desk,
      customerId,
      tradeYear: trade?.year || "",
      tradeMake: trade?.make || "",
      tradeModel: trade?.model || "",
      tradeACV: trade ? String(trade.estimatedValue) : "",
      tradePayoff: trade ? String(trade.payoff) : "",
    });
  }
  function saveDeskDeal() {
    const customerId = Number(desk.customerId);
    if (!customerId) {
      setAppMessage("Select a customer before saving the deal.");
      return;
    }
    const savedDeal: SavedDeskDeal = {
      id: Date.now(),
      customerId,
      desk: { ...desk },
      monthly: deskNumbers.monthly,
      amountFinanced: deskNumbers.financed,
      createdAt: new Date().toISOString(),
    };
    const nextDeals = [savedDeal, ...savedDeskDeals];
    setSavedDeskDeals(nextDeals);
    localStorage.setItem("crmSavedDeskDeals", JSON.stringify(nextDeals));
    setAppMessage("Desk deal saved to customer profile.");
  }
  function printDeskPaymentOptions() {
    const customerName = desk.customerId
      ? getCustomerName(Number(desk.customerId))
      : "Customer";
    const vehicleName =
      [desk.year, desk.make, desk.model, desk.trim].filter(Boolean).join(" ") ||
      "Selected Vehicle";
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      setAppMessage("Allow popups to print payment options.");
      return;
    }
    const selectedPaymentGrid = paymentGrid.filter(
      (_row, index) => selectedPrintOptions[index],
    );
    const printRows =
      selectedPaymentGrid.length > 0 ? selectedPaymentGrid : paymentGrid;
    const scenarioRows = printRows
      .map(
        (row) => `
          <tr>
            <td>Option ${paymentGrid.findIndex((item) => item === row) + 1}</td>
            <td>$${row.down.toLocaleString()}</td>
            <td>${row.apr}%</td>
            <td>${row.term} mo</td>
            <td><strong>$${row.payment.toFixed(0)}</strong></td>
          </tr>
        `,
      )
      .join("");
    const fiRows = deskNumbers.fiItems
      .map(
        (item) => `
          <tr>
            <td>${item.name}</td>
            <td>$${item.price.toLocaleString()}</td>
          </tr>
        `,
      )
      .join("");
    const feeRows = [
      ["Sales Tax", deskNumbers.salesTax],
      ["Doc Fee", parseFloat(desk.docFee) || 0],
      ["Title Fee", parseFloat(desk.titleFee) || 0],
      ["Registration Fee", parseFloat(desk.regFee) || 0],
    ]
      .map(
        ([label, amount]) => `
          <tr>
            <td>${label}</td>
            <td>$${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
          </tr>
        `,
      )
      .join("");
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Payment Options - ${customerName}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              background: #f8fafc;
              color: #0f172a;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            .sheet {
              max-width: 860px;
              margin: 0 auto;
              padding: 34px;
              border: 1px solid #dbe3ef;
              border-radius: 28px;
              background: #fff;
              box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
            }
            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 18px;
              padding-bottom: 22px;
              border-bottom: 2px solid #e2e8f0;
            }
            .eyebrow {
              margin: 0 0 6px;
              color: #4f46e5;
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }
            h1 {
              margin: 0;
              color: #0f172a;
              font-size: 30px;
              letter-spacing: -0.04em;
            }
            .date {
              color: #64748b;
              font-size: 13px;
              font-weight: 700;
              text-align: right;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin: 22px 0;
            }
            .card {
              padding: 16px;
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              background: linear-gradient(180deg, #ffffff, #f8fafc);
            }
            .card span {
              display: block;
              color: #64748b;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .card strong {
              display: block;
              margin-top: 5px;
              color: #0f172a;
              font-size: 19px;
            }
            h2 {
              margin: 28px 0 12px;
              color: #1e293b;
              font-size: 17px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              overflow: hidden;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
            }
            th, td {
              padding: 13px 14px;
              border-bottom: 1px solid #e2e8f0;
              text-align: left;
              font-size: 14px;
            }
            th {
              background: #eef2ff;
              color: #4338ca;
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.07em;
              text-transform: uppercase;
            }
            tr:last-child td { border-bottom: 0; }
            .disclaimer {
              margin-top: 24px;
              color: #64748b;
              font-size: 11px;
              line-height: 1.55;
            }
            .actions {
              margin-top: 24px;
              text-align: right;
            }
            button {
              padding: 12px 18px;
              border: 0;
              border-radius: 999px;
              background: linear-gradient(135deg, #0ea5e9, #4f46e5);
              color: #fff;
              font-weight: 900;
              cursor: pointer;
            }
            @media print {
              body { padding: 0; background: #fff; }
              .sheet { box-shadow: none; border: 0; border-radius: 0; }
              .actions { display: none; }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <section class="header">
              <div>
                <p class="eyebrow">Payment Options</p>
                <h1>${customerName}</h1>
                <p>${vehicleName}</p>
              </div>
              <div class="date">${new Date().toLocaleDateString()}</div>
            </section>
            <section class="summary">
              <div class="card"><span>Selling Price</span><strong>$${deskNumbers.selling.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
              <div class="card"><span>Trade Equity</span><strong>$${deskNumbers.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
              <div class="card"><span>Amount Financed</span><strong>$${Math.max(0, deskNumbers.financed).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
            </section>
            <h2>Payment Options</h2>
            <table>
              <thead>
                <tr>
                  <th>Option</th>
                  <th>Down</th>
                  <th>APR</th>
                  <th>Term</th>
                  <th>Estimated Payment</th>
                </tr>
              </thead>
              <tbody>${scenarioRows}</tbody>
            </table>
            <h2>Taxes & Fees</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>${feeRows}</tbody>
            </table>
            ${
              fiRows
                ? `<h2>Selected Protection Products</h2><table><thead><tr><th>Product</th><th>Price</th></tr></thead><tbody>${fiRows}</tbody></table>`
                : ""
            }
            <p class="disclaimer">
              Payment options are estimates for review only and may vary based on lender approval, taxes, fees, title, registration,
              selected products, and final vehicle pricing. APR and terms are subject to credit approval.
            </p>
            <div class="actions">
              <button onclick="window.print()">Print / Save PDF</button>
            </div>
          </main>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  }
  function reopenDeskDeal(savedDeal: SavedDeskDeal) {
    setDesk({ ...desk, ...savedDeal.desk });
    window.location.hash = "#/desk";
    setProfileTab("deals");
  }
  function statusClass(s: string) {
    return (
      (
        {
          "New Lead": "badge-new-lead",
          Contacted: "badge-contacted",
          "Appt Set": "badge-appt-set",
          "Appt Show": "badge-appt-show",
          Working: "badge-working",
          Sold: "badge-sold",
          Lost: "badge-lost",
        } as Record<string, string>
      )[s] ?? ""
    );
  }

  function tempClass(t?: string) {
    return (
      (
        { Hot: "temp-hot", Warm: "temp-warm", Cold: "temp-cold" } as Record<
          string,
          string
        >
      )[t ?? ""] ?? ""
    );
  }

  function timeAgo(iso?: string): string {
    if (!iso) return "";
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function readApiError(res: Response, fallback: string) {
    try {
      const data = await res.json();
      return data.message || fallback;
    } catch {
      return fallback;
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");
    const endpoint =
      authMode === "signup"
        ? "/api/signup"
        : authMode === "forgot"
          ? "/api/forgot-password"
          : "/api/login";
    const payload =
      authMode === "signup"
        ? loginForm
        : { email: loginForm.email, password: loginForm.password };
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.message || "Something went wrong.");
        return;
      }
      if (authMode === "forgot") {
        setAuthMessage(data.message);
        setAuthMode("login");
        return;
      }
      const user = data.user as CurrentUser | undefined;
      if (user) {
        setCurrentUser(user);
        setSettingsForm({
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || "",
          avatarUrl: user.avatarUrl || "",
        });
        localStorage.setItem("crm-current-user", JSON.stringify(user));
      }
      const boot = await fetch(`${API_BASE}/api/bootstrap`);
      if (!boot.ok) {
        setAuthError(
          await readApiError(
            boot,
            "Login worked, but CRM data could not load.",
          ),
        );
        return;
      }
      const bd: BootstrapData = await boot.json();
      setCustomers(bd.customers);
      setFinanceApplications(bd.financeApplications);
      setCreditApplications(bd.creditApplications || []);
      setTradeIns(bd.tradeIns);
      setVehicleSales(bd.vehicleSales);
      setActivities(bd.activities);
      setTasks(bd.tasks || []);
      setMessages(bd.messages || []);
      localStorage.setItem("crm-authenticated", "true");
      setIsLoggedIn(true);
    } catch {
      setAuthError("Cannot connect to backend. Make sure it is running.");
    }
  }

  function logout() {
    localStorage.removeItem("crm-authenticated");
    localStorage.removeItem("crm-current-user");
    setCurrentUser(null);
    setIsLoggedIn(false);
    setShowSettings(false);
  }

  function openSettings() {
    if (currentUser) {
      setSettingsForm({
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        phone: currentUser.phone || "",
        avatarUrl: currentUser.avatarUrl || "",
      });
    }
    setShowSettings(true);
  }
  function toggleThemeMode() {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    localStorage.setItem("crm-theme-mode", next);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;
    if (profilePhotoLoading) {
      setAppMessage("Please wait for the profile photo to finish loading.");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/users/${currentUser.id}/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsForm),
        },
      );
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not update profile."));
        return;
      }
      const data = await res.json();
      setCurrentUser(data);
      localStorage.setItem("crm-current-user", JSON.stringify(data));
      setShowSettings(false);
      setAppMessage("Profile updated.");
    } catch {
      setAppMessage("Could not connect to backend to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  function uploadProfilePicture(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAppMessage("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAppMessage("Profile photo must be smaller than 5MB.");
      return;
    }
    setProfilePhotoLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setSettingsForm((form) => ({
        ...form,
        avatarUrl: String(reader.result || ""),
      }));
      setProfilePhotoLoading(false);
      setAppMessage("Profile photo ready. Click Save Profile to keep it.");
    };
    reader.onerror = () => {
      setProfilePhotoLoading(false);
      setAppMessage("Could not read that profile photo.");
    };
    reader.readAsDataURL(file);
  }

  // ── Customer CRUD ─────────────────────────────────────────────────────────

  function resetCustomerForm() {
    setEditingCustomerId(null);
    setCustomerForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      status: "New Lead" as CustomerStatus,
      interestedVehicle: "",
      source: "",
      assignedTo: "",
      nextFollowUp: "",
      address: "",
      temperature: "" as LeadTemp | "",
    });
  }

  function editCustomer(c: Customer) {
    setEditingCustomerId(c.id);
    setCustomerForm({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      status: c.status,
      interestedVehicle: c.interestedVehicle,
      source: c.source || "",
      assignedTo: c.assignedTo || "",
      nextFollowUp: c.nextFollowUp || "",
      address: c.address || "",
      temperature: (c.temperature || "") as LeadTemp | "",
    });
    window.scrollTo(0, 0);
  }

  function findDuplicates(form: typeof customerForm): Customer[] {
    return findDuplicateCustomers(customers, form, editingCustomerId);
  }

  async function doSaveCustomer() {
    try {
      if (editingCustomerId) {
        const res = await fetch(
          `${API_BASE}/api/customers/${editingCustomerId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(customerForm),
          },
        );
        if (!res.ok) {
          setAppMessage(await readApiError(res, "Could not update customer."));
          return;
        }
        const updated = await res.json();
        setCustomers(
          customers.map((c) => (c.id === editingCustomerId ? updated : c)),
        );
        resetCustomerForm();
        setShowAddForm(false);
        setAppMessage("Customer updated.");
      } else {
        const res = await fetch(`${API_BASE}/api/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerForm),
        });
        if (!res.ok) {
          setAppMessage(await readApiError(res, "Could not add customer."));
          return;
        }
        const created = await res.json();
        setCustomers([created, ...customers]);
        resetCustomerForm();
        setShowAddForm(false);
        setAppMessage("Customer added.");
      }
    } catch {
      setAppMessage("Could not connect to backend to save customer.");
    }
  }

  async function markCustomerSold(customer: Customer) {
    const updatedCustomer: Customer = { ...customer, status: "Sold" };
    setCustomers((list) =>
      list.map((item) => (item.id === customer.id ? updatedCustomer : item)),
    );
    setSoldCelebration(`${customer.firstName} ${customer.lastName}`);
    setTimeout(() => setSoldCelebration(null), 2600);
    setAppMessage(`${customer.firstName} ${customer.lastName} marked sold!`);

    try {
      await fetch(`${API_BASE}/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomer),
      });
    } catch {
      /* local demo state already updated */
    }
  }

  async function markCustomerUnsold(customer: Customer) {
    const updatedCustomer: Customer = { ...customer, status: "Working" };
    setCustomers((list) =>
      list.map((item) => (item.id === customer.id ? updatedCustomer : item)),
    );
    setAppMessage(
      `${customer.firstName} ${customer.lastName} moved back to working.`,
    );

    try {
      await fetch(`${API_BASE}/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomer),
      });
    } catch {
      /* local demo state already updated */
    }
  }

  function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomerId) {
      const dups = findDuplicates(customerForm);
      if (dups.length > 0) {
        setDupMatches(dups);
        return;
      }
    }
    doSaveCustomer();
  }

  async function deleteCustomer(id: number) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not remove customer."));
        return;
      }
      setCustomers(customers.filter((c) => c.id !== id));
      setAppMessage("Customer removed.");
    } catch {
      setAppMessage("Could not connect to backend to remove customer.");
    }
  }

  async function assignLead(customer: Customer, assignedTo: string) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...customer, assignedTo, status: "Appt Set" }),
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not assign lead."));
        return;
      }
      const updated = await res.json();
      setCustomers(customers.map((c) => (c.id === customer.id ? updated : c)));
      setAppMessage(`Lead assigned to ${assignedTo}.`);
    } catch {
      setAppMessage("Could not connect to backend to assign lead.");
    }
  }

  // ── Finance ───────────────────────────────────────────────────────────────

  async function addFinanceApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/finance-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(financeForm),
      });
      if (!res.ok) {
        setAppMessage(
          await readApiError(res, "Could not submit finance application."),
        );
        return;
      }
      const app = await res.json();
      setFinanceApplications([app, ...financeApplications]);
      setAppMessage("Finance application submitted.");
      setProfileTab("deals");
    } catch {
      setAppMessage(
        "Could not connect to backend to submit finance application.",
      );
    }
  }

  async function updateFinanceStatus(
    id: number,
    status: FinanceApplication["status"],
  ) {
    try {
      const res = await fetch(
        `${API_BASE}/api/finance-applications/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (res.ok) {
        const updated = await res.json();
        setFinanceApplications(
          financeApplications.map((a) => (a.id === id ? updated : a)),
        );
      } else {
        setFinanceApplications(
          financeApplications.map((a) => (a.id === id ? { ...a, status } : a)),
        );
      }
    } catch {
      setFinanceApplications(
        financeApplications.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    }
  }

  async function addCreditApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/customers/${selectedCustomer.id}/credit-applications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creditForm),
        },
      );
      if (!res.ok) {
        setAppMessage(
          await readApiError(res, "Could not save credit application."),
        );
        return;
      }
      const app = await res.json();
      setCreditApplications([app, ...creditApplications]);
      setProfileTab("deals");
      setAppMessage("Credit application saved.");
    } catch {
      setAppMessage("Could not connect to backend to save credit application.");
    }
  }

  // ── Trade / Sales ─────────────────────────────────────────────────────────

  async function addTradeIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/trade-ins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeForm),
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not add trade-in."));
        return;
      }
      const trade = await res.json();
      setTradeIns([trade, ...tradeIns]);
      setAppMessage("Trade-in added.");
    } catch {
      setAppMessage("Could not connect to backend to add trade-in.");
    }
  }

  async function addVehicleSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/vehicle-sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleForm),
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not add vehicle sale."));
        return;
      }
      const sale = await res.json();
      setVehicleSales([sale, ...vehicleSales]);
      setAppMessage("Vehicle added to pipeline.");
    } catch {
      setAppMessage("Could not connect to backend to add vehicle sale.");
    }
  }

  async function updateSaleStage(id: number, stage: VehicleSale["stage"]) {
    try {
      const res = await fetch(`${API_BASE}/api/vehicle-sales/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVehicleSales(vehicleSales.map((s) => (s.id === id ? updated : s)));
      } else {
        setVehicleSales(
          vehicleSales.map((s) => (s.id === id ? { ...s, stage } : s)),
        );
      }
    } catch {
      setVehicleSales(
        vehicleSales.map((s) => (s.id === id ? { ...s, stage } : s)),
      );
    }
  }

  // ── Activity ──────────────────────────────────────────────────────────────

  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityForm.note) return;
    try {
      const res = await fetch(`${API_BASE}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityForm),
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not log activity."));
        return;
      }
      const act = await res.json();
      setActivities([act, ...activities]);
      setActivityForm({ ...activityForm, note: "" });
      setAppMessage("Activity logged.");
    } catch {
      setAppMessage("Could not connect to backend to log activity.");
    }
  }

  async function addQuickActivity() {
    if (!selectedCustomer || !quickActivityNote) return;
    const payload = {
      customerId: String(selectedCustomer.id),
      type: quickActivityType,
      note: quickActivityNote,
    };
    try {
      const res = await fetch(`${API_BASE}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not log activity."));
        return;
      }
      const act = await res.json();
      setActivities([act, ...activities]);
      setQuickActivityNote("");
      setAppMessage("Activity logged.");
    } catch {
      setAppMessage("Could not connect to backend to log activity.");
    }
  }

  async function saveQuickNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer || !noteModalText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: String(selectedCustomer.id),
          type: "Note",
          note: noteModalText.trim(),
        }),
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not save note."));
        return;
      }
      const act = await res.json();
      setActivities([act, ...activities]);
      setNoteModalText("");
      setShowNoteModal(false);
      setAppMessage("Note saved.");
    } catch {
      setAppMessage("Could not connect to backend to save note.");
    }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer || !taskForm.title) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          customerId: selectedCustomer.id,
          assignedTo:
            selectedCustomer.assignedTo || currentUser?.name || "Avery",
          dueAt: taskForm.dueAt || new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        setAppMessage(
          await readApiError(res, "Could not create follow-up task."),
        );
        return;
      }
      const task = await res.json();
      setTasks([task, ...tasks]);
      setTaskForm({ ...taskForm, title: "", dueAt: "" });
      setAppMessage("Follow-up task created.");
    } catch {
      setAppMessage("Could not connect to backend to create follow-up task.");
    }
  }

  async function setAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer || !appointmentForm.dueAt) return;
    const payload = {
      customerId: selectedCustomer.id,
      title: appointmentForm.title || "Sales appointment",
      type: "Appointment",
      dueAt: appointmentForm.dueAt,
      assignedTo: selectedCustomer.assignedTo || currentUser?.name || "Avery",
      priority: appointmentForm.priority,
      status: "Open",
    };
    const res = await fetch(
      editingAppointmentId
        ? `${API_BASE}/api/tasks/${editingAppointmentId}`
        : `${API_BASE}/api/tasks`,
      {
        method: editingAppointmentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const task = await res.json();
    setTasks(
      editingAppointmentId
        ? tasks.map((item) => (item.id === editingAppointmentId ? task : item))
        : [task, ...tasks],
    );
    if (appointmentForm.notes) {
      const noteRes = await fetch(`${API_BASE}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          type: "Appointment",
          note: appointmentForm.notes,
        }),
      });
      const activity = await noteRes.json();
      setActivities([activity, ...activities]);
    }
    setAppointmentForm({
      title: "Sales appointment",
      dueAt: "",
      priority: "High",
      notes: "",
    });
    setEditingAppointmentId(null);
    setShowAppointmentModal(false);
    setAppMessage(
      editingAppointmentId ? "Appointment updated." : "Appointment scheduled.",
    );
  }

  function openAppointmentModal(task?: CrmTask) {
    setEditingAppointmentId(task?.id ?? null);
    setAppointmentForm({
      title: task?.title || "Sales appointment",
      dueAt: task?.dueAt ? task.dueAt.slice(0, 16) : "",
      priority: task?.priority || "High",
      notes: "",
    });
    setShowAppointmentModal(true);
  }

  async function updateTaskStatus(task: CrmTask, status: CrmTask["status"]) {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          status,
          completedAt:
            status === "Complete" ? new Date().toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not update appointment."));
        return;
      }
      const updated = await res.json();
      setTasks(tasks.map((item) => (item.id === task.id ? updated : item)));
      setAppMessage(
        status === "Showroom"
          ? "Appointment marked in showroom."
          : status === "Complete"
            ? "Appointment completed."
            : "Appointment updated.",
      );
    } catch {
      setAppMessage("Could not connect to backend to update appointment.");
    }
  }

  async function completeTask(task: CrmTask) {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task.id}/complete`, {
        method: "PATCH",
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not complete task."));
        return;
      }
      const updated = await res.json();
      setTasks(tasks.map((item) => (item.id === task.id ? updated : item)));
      setAppMessage("Task completed.");
    } catch {
      setAppMessage("Could not connect to backend to complete task.");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer || !messageForm.body) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...messageForm,
          customerId: selectedCustomer.id,
        }),
      });
      if (!res.ok) {
        setAppMessage(await readApiError(res, "Could not send message."));
        return;
      }
      const message = await res.json();
      setMessages([message, ...messages]);
      setMessageForm({ ...messageForm, body: "" });
      setAppMessage(`${message.channel} sent.`);
    } catch {
      setAppMessage("Could not connect to backend to send message.");
    }
  }

  // ── VIN ───────────────────────────────────────────────────────────────────

  async function lookupVin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vin) return;
    setVinLoading(true);
    setVinError("");
    setVinResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/vin/${vin}`);
      if (!res.ok) {
        setVinError("VIN not found or invalid.");
        return;
      }
      setVinResult(await res.json());
    } catch {
      setVinError("Could not reach VIN lookup service.");
    } finally {
      setVinLoading(false);
    }
  }

  async function lookupTradeVin(vinStr: string) {
    if (vinStr.length !== 17) return;
    setTradeVinLoading(true);
    setTradeBookValue(null);
    try {
      const res = await fetch(`${API_BASE}/api/vin/${vinStr}`);
      if (res.ok) {
        const data = await res.json();
        setTradeForm((f) => ({
          ...f,
          year: data.year || f.year,
          make: data.make || f.make,
          model: data.model || f.model,
        }));
        const miles = parseInt(tradeForm.mileage) || 0;
        const bvParams = new URLSearchParams({
          year: data.year,
          make: data.make,
          model: data.model,
          mileage: String(miles),
        });
        const bvRes = await fetch(`${API_BASE}/api/book-value?${bvParams}`);
        if (bvRes.ok) {
          const bv = await bvRes.json();
          setTradeBookValue({
            low: bv.low,
            avg: bv.avg,
            high: bv.high,
            state: bv.source === "marketcheck" ? "Live Market" : "Estimate",
            ageYears: Math.max(
              0,
              new Date().getFullYear() - parseInt(data.year),
            ),
          });
          setTradeForm((f) => ({ ...f, estimatedValue: String(bv.avg) }));
        } else {
          const fallback = estimateBookValue(
            data.year,
            data.make,
            data.model,
            miles || undefined,
          );
          setTradeBookValue(fallback);
          setTradeForm((f) => ({ ...f, estimatedValue: String(fallback.avg) }));
        }
      }
    } catch {
      /* ignore */
    } finally {
      setTradeVinLoading(false);
    }
  }

  // ── Login Page ────────────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleAuth}>
          <div className="brand-mark">AS</div>
          <p className="eyebrow">AutoSuite CRM</p>
          <h1>
            {authMode === "signup"
              ? "Create account"
              : authMode === "forgot"
                ? "Reset password"
                : "Sign in"}
          </h1>
          {authMode === "signup" && (
            <input
              aria-label="Name"
              placeholder="Full name"
              value={loginForm.name}
              onChange={(e) =>
                setLoginForm({ ...loginForm, name: e.target.value })
              }
            />
          )}
          <input
            aria-label="Email"
            placeholder="Work email"
            type="email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({ ...loginForm, email: e.target.value })
            }
          />
          <input
            aria-label="Password"
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
          />
          {authMode === "login" && (
            <small className="login-hint">
              Demo: avery@example.com / password
            </small>
          )}
          {authMode === "forgot" && (
            <small className="login-hint">
              Enter your email and a new password.
            </small>
          )}
          {authError && <p className="auth-error">{authError}</p>}
          {authMessage && <p className="auth-success">{authMessage}</p>}
          <button type="submit">
            {authMode === "signup"
              ? "Create Account"
              : authMode === "forgot"
                ? "Update Password"
                : "Log In"}
          </button>
          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setAuthError("");
              setAuthMessage("");
              setAuthMode(authMode === "signup" ? "login" : "signup");
            }}
          >
            {authMode === "signup"
              ? "Already have an account? Log in"
              : "Create an account"}
          </button>
          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setAuthError("");
              setAuthMessage("");
              setAuthMode(authMode === "forgot" ? "login" : "forgot");
            }}
          >
            {authMode === "forgot" ? "Back to login" : "Forgot password?"}
          </button>
        </form>
      </main>
    );
  }

  // ── Customer Profile / Deal Jacket ────────────────────────────────────────

  const appointmentModal = showAppointmentModal && (
    <div
      className="appointment-backdrop"
      onClick={() => setShowAppointmentModal(false)}
    >
      <form
        className="settings-modal appointment-modal"
        onSubmit={setAppointment}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <div className="settings-avatar-preview appointment-avatar">
            <span>📅</span>
          </div>
          <div>
            <p className="eyebrow">
              {editingAppointmentId
                ? "Edit Appointment"
                : "Schedule Appointment"}
            </p>
            <h3>
              {selectedCustomer
                ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                : "Customer"}
            </h3>
          </div>
        </div>
        <label>
          Appointment Title
          <input
            value={appointmentForm.title}
            onChange={(e) =>
              setAppointmentForm({ ...appointmentForm, title: e.target.value })
            }
            placeholder="Sales appointment"
          />
        </label>
        <label>
          Date & Time
          <input
            type="datetime-local"
            value={appointmentForm.dueAt}
            onChange={(e) =>
              setAppointmentForm({ ...appointmentForm, dueAt: e.target.value })
            }
          />
        </label>
        <label>
          Priority
          <select
            value={appointmentForm.priority}
            onChange={(e) =>
              setAppointmentForm({
                ...appointmentForm,
                priority: e.target.value as CrmTask["priority"],
              })
            }
          >
            <option>Normal</option>
            <option>High</option>
          </select>
        </label>
        <label>
          Notes
          <textarea
            value={appointmentForm.notes}
            onChange={(e) =>
              setAppointmentForm({ ...appointmentForm, notes: e.target.value })
            }
            placeholder="What are they coming in for?"
          />
        </label>
        <div className="settings-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => setShowAppointmentModal(false)}
          >
            Cancel
          </button>
          <button type="submit" className="dup-add-anyway">
            {editingAppointmentId ? "Save Appointment" : "Schedule"}
          </button>
        </div>
      </form>
    </div>
  );

  const noteModal = showNoteModal && (
    <div
      className="appointment-backdrop"
      onClick={() => setShowNoteModal(false)}
    >
      <form
        className="settings-modal appointment-modal"
        onSubmit={saveQuickNote}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <div className="settings-avatar-preview appointment-avatar">
            <span>📝</span>
          </div>
          <div>
            <p className="eyebrow">Customer Note</p>
            <h3>
              {selectedCustomer
                ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                : "Customer"}
            </h3>
          </div>
        </div>
        <label>
          Note
          <textarea
            value={noteModalText}
            onChange={(e) => setNoteModalText(e.target.value)}
            placeholder="Type your note..."
          />
        </label>
        <div className="settings-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => setShowNoteModal(false)}
          >
            Cancel
          </button>
          <button type="submit" className="dup-add-anyway">
            Save Note
          </button>
        </div>
      </form>
    </div>
  );

  if (selectedCustomerId) {
    return (
      <>
        {appointmentModal}
        {noteModal}
        <main className={`app-shell theme-${themeMode}`}>
          <aside className="sidebar">
            <div className="sidebar-brand">
              <div className="brand-mark">AS</div>
              <div className="brand-name">
                <strong>AutoSuite</strong>
                <span>CRM</span>
              </div>
            </div>
            <nav>
              <a href="#/dashboard">
                <span className="nav-item-inner">
                  <span className="nav-icon">
                    <LayoutDashboard size={16} />
                  </span>
                  <span className="nav-label">Dashboard</span>
                </span>
              </a>
              <a href="#/leads">
                <span className="nav-item-inner">
                  <span className="nav-icon">
                    <Inbox size={16} />
                  </span>
                  <span className="nav-label">Lead Inbox</span>
                </span>
              </a>
              <a href="#/customers">
                <span className="nav-item-inner">
                  <span className="nav-icon">
                    <Users size={16} />
                  </span>
                  <span className="nav-label">Customers</span>
                </span>
              </a>
              <a className="active" href={`#/customers/${selectedCustomerId}`}>
                <span className="nav-item-inner">
                  <span className="nav-icon">
                    <FileText size={16} />
                  </span>
                  <span className="nav-label">Deal Jacket</span>
                </span>
              </a>
            </nav>
            <div className="sidebar-footer">
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleThemeMode}
              >
                <span className="theme-toggle-track">
                  <span className="theme-toggle-thumb" />
                </span>
                <span>{themeMode === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("crm-authenticated");
                  setIsLoggedIn(false);
                }}
              >
                <LogOut size={14} />
                Log Out
              </button>
            </div>
          </aside>

          <section className="workspace">
            {appMessage && (
              <p className="app-message" onClick={() => setAppMessage("")}>
                {appMessage} ×
              </p>
            )}
            <header className="page-header">
              <div>
                <p className="eyebrow">Deal Jacket</p>
                <h1>
                  {selectedCustomer
                    ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                    : "Customer not found"}
                </h1>
                {selectedCustomer && (
                  <div className="profile-meta">
                    <span>{selectedCustomer.phone}</span>
                    <span>{selectedCustomer.email || "No email"}</span>
                    <span
                      className={`status-badge ${statusClass(selectedCustomer.status)}`}
                    >
                      {selectedCustomer.status}
                    </span>
                    {selectedCustomer.assignedTo && (
                      <span className="meta-tag">
                        Rep: {selectedCustomer.assignedTo}
                      </span>
                    )}
                    {selectedCustomer.source && (
                      <span className="meta-tag source-tag">
                        {selectedCustomer.source}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="page-header-actions">
                {nextProfileAppointment &&
                  nextProfileAppointment.status !== "Showroom" && (
                    <button
                      type="button"
                      className="showroom-btn"
                      onClick={() =>
                        updateTaskStatus(nextProfileAppointment, "Showroom")
                      }
                    >
                      Mark In Showroom
                    </button>
                  )}
                {selectedCustomer &&
                  (selectedCustomer.status === "Sold" ? (
                    <button
                      type="button"
                      className="unsold-btn"
                      onClick={() => markCustomerUnsold(selectedCustomer)}
                    >
                      Mark Unsold
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sold-btn"
                      onClick={() => markCustomerSold(selectedCustomer)}
                    >
                      Mark Sold
                    </button>
                  ))}
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    window.location.hash = "#/customers";
                  }}
                >
                  ← All Customers
                </button>
              </div>
            </header>

            {!selectedCustomer ? (
              <article className="panel">
                <h2>Customer not found.</h2>
              </article>
            ) : (
              <article className="panel profile-panel">
                <div className="profile-tabs">
                  {(
                    [
                      "overview",
                      "finance",
                      "credit",
                      "deals",
                      "followup",
                      "appointments",
                      "messages",
                      "activity",
                      "service",
                    ] as ProfileTab[]
                  ).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={profileTab === tab ? "active" : ""}
                      onClick={() => setProfileTab(tab)}
                    >
                      {tab === "overview" && "Overview"}
                      {tab === "finance" &&
                        `Finance App${profileFinance.length ? ` (${profileFinance.length})` : ""}`}
                      {tab === "credit" &&
                        `Credit${profileCreditApps.length ? ` (${profileCreditApps.length})` : ""}`}
                      {tab === "deals" && "Deals"}
                      {tab === "followup" &&
                        `Follow-Up${profileTasks.filter((task) => task.status === "Open").length ? ` (${profileTasks.filter((task) => task.status === "Open").length})` : ""}`}
                      {tab === "appointments" &&
                        `Appointments${profileAppointments.length ? ` (${profileAppointments.length})` : ""}`}
                      {tab === "messages" &&
                        `Messages${profileMessages.length ? ` (${profileMessages.length})` : ""}`}
                      {tab === "activity" &&
                        `Activity${profileActivities.length ? ` (${profileActivities.length})` : ""}`}
                      {tab === "service" &&
                        (() => {
                          const cnt = repairOrders.filter(
                            (r) => r.customerId === selectedCustomer.id,
                          ).length;
                          return `Service${cnt ? ` (${cnt})` : ""}`;
                        })()}
                    </button>
                  ))}
                </div>

                {profileTab === "overview" && (
                  <div className="crm-overview">
                    {/* ── Left: Contact Card ── */}
                    <div className="crm-contact-panel">
                      <div className="crm-avatar">
                        {selectedCustomer.firstName[0]}
                        {selectedCustomer.lastName[0] || ""}
                      </div>
                      <div className="crm-name-block">
                        <h2>
                          {selectedCustomer.firstName}{" "}
                          {selectedCustomer.lastName}
                        </h2>
                        <div className="crm-badges">
                          <span
                            className={`status-badge ${statusClass(selectedCustomer.status)}`}
                          >
                            {selectedCustomer.status}
                          </span>
                          {selectedCustomer.temperature && (
                            <span
                              className={`temp-badge ${tempClass(selectedCustomer.temperature)}`}
                            >
                              {selectedCustomer.temperature}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick action buttons */}
                      <div className="crm-quick-actions">
                        {[
                          {
                            label: "📞 Call",
                            type: "Call" as Activity["type"],
                          },
                          {
                            label: "💬 Text",
                            type: "Text" as Activity["type"],
                          },
                          {
                            label: "✉ Email",
                            type: "Email" as Activity["type"],
                          },
                          {
                            label: "📅 Schedule",
                            type: "Appointment" as Activity["type"],
                          },
                          {
                            label: "📝 Note",
                            type: "Note" as Activity["type"],
                          },
                        ].map(({ label, type }) => (
                          <button
                            key={type}
                            type="button"
                            className="quick-action-btn"
                            onClick={() => {
                              if (type === "Appointment") {
                                setEditingAppointmentId(null);
                                setAppointmentForm({
                                  title: "Sales appointment",
                                  dueAt: "",
                                  priority: "High",
                                  notes: "",
                                });
                                setShowAppointmentModal(true);
                                return;
                              }
                              if (type === "Note") {
                                setNoteModalText("");
                                setShowNoteModal(true);
                                return;
                              }
                              setQuickActivityType(type);
                              setQuickActivityNote(`${type} logged`);
                              setTimeout(addQuickActivity, 0);
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Contact info — view or edit */}
                      {profileEditMode ? (
                        <form
                          className="crm-edit-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            doSaveCustomer();
                            setProfileEditMode(false);
                          }}
                        >
                          <div className="crm-edit-row">
                            <label>
                              First Name
                              <input
                                value={customerForm.firstName}
                                onChange={(e) =>
                                  setCustomerForm({
                                    ...customerForm,
                                    firstName: e.target.value,
                                  })
                                }
                                required
                              />
                            </label>
                            <label>
                              Last Name
                              <input
                                value={customerForm.lastName}
                                onChange={(e) =>
                                  setCustomerForm({
                                    ...customerForm,
                                    lastName: e.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                          <div className="crm-edit-row">
                            <label>
                              Phone
                              <input
                                value={customerForm.phone}
                                onChange={(e) =>
                                  setCustomerForm({
                                    ...customerForm,
                                    phone: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              Email
                              <input
                                type="email"
                                value={customerForm.email}
                                onChange={(e) =>
                                  setCustomerForm({
                                    ...customerForm,
                                    email: e.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                          <label>
                            Address
                            <input
                              value={customerForm.address}
                              placeholder="123 Main St, City, ST 12345"
                              onChange={(e) =>
                                setCustomerForm({
                                  ...customerForm,
                                  address: e.target.value,
                                })
                              }
                            />
                          </label>
                          <div className="crm-edit-row">
                            <label>
                              Status
                              <select
                                value={customerForm.status}
                                onChange={(e) =>
                                  setCustomerForm({
                                    ...customerForm,
                                    status: e.target.value as CustomerStatus,
                                  })
                                }
                              >
                                <option>New Lead</option>
                                <option>Contacted</option>
                                <option>Appt Set</option>
                                <option>Appt Show</option>
                                <option>Working</option>
                                <option>Sold</option>
                                <option>Lost</option>
                              </select>
                            </label>
                            <label>
                              Temperature
                              <select
                                value={customerForm.temperature}
                                onChange={(e) =>
                                  setCustomerForm({
                                    ...customerForm,
                                    temperature: e.target.value as
                                      | LeadTemp
                                      | "",
                                  })
                                }
                              >
                                <option value="">—</option>
                                <option>Hot</option>
                                <option>Warm</option>
                                <option>Cold</option>
                              </select>
                            </label>
                          </div>
                          <div className="crm-edit-row">
                            <label>
                              Source
                              <input
                                value={customerForm.source}
                                onChange={(e) =>
                                  setCustomerForm({
                                    ...customerForm,
                                    source: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              Assigned Rep
                              <input
                                value={customerForm.assignedTo}
                                onChange={(e) =>
                                  setCustomerForm({
                                    ...customerForm,
                                    assignedTo: e.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                          <label>
                            Vehicle of Interest
                            <input
                              value={customerForm.interestedVehicle}
                              onChange={(e) =>
                                setCustomerForm({
                                  ...customerForm,
                                  interestedVehicle: e.target.value,
                                })
                              }
                            />
                          </label>
                          <label>
                            Next Follow-Up
                            <input
                              value={customerForm.nextFollowUp}
                              onChange={(e) =>
                                setCustomerForm({
                                  ...customerForm,
                                  nextFollowUp: e.target.value,
                                })
                              }
                            />
                          </label>
                          <div className="crm-edit-actions">
                            <button type="submit" className="search-go-btn">
                              Save Changes
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => {
                                resetCustomerForm();
                                setProfileEditMode(false);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="crm-contact-info">
                          <div className="crm-info-row">
                            <span className="crm-info-icon">📞</span>
                            <div>
                              <span className="crm-info-label">Phone</span>
                              <a
                                href={`tel:${selectedCustomer.phone}`}
                                className="crm-info-value"
                              >
                                {selectedCustomer.phone || (
                                  <span className="muted">—</span>
                                )}
                              </a>
                            </div>
                          </div>
                          <div className="crm-info-row">
                            <span className="crm-info-icon">✉</span>
                            <div>
                              <span className="crm-info-label">Email</span>
                              <a
                                href={`mailto:${selectedCustomer.email}`}
                                className="crm-info-value"
                              >
                                {selectedCustomer.email || (
                                  <span className="muted">—</span>
                                )}
                              </a>
                            </div>
                          </div>
                          <div className="crm-info-row">
                            <span className="crm-info-icon">📍</span>
                            <div>
                              <span className="crm-info-label">Address</span>
                              <span className="crm-info-value">
                                {selectedCustomer.address || (
                                  <span className="muted">Not on file</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="crm-info-row">
                            <span className="crm-info-icon">🚗</span>
                            <div>
                              <span className="crm-info-label">
                                Vehicle Interest
                              </span>
                              <span className="crm-info-value">
                                {selectedCustomer.interestedVehicle || (
                                  <span className="muted">—</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="crm-info-row">
                            <span className="crm-info-icon">📅</span>
                            <div>
                              <span className="crm-info-label">
                                Next Follow-Up
                              </span>
                              <span className="crm-info-value">
                                {selectedCustomer.nextFollowUp || (
                                  <span className="muted">Not scheduled</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="crm-info-row">
                            <span className="crm-info-icon">👤</span>
                            <div>
                              <span className="crm-info-label">
                                Assigned Rep
                              </span>
                              <span className="crm-info-value">
                                {selectedCustomer.assignedTo || (
                                  <span className="muted">Unassigned</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="crm-info-row">
                            <span className="crm-info-icon">🔗</span>
                            <div>
                              <span className="crm-info-label">Source</span>
                              <span className="crm-info-value">
                                {selectedCustomer.source || (
                                  <span className="muted">Unknown</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="crm-edit-btn"
                            onClick={() => {
                              editCustomer(selectedCustomer);
                              setProfileEditMode(true);
                            }}
                          >
                            ✏ Edit Contact Info
                          </button>
                        </div>
                      )}

                      {/* Stats strip */}
                      <div className="crm-stat-strip">
                        <div className="crm-stat">
                          <strong>{profileFinance.length}</strong>
                          <span>Finance Apps</span>
                        </div>
                        <div className="crm-stat">
                          <strong>{profileTrades.length}</strong>
                          <span>Trade-Ins</span>
                        </div>
                        <div className="crm-stat">
                          <strong>{profileActivities.length}</strong>
                          <span>Activities</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Right: Activity Feed ── */}
                    <div className="crm-activity-panel">
                      <p className="card-label" style={{ marginBottom: 10 }}>
                        Log Activity
                      </p>
                      <div className="quick-act-row">
                        <select
                          value={quickActivityType}
                          onChange={(e) =>
                            setQuickActivityType(
                              e.target.value as Activity["type"],
                            )
                          }
                        >
                          <option>Call</option>
                          <option>Text</option>
                          <option>Email</option>
                          <option>Appointment</option>
                          <option>Note</option>
                        </select>
                        <input
                          placeholder="What happened or was discussed?"
                          value={quickActivityNote}
                          onChange={(e) => setQuickActivityNote(e.target.value)}
                        />
                        <button type="button" onClick={addQuickActivity}>
                          Log
                        </button>
                      </div>
                      <div className="activity-timeline">
                        {profileActivities.slice(0, 10).map((act) => (
                          <div className="timeline-item" key={act.id}>
                            <span
                              className={`timeline-dot dot-${act.type.toLowerCase()}`}
                            />
                            <div>
                              <strong>{act.type}</strong>
                              <span>{act.note}</span>
                              <small>
                                {new Date(act.createdAt).toLocaleString()}
                              </small>
                            </div>
                          </div>
                        ))}
                        {profileActivities.length === 0 && (
                          <p className="empty-state">
                            No activity yet on this deal jacket.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === "finance" && (
                  <form
                    className="credit-form"
                    onSubmit={addFinanceApplication}
                  >
                    <h3 className="form-section-title">Buyer Information</h3>
                    <input
                      placeholder="Applicant name"
                      value={financeForm.applicantName}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          applicantName: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Date of birth (MM/DD/YYYY)"
                      value={financeForm.dateOfBirth}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="SSN last 4 digits"
                      value={financeForm.ssnLast4}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          ssnLast4: e.target.value,
                        })
                      }
                    />
                    <h3 className="form-section-title">Address</h3>
                    <input
                      placeholder="Street address"
                      value={financeForm.address}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          address: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="City"
                      value={financeForm.city}
                      onChange={(e) =>
                        setFinanceForm({ ...financeForm, city: e.target.value })
                      }
                    />
                    <input
                      placeholder="State"
                      value={financeForm.state}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          state: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="ZIP code"
                      value={financeForm.zip}
                      onChange={(e) =>
                        setFinanceForm({ ...financeForm, zip: e.target.value })
                      }
                    />
                    <h3 className="form-section-title">Employment</h3>
                    <input
                      placeholder="Employer name"
                      value={financeForm.employerName}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          employerName: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Job title"
                      value={financeForm.jobTitle}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          jobTitle: e.target.value,
                        })
                      }
                    />
                    <select
                      value={financeForm.employmentStatus}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          employmentStatus: e.target.value,
                        })
                      }
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Self-employed</option>
                      <option>Retired</option>
                      <option>Other</option>
                    </select>
                    <input
                      placeholder="Time on job (e.g. 3 years)"
                      value={financeForm.timeOnJob}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          timeOnJob: e.target.value,
                        })
                      }
                    />
                    <h3 className="form-section-title">Income</h3>
                    <input
                      placeholder="Monthly gross income ($)"
                      value={financeForm.monthlyIncome}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          monthlyIncome: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Other monthly income ($)"
                      value={financeForm.otherIncome}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          otherIncome: e.target.value,
                        })
                      }
                    />
                    <h3 className="form-section-title">Deal Structure</h3>
                    <input
                      placeholder="Requested vehicle"
                      value={financeForm.requestedVehicle}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          requestedVehicle: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Down payment ($)"
                      value={financeForm.downPayment}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          downPayment: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Trade-in payoff ($)"
                      value={financeForm.tradePayoff}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          tradePayoff: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Amount requested ($)"
                      value={financeForm.requestedAmount}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          requestedAmount: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Term in months (e.g. 72)"
                      value={financeForm.termMonths}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          termMonths: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Credit range (e.g. 680-719)"
                      value={financeForm.creditRange}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          creditRange: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Preferred lender"
                      value={financeForm.lender}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          lender: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Decision notes"
                      value={financeForm.decisionNotes}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          decisionNotes: e.target.value,
                        })
                      }
                    />
                    <select
                      value={financeForm.status}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          status: e.target
                            .value as FinanceApplication["status"],
                        })
                      }
                    >
                      <option>New</option>
                      <option>Submitted</option>
                      <option>Approved</option>
                      <option>Needs Review</option>
                    </select>
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={financeForm.consentToPullCredit}
                        onChange={(e) =>
                          setFinanceForm({
                            ...financeForm,
                            consentToPullCredit: e.target.checked,
                          })
                        }
                      />
                      Customer authorizes credit bureau pull
                    </label>
                    <button type="submit" className="submit-btn">
                      Submit Finance Application
                    </button>
                  </form>
                )}

                {profileTab === "credit" && (
                  <div>
                    <form
                      className="credit-form"
                      onSubmit={addCreditApplication}
                      style={{ marginBottom: 24 }}
                    >
                      <h3 className="form-section-title">Credit Application</h3>
                      <input
                        placeholder="Applicant name"
                        value={creditForm.applicantName}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            applicantName: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Date of birth"
                        value={creditForm.dateOfBirth}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="SSN last 4"
                        value={creditForm.ssnLast4}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            ssnLast4: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Address"
                        value={creditForm.address}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            address: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="City"
                        value={creditForm.city}
                        onChange={(e) =>
                          setCreditForm({ ...creditForm, city: e.target.value })
                        }
                      />
                      <input
                        placeholder="State"
                        value={creditForm.state}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            state: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="ZIP"
                        value={creditForm.zip}
                        onChange={(e) =>
                          setCreditForm({ ...creditForm, zip: e.target.value })
                        }
                      />
                      <select
                        value={creditForm.residenceType}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            residenceType: e.target.value,
                          })
                        }
                      >
                        <option>Rent</option>
                        <option>Own</option>
                        <option>Family</option>
                        <option>Other</option>
                      </select>
                      <input
                        placeholder="Time at address"
                        value={creditForm.timeAtAddress}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            timeAtAddress: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Employer"
                        value={creditForm.employerName}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            employerName: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Job title"
                        value={creditForm.jobTitle}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            jobTitle: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Monthly income"
                        value={creditForm.monthlyIncome}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            monthlyIncome: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Other income"
                        value={creditForm.otherIncome}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            otherIncome: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Bank name"
                        value={creditForm.bankName}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            bankName: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Down payment"
                        value={creditForm.downPayment}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            downPayment: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Requested vehicle"
                        value={creditForm.requestedVehicle}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            requestedVehicle: e.target.value,
                          })
                        }
                      />
                      <select
                        value={creditForm.status}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            status: e.target
                              .value as CreditApplication["status"],
                          })
                        }
                      >
                        <option>Draft</option>
                        <option>Submitted</option>
                        <option>Manager Review</option>
                        <option>Approved</option>
                        <option>Declined</option>
                      </select>
                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={creditForm.consentToPullCredit}
                          onChange={(e) =>
                            setCreditForm({
                              ...creditForm,
                              consentToPullCredit: e.target.checked,
                            })
                          }
                        />
                        Customer authorized credit review
                      </label>
                      <button type="submit">Save Credit Application</button>
                    </form>
                    <div className="deal-list">
                      {profileCreditApps.length === 0 && (
                        <p className="empty-state">
                          No credit applications on file.
                        </p>
                      )}
                      {profileCreditApps.map((app) => (
                        <div className="deal-card" key={app.id}>
                          <strong>{app.applicantName}</strong>
                          <span>
                            {app.employerName || "No employer"} — $
                            {app.monthlyIncome.toLocaleString()}/mo
                          </span>
                          <div className="card-row">
                            <span
                              className={`status-badge ${app.status === "Approved" ? "badge-sold" : app.status === "Declined" ? "badge-danger" : "badge-finance"}`}
                            >
                              {app.status}
                            </span>
                            <small>
                              {new Date(app.submittedAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profileTab === "deals" && (
                  <div className="deals-layout">
                    <div>
                      <p className="card-label">Saved Desk Deals</p>
                      <div className="deal-list">
                        {profileSavedDeskDeals.length === 0 && (
                          <p className="empty-state">
                            No saved desk deals yet.
                          </p>
                        )}
                        {profileSavedDeskDeals.map((savedDeal) => (
                          <button
                            className="deal-card clickable saved-desk-card"
                            key={savedDeal.id}
                            onClick={() => reopenDeskDeal(savedDeal)}
                            type="button"
                          >
                            <strong>
                              {String(savedDeal.desk.year || "")}{" "}
                              {String(savedDeal.desk.make || "")}{" "}
                              {String(savedDeal.desk.model || "") ||
                                "Desk Deal"}
                            </strong>
                            <span>
                              ${savedDeal.monthly.toFixed(2)}/mo · $
                              {savedDeal.amountFinanced.toLocaleString(
                                undefined,
                                {
                                  maximumFractionDigits: 0,
                                },
                              )}{" "}
                              financed
                            </span>
                            <small>
                              Saved{" "}
                              {new Date(savedDeal.createdAt).toLocaleString()}
                            </small>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="card-label">Finance Applications</p>
                      <div className="deal-list">
                        {profileFinance.length === 0 && (
                          <p className="empty-state">
                            No finance applications yet.
                          </p>
                        )}
                        {profileFinance.map((app) => (
                          <div className="deal-card" key={app.id}>
                            <strong>
                              {app.requestedVehicle ||
                                selectedCustomer.interestedVehicle}
                            </strong>
                            <span>
                              ${app.downPayment.toLocaleString()} down ·{" "}
                              {app.creditRange}
                            </span>
                            <select
                              value={app.status}
                              onChange={(e) =>
                                updateFinanceStatus(
                                  app.id,
                                  e.target
                                    .value as FinanceApplication["status"],
                                )
                              }
                            >
                              <option>New</option>
                              <option>Submitted</option>
                              <option>Approved</option>
                              <option>Needs Review</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="card-label">Vehicle Sales</p>
                      <div className="deal-list">
                        {profileSales.length === 0 && (
                          <p className="empty-state">
                            No vehicle sales on this deal.
                          </p>
                        )}
                        {profileSales.map((sale) => (
                          <div className="deal-card" key={sale.id}>
                            <strong>
                              {sale.year} {sale.make} {sale.model}
                            </strong>
                            <span>
                              Stock #{sale.stockNumber} · $
                              {sale.salePrice.toLocaleString()}
                            </span>
                            <span
                              className={`status-badge ${sale.stage === "Delivered" ? "badge-sold" : "badge-finance"}`}
                            >
                              {sale.stage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="card-label">Trade-Ins</p>
                      <div className="deal-list">
                        {profileTrades.length === 0 && (
                          <p className="empty-state">
                            No trade-ins on this deal.
                          </p>
                        )}
                        {profileTrades.map((trade) => (
                          <div className="deal-card" key={trade.id}>
                            <strong>
                              {trade.year} {trade.make} {trade.model}
                            </strong>
                            <span>
                              {trade.mileage.toLocaleString()} miles · ACV $
                              {trade.estimatedValue.toLocaleString()}
                            </span>
                            <span>
                              Payoff: ${trade.payoff.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === "service" &&
                  (() => {
                    const customerROs = repairOrders.filter(
                      (r) => r.customerId === selectedCustomer.id,
                    );
                    return (
                      <div>
                        {customerROs.length === 0 ? (
                          <p className="empty-state">
                            No service history for this customer.
                          </p>
                        ) : (
                          <div className="service-history-list">
                            {customerROs.map((ro) => (
                              <div className="service-history-card" key={ro.id}>
                                <div className="sh-header">
                                  <div>
                                    <code className="ro-number">
                                      {ro.roNumber}
                                    </code>
                                    <span
                                      className="ro-status-badge ro-badge-inline"
                                      style={{ marginLeft: 8 }}
                                    >
                                      {ro.status}
                                    </span>
                                  </div>
                                  <span className="sh-date">
                                    {new Date(
                                      ro.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <strong className="sh-vehicle">
                                  {ro.vehicleYear} {ro.vehicleMake}{" "}
                                  {ro.vehicleModel} —{" "}
                                  {ro.vehicleMileageIn.toLocaleString()} mi
                                </strong>
                                <div className="sh-lines">
                                  {ro.lines.map((line) => (
                                    <div className="sh-line" key={line.id}>
                                      <span>{line.description}</span>
                                      <span>
                                        $
                                        {(
                                          line.laborTotal + line.partsTotal
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="sh-total">
                                  <span>Advisor: {ro.advisor}</span>
                                  <strong>
                                    Total: ${ro.total.toLocaleString()}
                                  </strong>
                                </div>
                                {ro.notes && (
                                  <p className="ro-notes">{ro.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {profileTab === "followup" && (
                  <div className="crm-two-col">
                    <div className="profile-form-stack">
                      <div className="mini-form appointment-form">
                        <p className="card-label">Appointments</p>
                        <strong>
                          Schedule test drives, showroom visits, and follow-ups.
                        </strong>
                        <span>
                          Use the popup to add date, time, priority, and notes.
                        </span>
                        <button
                          type="button"
                          onClick={() => openAppointmentModal()}
                        >
                          + Schedule Appointment
                        </button>
                      </div>
                      <form className="mini-form" onSubmit={addTask}>
                        <p className="card-label">Create Follow-Up</p>
                        <input
                          placeholder="Task title"
                          value={taskForm.title}
                          onChange={(e) =>
                            setTaskForm({ ...taskForm, title: e.target.value })
                          }
                        />
                        <select
                          value={taskForm.type}
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              type: e.target.value as CrmTask["type"],
                            })
                          }
                        >
                          <option>Call</option>
                          <option>Text</option>
                          <option>Email</option>
                          <option>Appointment</option>
                          <option>Follow-Up</option>
                        </select>
                        <input
                          type="datetime-local"
                          value={taskForm.dueAt}
                          onChange={(e) =>
                            setTaskForm({ ...taskForm, dueAt: e.target.value })
                          }
                        />
                        <select
                          value={taskForm.priority}
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              priority: e.target.value as CrmTask["priority"],
                            })
                          }
                        >
                          <option>Low</option>
                          <option>Normal</option>
                          <option>High</option>
                        </select>
                        <button type="submit">Add Task</button>
                      </form>
                    </div>
                    <div className="task-list">
                      <p className="card-label">Open Follow-Ups</p>
                      {profileTasks.length === 0 && (
                        <p className="empty-state">No follow-ups yet.</p>
                      )}
                      {profileTasks.map((task) => (
                        <div
                          className={`task-card ${task.status === "Complete" ? "done" : ""}`}
                          key={task.id}
                        >
                          <div>
                            <strong>{task.title}</strong>
                            <span>
                              {task.type} · {task.priority} · Due{" "}
                              {new Date(task.dueAt).toLocaleString()}
                            </span>
                          </div>
                          {task.status !== "Complete" ? (
                            <div className="appointment-actions">
                              {task.type === "Appointment" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openAppointmentModal(task)}
                                  >
                                    Edit
                                  </button>
                                  {task.status !== "Showroom" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateTaskStatus(task, "Showroom")
                                      }
                                    >
                                      In Showroom
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  task.type === "Appointment"
                                    ? updateTaskStatus(task, "Complete")
                                    : completeTask(task)
                                }
                              >
                                Complete
                              </button>
                            </div>
                          ) : (
                            <small>Done</small>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profileTab === "appointments" && (
                  <div className="task-list appointment-tab-list">
                    <div className="appointment-tab-head">
                      <div>
                        <p className="card-label">Appointments</p>
                        <h3>Scheduled visits and showroom activity</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAppointmentModal()}
                      >
                        + Schedule Appointment
                      </button>
                    </div>
                    {profileAppointments.length === 0 && (
                      <p className="empty-state">No appointments scheduled.</p>
                    )}
                    {profileAppointments.map((task) => (
                      <div
                        className={`task-card appointment-card-full ${task.status === "Complete" ? "done" : ""}`}
                        key={task.id}
                      >
                        <div>
                          <strong>{task.title}</strong>
                          <span>
                            {task.priority} · {task.status} ·{" "}
                            {new Date(task.dueAt).toLocaleString()}
                          </span>
                        </div>
                        {task.status !== "Complete" ? (
                          <div className="appointment-actions">
                            <button
                              type="button"
                              onClick={() => openAppointmentModal(task)}
                            >
                              Edit
                            </button>
                            {task.status !== "Showroom" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateTaskStatus(task, "Showroom")
                                }
                              >
                                In Showroom
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => updateTaskStatus(task, "Complete")}
                            >
                              Complete
                            </button>
                          </div>
                        ) : (
                          <small>Completed</small>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {profileTab === "messages" && (
                  <div className="crm-two-col">
                    <form className="mini-form" onSubmit={sendMessage}>
                      <p className="card-label">Send Message</p>
                      <select
                        value={messageForm.channel}
                        onChange={(e) =>
                          setMessageForm({
                            ...messageForm,
                            channel: e.target.value as Message["channel"],
                          })
                        }
                      >
                        <option>Text</option>
                        <option>Email</option>
                      </select>
                      <select
                        value={messageForm.template}
                        onChange={(e) => {
                          const template = e.target.value;
                          const body =
                            template === "Appointment Confirmation"
                              ? "Hi, confirming your appointment with us. Does your scheduled time still work?"
                              : template === "No Response Follow-Up"
                                ? "Hi, just checking in to see if you still have questions about the vehicle."
                                : template === "Service Equity"
                                  ? "Based on your current vehicle, you may have strong trade equity. Want to review options?"
                                  : "Hi, this is Avery with the dealership. I wanted to follow up and see how I can help.";
                          setMessageForm({ ...messageForm, template, body });
                        }}
                      >
                        <option>First Response</option>
                        <option>Appointment Confirmation</option>
                        <option>No Response Follow-Up</option>
                        <option>Service Equity</option>
                      </select>
                      <textarea
                        value={messageForm.body}
                        onChange={(e) =>
                          setMessageForm({
                            ...messageForm,
                            body: e.target.value,
                          })
                        }
                      />
                      <button type="submit">Send</button>
                    </form>
                    <div className="message-thread">
                      <p className="card-label">Conversation Thread</p>
                      {profileMessages.length === 0 && (
                        <p className="empty-state">No messages yet.</p>
                      )}
                      {profileMessages.map((message) => (
                        <div
                          className="message-bubble outbound"
                          key={message.id}
                        >
                          <strong>
                            {message.channel}
                            {message.template ? ` · ${message.template}` : ""}
                          </strong>
                          <span>{message.body}</span>
                          <small>
                            {new Date(message.createdAt).toLocaleString()}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profileTab === "activity" && (
                  <div>
                    <div className="quick-act-row" style={{ marginBottom: 18 }}>
                      <select
                        value={quickActivityType}
                        onChange={(e) =>
                          setQuickActivityType(
                            e.target.value as Activity["type"],
                          )
                        }
                      >
                        <option>Call</option>
                        <option>Text</option>
                        <option>Email</option>
                        <option>Appointment</option>
                        <option>Note</option>
                      </select>
                      <input
                        placeholder="Log activity..."
                        value={quickActivityNote}
                        onChange={(e) => setQuickActivityNote(e.target.value)}
                      />
                      <button type="button" onClick={addQuickActivity}>
                        Log
                      </button>
                    </div>
                    <div className="activity-timeline">
                      {profileActivities.length === 0 && (
                        <p className="empty-state">No activities yet.</p>
                      )}
                      {profileActivities.map((act) => (
                        <div className="timeline-item" key={act.id}>
                          <span
                            className={`timeline-dot dot-${act.type.toLowerCase()}`}
                          />
                          <div>
                            <strong>{act.type}</strong>
                            <span>{act.note}</span>
                            <small>
                              {new Date(act.createdAt).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )}
          </section>
        </main>
      </>
    );
  }

  // ── Main CRM Shell ────────────────────────────────────────────────────────

  const navItems: {
    page: AppPage;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      page: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    {
      page: "leads",
      label: "Lead Inbox",
      icon: <Inbox size={16} />,
      badge: urgentLeads.length || undefined,
    },
    { page: "customers", label: "Customers", icon: <Users size={16} /> },
    {
      page: "appointments",
      label: "Appointments",
      icon: <Clock size={16} />,
      badge: showroomAppointments.length || undefined,
    },
    {
      page: "finance",
      label: "Finance",
      icon: <CreditCard size={16} />,
      badge: pendingFinance || undefined,
    },
    { page: "pipeline", label: "Pipeline", icon: <TrendingUp size={16} /> },
    { page: "trades", label: "Trade-Ins", icon: <ArrowLeftRight size={16} /> },
    { page: "vin", label: "VIN Lookup", icon: <Search size={16} /> },
    { page: "activities", label: "Activities", icon: <Activity size={16} /> },
    { page: "desk", label: "Desk Tool", icon: <Calculator size={16} /> },
    { page: "service", label: "Service", icon: <Wrench size={16} /> },
  ];

  return (
    <>
      {dupMatches.length > 0 && (
        <div className="dup-backdrop" onClick={() => setDupMatches([])}>
          <div className="dup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dup-modal-header">
              <span className="dup-icon">⚠</span>
              <div>
                <h3>
                  Possible Duplicate{dupMatches.length > 1 ? "s" : ""} Found
                </h3>
                <p>
                  A customer with the same name, phone, or email already exists.
                </p>
              </div>
            </div>
            <div className="dup-list">
              {dupMatches.map((m) => (
                <div className="dup-match" key={m.id}>
                  <div className="dup-match-info">
                    <strong>
                      {m.firstName} {m.lastName}
                    </strong>
                    <span>{m.phone}</span>
                    <span className="muted">{m.email || "No email"}</span>
                    <span className={`status-badge ${statusClass(m.status)}`}>
                      {m.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cust-action-btn"
                    onClick={() => {
                      setDupMatches([]);
                      setShowAddForm(false);
                      openProfile(m);
                    }}
                  >
                    View Customer
                  </button>
                </div>
              ))}
            </div>
            <div className="dup-modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDupMatches([])}
              >
                ← Go Back &amp; Edit
              </button>
              <button
                type="button"
                className="dup-add-anyway"
                onClick={() => {
                  setDupMatches([]);
                  doSaveCustomer();
                }}
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <div className="dup-backdrop" onClick={() => setShowSettings(false)}>
          <form
            className="settings-modal"
            onSubmit={saveProfile}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-header">
              <div className="settings-avatar-preview">
                {settingsForm.avatarUrl ? (
                  <img src={settingsForm.avatarUrl} alt="Profile" />
                ) : (
                  <span>
                    {(settingsForm.name || "AS").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="eyebrow">User Settings</p>
                <h3>Edit your profile</h3>
              </div>
            </div>
            <label>
              Full Name
              <input
                value={settingsForm.name}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, name: e.target.value })
                }
                placeholder="Your name"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={settingsForm.email}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, email: e.target.value })
                }
                placeholder="you@example.com"
              />
            </label>
            <label>
              Role / Title
              <input
                value={settingsForm.role}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, role: e.target.value })
                }
                placeholder="Sales Manager"
              />
            </label>
            <label>
              Profile Picture
              <input
                type="file"
                accept="image/*"
                disabled={profileSaving}
                onChange={(e) => uploadProfilePicture(e.target.files?.[0])}
              />
            </label>
            {profilePhotoLoading && (
              <p className="panel-note">Loading profile photo…</p>
            )}
            {settingsForm.avatarUrl && (
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setSettingsForm({ ...settingsForm, avatarUrl: "" })
                }
              >
                Remove Photo
              </button>
            )}
            <label>
              Phone
              <input
                value={settingsForm.phone}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
              />
            </label>
            <div className="settings-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="dup-add-anyway"
                disabled={profileSaving || profilePhotoLoading}
              >
                {profileSaving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      )}
      {appointmentModal}
      {noteModal}
      {soldCelebration && (
        <div className="sold-celebration" aria-live="polite">
          <div className="sold-burst">
            <span>🎉</span>
            <strong>Sold!</strong>
            <p>{soldCelebration}</p>
          </div>
        </div>
      )}
      <main className={`app-shell theme-${themeMode}`}>
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">AS</div>
            <div className="brand-name">
              <strong>AutoSuite</strong>
              <span>CRM</span>
            </div>
          </div>
          <nav>
            {navItems.map((item) => (
              <a
                key={item.page}
                className={currentPage === item.page ? "active" : ""}
                href={`#/${item.page}`}
              >
                <span className="nav-item-inner">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </span>
                {item.badge ? (
                  <span className="nav-badge">{item.badge}</span>
                ) : null}
              </a>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleThemeMode}
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb" />
              </span>
              <span>{themeMode === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </button>
            <button
              type="button"
              className="user-settings-btn"
              onClick={openSettings}
            >
              <span className="mini-avatar">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" />
                ) : (
                  (currentUser?.name || "AS").slice(0, 2).toUpperCase()
                )}
              </span>
              <span>
                <strong>{currentUser?.name || "Demo User"}</strong>
                <small>{currentUser?.role || "Sales Manager"}</small>
              </span>
              <Settings size={14} />
            </button>
            <div className="sidebar-social-links">
              <a
                href="https://github.com/AveryMoyer"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/avery-moyer-44770134b"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </div>
            <button type="button" onClick={logout}>
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </aside>

        {/* ── Mobile Bottom Navigation ─────────────────────────── */}
        <div className="mobile-utility-bar">
          <button
            type="button"
            className="mobile-utility-btn mobile-theme-btn"
            onClick={toggleThemeMode}
          >
            <span>{themeMode === "dark" ? "☀" : "🌙"}</span>
            <span>{themeMode === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>
        <nav className="bottom-nav">
          {navItems.map((item) => (
            <a
              key={item.page}
              className={`bottom-nav-item${currentPage === item.page ? " active" : ""}`}
              href={`#/${item.page}`}
            >
              <span className="bottom-nav-icon">
                {item.icon}
                {item.badge ? (
                  <span className="bottom-nav-badge">{item.badge}</span>
                ) : null}
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <section className="workspace">
          {appMessage && (
            <p className="app-message" onClick={() => setAppMessage("")}>
              {appMessage} ×
            </p>
          )}

          {/* ── DASHBOARD ──────────────────────────────────────── */}
          {currentPage === "dashboard" && (
            <>
              <header className="page-header dashboard-hero">
                <div>
                  <p className="eyebrow">AutoSuite CRM</p>
                  <h1>Today's Overview</h1>
                  <p className="page-subtitle">
                    Live dealership command center for leads, follow-ups,
                    appointments, sold customers, and service equity.
                  </p>
                </div>
                <div className="header-actions">
                  <button type="button" onClick={() => navigate("leads")}>
                    + New Lead
                  </button>
                </div>
              </header>

              {/* ── KPI Row ── */}
              <div className="kpi-grid">
                <div className="kpi-card kpi-blue">
                  <span>New Leads</span>
                  <strong>{totalLeads}</strong>
                  <small>{urgentLeads.length} uncontacted</small>
                </div>
                <div className="kpi-card kpi-yellow">
                  <span>Active Opps</span>
                  <strong>{activeOpps}</strong>
                  <small>In pipeline</small>
                </div>
                <div className="kpi-card kpi-green">
                  <span>Units Sold</span>
                  <strong>{soldCount}</strong>
                  <small>Closing ratio {closingRatio}%</small>
                </div>
                <div className="kpi-card kpi-purple">
                  <span>Appt Show Rate</span>
                  <strong>{apptShowRate}%</strong>
                  <small>
                    {apptShowCount} showed / {apptSetCount + apptShowCount} set
                  </small>
                </div>
                <div className="kpi-card kpi-dark">
                  <span>Pipeline Value</span>
                  <strong>${pipelineValue.toLocaleString()}</strong>
                  <small>Lead-to-contact {leadToContact}%</small>
                </div>
              </div>

              {/* ── Conversion Funnel ── */}
              <article className="panel funnel-panel">
                <p className="eyebrow">Sales Funnel</p>
                <h2>Lead-to-Close Conversion</h2>
                <div className="funnel-stages">
                  {(
                    [
                      {
                        label: "New Lead",
                        count: totalLeads,
                        cls: "funnel-new",
                      },
                      {
                        label: "Contacted",
                        count: contactedCount,
                        cls: "funnel-contacted",
                      },
                      {
                        label: "Appt Set",
                        count: apptSetCount,
                        cls: "funnel-appt-set",
                      },
                      {
                        label: "Appt Show",
                        count: apptShowCount,
                        cls: "funnel-appt-show",
                      },
                      {
                        label: "Working",
                        count: workingCount,
                        cls: "funnel-working",
                      },
                      { label: "Sold", count: soldCount, cls: "funnel-sold" },
                      { label: "Lost", count: lostCount, cls: "funnel-lost" },
                    ] as const
                  ).map(({ label, count, cls }) => {
                    const pct = customers.length
                      ? Math.round((count / customers.length) * 100)
                      : 0;
                    return (
                      <div className="funnel-stage" key={label}>
                        <div className="funnel-bar-wrap">
                          <div
                            className={`funnel-bar ${cls}`}
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <div className="funnel-label">
                          <span
                            className={`status-badge ${statusClass(label)}`}
                          >
                            {label}
                          </span>
                          <strong>{count}</strong>
                          <small>{pct}%</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="funnel-kpi-row">
                  <div className="funnel-kpi">
                    <span>Contact Rate</span>
                    <strong>{leadToContact}%</strong>
                  </div>
                  <div className="funnel-kpi">
                    <span>Show Rate</span>
                    <strong>{apptShowRate}%</strong>
                  </div>
                  <div className="funnel-kpi">
                    <span>Closing Ratio</span>
                    <strong>{closingRatio}%</strong>
                  </div>
                  <div className="funnel-kpi">
                    <span>Deals Decided</span>
                    <strong>{decidedDeals}</strong>
                  </div>
                </div>
              </article>

              {showroomAppointments.length > 0 && (
                <article className="panel showroom-panel">
                  <div className="appointment-tab-head">
                    <div>
                      <p className="eyebrow">In Showroom</p>
                      <h2>
                        {showroomAppointments.length} customers in showroom
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("appointments")}
                    >
                      View Appointments
                    </button>
                  </div>
                  <div className="task-list">
                    {showroomAppointments.slice(0, 6).map((task) => {
                      const customer = customers.find(
                        (c) => c.id === task.customerId,
                      );
                      return (
                        <div
                          className="task-card appointment-card-full"
                          key={task.id}
                        >
                          <div>
                            <strong>{getCustomerName(task.customerId)}</strong>
                            <span>
                              {task.title} ·{" "}
                              {new Date(task.dueAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="appointment-actions">
                            <button
                              type="button"
                              onClick={() => customer && openProfile(customer)}
                            >
                              Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => updateTaskStatus(task, "Complete")}
                            >
                              Complete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              )}

              {(todayTasks.length > 0 || overdueTasks.length > 0) && (
                <article className="panel followup-panel">
                  <p className="eyebrow">Today&apos;s Work Plan</p>
                  <h2>
                    {overdueTasks.length} overdue · {todayTasks.length} due
                    today
                  </h2>
                  <div className="task-list">
                    {todayTasks.slice(0, 6).map((task) => {
                      const customer = customers.find(
                        (c) => c.id === task.customerId,
                      );
                      return (
                        <div className="task-card" key={task.id}>
                          <div>
                            <strong>{task.title}</strong>
                            <span>
                              {customer
                                ? `${customer.firstName} ${customer.lastName}`
                                : "Customer"}{" "}
                              · {task.type} · {task.priority}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => customer && openProfile(customer)}
                          >
                            Open
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </article>
              )}

              {(appointmentTasks.length > 0 || crmAlerts.length > 0) && (
                <div className="dash-grid" style={{ marginTop: 18 }}>
                  <article className="panel appointment-panel">
                    <p className="eyebrow">Appointment Calendar</p>
                    <h2>Upcoming appointments</h2>
                    <div className="appointment-list">
                      {appointmentTasks.length === 0 && (
                        <p className="empty-state">
                          No appointments scheduled.
                        </p>
                      )}
                      {appointmentTasks.map((task) => {
                        const customer = customers.find(
                          (c) => c.id === task.customerId,
                        );
                        return (
                          <button
                            type="button"
                            className="appointment-card"
                            key={task.id}
                            onClick={() => customer && openProfile(customer)}
                          >
                            <span>
                              {new Date(task.dueAt).toLocaleDateString()}
                            </span>
                            <strong>
                              {new Date(task.dueAt).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </strong>
                            <small>
                              {customer
                                ? `${customer.firstName} ${customer.lastName}`
                                : "Customer"}{" "}
                              · {task.title}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  </article>

                  <article className="panel alerts-panel">
                    <p className="eyebrow">Notification Center</p>
                    <h2>Needs attention</h2>
                    <div className="alert-list">
                      {crmAlerts.length === 0 && (
                        <p className="empty-state">No alerts right now. 🎉</p>
                      )}
                      {crmAlerts.map((alert) => {
                        const customer = customers.find(
                          (c) => c.id === alert.customerId,
                        );
                        return (
                          <button
                            type="button"
                            className={`alert-card alert-${alert.tone}`}
                            key={alert.id}
                            onClick={() => customer && openProfile(customer)}
                          >
                            <strong>{alert.title}</strong>
                            <span>{alert.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                </div>
              )}

              {/* ── Active Leads + Re-engagement row ── */}
              {(activeLeads.length > 0 ||
                stalledLeads.length > 0 ||
                soldReengagementTargets.length > 0 ||
                serviceEquityTargets.length > 0) && (
                <div className="dash-grid" style={{ marginTop: 18 }}>
                  {activeLeads.length > 0 && (
                    <article className="panel">
                      <p className="eyebrow">Active Leads</p>
                      <h2>Working opportunities</h2>
                      <div className="lead-list">
                        {activeLeads.slice(0, 5).map((c) => (
                          <div className="lead-card" key={c.id}>
                            <div>
                              <strong
                                className="profile-link-name"
                                onClick={() => openProfile(c)}
                              >
                                {c.firstName} {c.lastName}
                              </strong>
                              <span>{c.interestedVehicle}</span>
                              <small>
                                {c.status} · {c.assignedTo || "Unassigned"}
                              </small>
                            </div>
                            <button
                              type="button"
                              className="open-btn"
                              onClick={() => openProfile(c)}
                            >
                              Open
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
                  )}
                  {stalledLeads.length > 0 && (
                    <article className="panel">
                      <p className="eyebrow stalled-eye">Stalled Deals</p>
                      <h2>No activity in 3+ days</h2>
                      <div className="lead-list">
                        {stalledLeads.map((c) => (
                          <div className="lead-card stalled-card" key={c.id}>
                            <div>
                              <strong
                                className="profile-link-name"
                                onClick={() => openProfile(c)}
                              >
                                {c.firstName} {c.lastName}
                              </strong>
                              <span>{c.interestedVehicle}</span>
                              <small>
                                <span
                                  className={`status-badge ${statusClass(c.status)}`}
                                >
                                  {c.status}
                                </span>
                                {" · "}
                                {c.assignedTo || "Unassigned"}
                              </small>
                            </div>
                            <div className="stalled-actions">
                              <button
                                type="button"
                                className="open-btn"
                                onClick={() => openProfile(c)}
                              >
                                Profile
                              </button>
                              <button
                                type="button"
                                className="sold-btn"
                                onClick={() => markCustomerSold(c)}
                              >
                                Mark Sold
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  )}
                  {soldReengagementTargets.length > 0 && (
                    <article className="panel">
                      <p className="eyebrow equity-eye">Sold Re-engagement</p>
                      <h2>Past buyers</h2>
                      <p className="panel-note">
                        Sold customers — repeat purchase and referral follow-up
                      </p>
                      <div className="lead-list">
                        {soldReengagementTargets.map((c) => (
                          <div className="lead-card equity-card" key={c.id}>
                            <div>
                              <strong
                                className="profile-link-name"
                                onClick={() => openProfile(c)}
                              >
                                {c.firstName} {c.lastName}
                              </strong>
                              <span>{c.interestedVehicle}</span>
                              <small>
                                Purchased · Rep: {c.assignedTo || "—"}
                              </small>
                            </div>
                            <div className="stalled-actions">
                              <button
                                type="button"
                                className="open-btn"
                                onClick={() => openProfile(c)}
                              >
                                Re-engage
                              </button>
                              <button
                                type="button"
                                className="unsold-btn"
                                onClick={() => markCustomerUnsold(c)}
                              >
                                Mark Unsold
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  )}
                  {serviceEquityTargets.length > 0 && (
                    <article className="panel">
                      <p className="eyebrow service-equity-eye">
                        Service Equity
                      </p>
                      <h2>Equity Mining</h2>
                      <p className="panel-note">
                        Service customers with likely positive trade equity
                      </p>
                      <div className="lead-list">
                        {serviceEquityTargets.map(
                          ({ customer, ro, estimatedValue, equityScore }) => (
                            <div
                              className="lead-card service-equity-card"
                              key={customer.id}
                            >
                              <div>
                                <strong
                                  className="profile-link-name"
                                  onClick={() => openProfile(customer)}
                                >
                                  {customer.firstName} {customer.lastName}
                                </strong>
                                <span>
                                  {ro.vehicleYear} {ro.vehicleMake}{" "}
                                  {ro.vehicleModel}
                                </span>
                                <small>
                                  Est. ${estimatedValue.toLocaleString()} ·
                                  Equity signal ${equityScore.toLocaleString()}
                                </small>
                              </div>
                              <button
                                type="button"
                                className="open-btn"
                                onClick={() => openProfile(customer)}
                              >
                                Work Equity
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    </article>
                  )}
                </div>
              )}

              <div className="dash-grid">
                <article className="panel">
                  <p className="eyebrow">Leads by Source</p>
                  <h2>Where buyers come from</h2>
                  <div className="report-table">
                    {leadsBySource.map(([src, count]) => (
                      <div className="report-row" key={src}>
                        <span>{src}</span>
                        <div className="report-bar-wrap">
                          <div
                            className="report-bar"
                            style={{
                              width: `${Math.round((count / customers.length) * 100)}%`,
                            }}
                          />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <p className="eyebrow">Deal Pipeline</p>
                  <h2>Working → Delivered</h2>
                  <div className="pipeline-board">
                    {pipelineStages.map((col) => (
                      <div className="pipeline-column" key={col.stage}>
                        <div className="pipeline-col-header">
                          <strong>{col.stage}</strong>
                          <small>${col.value.toLocaleString()}</small>
                        </div>
                        {col.sales.map((sale) => (
                          <button
                            type="button"
                            key={sale.id}
                            className="pipeline-card"
                            onClick={() => {
                              const c = customers.find(
                                (x) => x.id === sale.customerId,
                              );
                              if (c) openProfile(c);
                            }}
                          >
                            <span>
                              {sale.year} {sale.make} {sale.model}
                            </span>
                            <small>{getCustomerName(sale.customerId)}</small>
                          </button>
                        ))}
                        {col.sales.length === 0 && (
                          <small className="empty-col">No deals</small>
                        )}
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <p className="eyebrow">Uncontacted Leads</p>
                  <h2>Need immediate response</h2>
                  <div className="lead-list">
                    {urgentLeads.length === 0 && (
                      <p className="empty-state">
                        All leads have been contacted. ✓
                      </p>
                    )}
                    {urgentLeads.slice(0, 5).map((c) => (
                      <div className="lead-card urgent-card" key={c.id}>
                        <div>
                          <strong>
                            {c.firstName} {c.lastName}
                          </strong>
                          <span>{c.interestedVehicle}</span>
                          <span className="source-tag">
                            {c.source || "Unknown source"}
                          </span>
                        </div>
                        <button type="button" onClick={() => openProfile(c)}>
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <p className="eyebrow">Active Appointments</p>
                  <h2>Scheduled visits</h2>
                  <div className="lead-list">
                    {customers.filter(
                      (c) =>
                        c.status === "Appt Set" || c.status === "Appt Show",
                    ).length === 0 && (
                      <p className="empty-state">No appointments scheduled.</p>
                    )}
                    {customers
                      .filter(
                        (c) =>
                          c.status === "Appt Set" || c.status === "Appt Show",
                      )
                      .map((c) => (
                        <div className="lead-card" key={c.id}>
                          <div>
                            <strong>
                              {c.firstName} {c.lastName}
                            </strong>
                            <span>{c.interestedVehicle}</span>
                            <small>
                              Rep: {c.assignedTo || "Unassigned"} ·{" "}
                              {c.nextFollowUp || "No time set"}
                            </small>
                          </div>
                          <button type="button" onClick={() => openProfile(c)}>
                            View
                          </button>
                        </div>
                      ))}
                  </div>
                </article>
              </div>

              {/* My Day / Work Plan */}
              <article className="panel" style={{ marginTop: 18 }}>
                <p className="eyebrow">My Day — Work Plan</p>
                <h2>Priority follow-ups right now</h2>
                <div className="my-day-grid">
                  <div className="my-day-col">
                    <p className="my-day-label urgent">
                      🔴 Uncontacted — Act Now
                    </p>
                    {urgentLeads.length === 0 ? (
                      <p className="empty-state">No uncontacted leads. 🎉</p>
                    ) : (
                      urgentLeads.slice(0, 4).map((c) => (
                        <div className="my-day-card" key={c.id}>
                          <div>
                            <strong>
                              {c.firstName} {c.lastName}
                            </strong>
                            <span>{c.interestedVehicle}</span>
                            <small>
                              {c.source || "Unknown source"} ·{" "}
                              {c.assignedTo
                                ? `Rep: ${c.assignedTo}`
                                : "Unassigned"}
                            </small>
                          </div>
                          <div className="my-day-btns">
                            <button
                              type="button"
                              onClick={() => openProfile(c)}
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="my-day-col">
                    <p className="my-day-label appt">🟡 Appointments Today</p>
                    {customers.filter(
                      (c) =>
                        c.status === "Appt Set" || c.status === "Appt Show",
                    ).length === 0 ? (
                      <p className="empty-state">No appointments scheduled.</p>
                    ) : (
                      customers
                        .filter(
                          (c) =>
                            c.status === "Appt Set" || c.status === "Appt Show",
                        )
                        .slice(0, 4)
                        .map((c) => (
                          <div className="my-day-card" key={c.id}>
                            <div>
                              <strong>
                                {c.firstName} {c.lastName}
                              </strong>
                              <span>{c.interestedVehicle}</span>
                              <small>
                                Rep: {c.assignedTo || "Unassigned"} ·{" "}
                                {c.nextFollowUp || "Time TBD"}
                              </small>
                            </div>
                            <button
                              type="button"
                              onClick={() => openProfile(c)}
                            >
                              View
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                  <div className="my-day-col">
                    <p className="my-day-label finance">
                      🟢 Finance Awaiting Decision
                    </p>
                    {financeApplications.filter((a) => a.status === "Submitted")
                      .length === 0 ? (
                      <p className="empty-state">No pending finance apps.</p>
                    ) : (
                      financeApplications
                        .filter((a) => a.status === "Submitted")
                        .slice(0, 4)
                        .map((a) => (
                          <div className="my-day-card" key={a.id}>
                            <div>
                              <strong>
                                {a.applicantName ||
                                  getCustomerName(a.customerId)}
                              </strong>
                              <span>{a.requestedVehicle || "Vehicle TBD"}</span>
                              <small>
                                ${a.downPayment.toLocaleString()} down ·{" "}
                                {a.creditRange}
                              </small>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const c = customers.find(
                                  (x) => x.id === a.customerId,
                                );
                                if (c) openProfile(c);
                              }}
                            >
                              View
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </article>
            </>
          )}

          {/* ── LEADS INBOX ──────────────────────────────────────── */}
          {currentPage === "leads" && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">Lead Inbox</p>
                  <h1>Internet & Phone Leads</h1>
                  <p className="page-subtitle">
                    New leads from web forms, third-party providers, phone
                    calls, and walk-ins. Assign and work each lead before they
                    go cold.
                  </p>
                </div>
                <div className="header-actions">
                  <button type="button" onClick={() => navigate("customers")}>
                    + Add Lead Manually
                  </button>
                </div>
              </header>
              <div className="filter-bar">
                <span className="filter-label">Filter:</span>
                {["All", "Lead", "Appointment"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={
                      customerStatusFilter === s
                        ? "filter-pill active"
                        : "filter-pill"
                    }
                    onClick={() => setCustomerStatusFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="lead-inbox">
                {internetLeads.length === 0 && (
                  <p className="empty-state large">
                    No incoming leads. Add customers with a web/internet source
                    to see them here.
                  </p>
                )}
                {internetLeads.map((c) => (
                  <div className="inbox-card" key={c.id}>
                    <div className="inbox-card-top">
                      <div className="inbox-name-row">
                        <strong>
                          {c.firstName} {c.lastName}
                        </strong>
                        <span
                          className={`status-badge ${statusClass(c.status)}`}
                        >
                          {c.status}
                        </span>
                        {c.temperature && (
                          <span
                            className={`temp-badge ${tempClass(c.temperature)}`}
                          >
                            {c.temperature}
                          </span>
                        )}
                        {!activities.some((a) => a.customerId === c.id) && (
                          <span className="badge-urgent">No contact yet</span>
                        )}
                      </div>
                      <div className="inbox-card-meta">
                        <span className="source-tag">
                          {c.source || "Unknown source"}
                        </span>
                        {c.createdAt && (
                          <span
                            className={`speed-to-lead ${Date.now() - new Date(c.createdAt).getTime() < 1000 * 60 * 60 ? "speed-hot" : Date.now() - new Date(c.createdAt).getTime() < 1000 * 60 * 60 * 24 ? "speed-warm" : "speed-cold"}`}
                          >
                            ⏱ {timeAgo(c.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="inbox-card-mid">
                      <span>📞 {c.phone}</span>
                      <span>✉ {c.email || "No email"}</span>
                      <span>🚗 {c.interestedVehicle}</span>
                    </div>
                    <div className="inbox-card-actions">
                      <span className="assign-label">Assign to:</span>
                      {["Avery", "Mike", "Sarah", "Dan"].map((rep) => (
                        <button
                          key={rep}
                          type="button"
                          className={
                            c.assignedTo === rep ? "rep-btn active" : "rep-btn"
                          }
                          onClick={() => assignLead(c, rep)}
                        >
                          {rep}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="open-btn"
                        onClick={() => openProfile(c)}
                      >
                        Open Deal Jacket →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── CUSTOMERS ────────────────────────────────────────── */}
          {currentPage === "customers" && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">Customer Database</p>
                  <h1>All Customers</h1>
                </div>
                <div className="header-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm((v) => !v);
                      if (editingCustomerId) resetCustomerForm();
                    }}
                  >
                    {showAddForm || editingCustomerId
                      ? "✕ Close Form"
                      : "+ Add Customer"}
                  </button>
                </div>
              </header>

              {/* Add / Edit Form — collapsible */}
              {(showAddForm || editingCustomerId) && (
                <article className="panel" style={{ marginBottom: 14 }}>
                  <div className="panel-header">
                    <p className="eyebrow">
                      {editingCustomerId
                        ? "Editing Customer"
                        : "Add New Customer / Lead"}
                    </p>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        resetCustomerForm();
                        setShowAddForm(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  <form className="contact-form" onSubmit={saveCustomer}>
                    <input
                      placeholder="First name *"
                      value={customerForm.firstName}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          firstName: e.target.value,
                        })
                      }
                      required
                    />
                    <input
                      placeholder="Last name"
                      value={customerForm.lastName}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          lastName: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Phone"
                      value={customerForm.phone}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          phone: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Email"
                      value={customerForm.email}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          email: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Vehicle of interest"
                      value={customerForm.interestedVehicle}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          interestedVehicle: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Lead source"
                      value={customerForm.source}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          source: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Assigned rep"
                      value={customerForm.assignedTo}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          assignedTo: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Address (123 Main St, City, ST 12345)"
                      value={customerForm.address}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          address: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Next follow-up"
                      value={customerForm.nextFollowUp}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          nextFollowUp: e.target.value,
                        })
                      }
                    />
                    <select
                      value={customerForm.status}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          status: e.target.value as Customer["status"],
                        })
                      }
                    >
                      <option>New Lead</option>
                      <option>Contacted</option>
                      <option>Appt Set</option>
                      <option>Appt Show</option>
                      <option>Working</option>
                      <option>Sold</option>
                      <option>Lost</option>
                    </select>
                    <button type="submit">
                      {editingCustomerId ? "Save Changes" : "Add Customer"}
                    </button>
                  </form>
                </article>
              )}

              {/* Search + filter toolbar */}
              <div className="cust-toolbar">
                <div className="cust-search-wrap">
                  <input
                    className="cust-search"
                    placeholder="Name, phone, or email — press Enter or click Search"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        doCustomerSearch();
                      }
                      if (e.key === "Escape") {
                        setCustomerSearch("");
                        setActiveSearch("");
                        setCustPage(0);
                      }
                    }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      title="Clear search"
                      onClick={() => {
                        setCustomerSearch("");
                        setActiveSearch("");
                        setCustPage(0);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="search-go-btn"
                  onClick={doCustomerSearch}
                >
                  Search
                </button>
                <select
                  className="filter-select"
                  value={customerStatusFilter}
                  onChange={(e) => {
                    setCustomerStatusFilter(e.target.value);
                    setCustPage(0);
                  }}
                >
                  <option value="All">All statuses</option>
                  <option>New Lead</option>
                  <option>Contacted</option>
                  <option>Appt Set</option>
                  <option>Appt Show</option>
                  <option>Working</option>
                  <option>Sold</option>
                  <option>Lost</option>
                </select>
                <select
                  className="filter-select"
                  value={customerSourceFilter}
                  onChange={(e) => {
                    setCustomerSourceFilter(e.target.value);
                    setCustPage(0);
                  }}
                >
                  <option value="All">All sources</option>
                  <option>Cars.com</option>
                  <option>AutoTrader</option>
                  <option>Website Lead</option>
                  <option>Walk-in</option>
                  <option>Referral</option>
                  <option>Phone Call</option>
                </select>
                <div className="cust-toolbar-right">
                  {activeSearch && (
                    <span className="active-search-badge">
                      "{activeSearch}"
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearch("");
                          setActiveSearch("");
                          setCustPage(0);
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  <span className="result-count">
                    {filteredCustomers.length.toLocaleString()} of{" "}
                    {customers.length.toLocaleString()}
                  </span>
                  <select
                    className="filter-select"
                    value={custPageSize}
                    onChange={(e) => {
                      setCustPageSize(Number(e.target.value));
                      setCustPage(0);
                    }}
                  >
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                    <option value={250}>250 / page</option>
                  </select>
                </div>
              </div>

              {/* Data table */}
              <div className="cust-table-wrap">
                <table className="cust-table">
                  <thead>
                    <tr>
                      <th
                        className="sortable"
                        onClick={() => toggleCustomerSort("name")}
                      >
                        Name {custSortIcon("name")}
                      </th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th
                        className="sortable"
                        onClick={() => toggleCustomerSort("vehicle")}
                      >
                        Vehicle {custSortIcon("vehicle")}
                      </th>
                      <th
                        className="sortable"
                        onClick={() => toggleCustomerSort("status")}
                      >
                        Status {custSortIcon("status")}
                      </th>
                      <th>Source</th>
                      <th
                        className="sortable"
                        onClick={() => toggleCustomerSort("rep")}
                      >
                        Rep {custSortIcon("rep")}
                      </th>
                      <th
                        className="sortable"
                        onClick={() => toggleCustomerSort("created")}
                      >
                        Added {custSortIcon("created")}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custPageSlice.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="empty-state"
                          style={{ textAlign: "center", padding: 32 }}
                        >
                          No customers match your filters.
                        </td>
                      </tr>
                    )}
                    {custPageSlice.map((c) => (
                      <tr
                        key={c.id}
                        className="cust-tr"
                        onClick={() => openProfile(c)}
                      >
                        <td className="cust-name-cell">
                          <strong>
                            {c.firstName} {c.lastName}
                          </strong>
                          {c.temperature && (
                            <span
                              className={`temp-badge ${tempClass(c.temperature)}`}
                            >
                              {c.temperature}
                            </span>
                          )}
                        </td>
                        <td className="cust-phone">{c.phone}</td>
                        <td className="cust-email">
                          {c.email || <span className="muted">—</span>}
                        </td>
                        <td className="cust-vehicle">
                          {c.interestedVehicle || (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <span
                            className={`status-badge ${statusClass(c.status)}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="muted">{c.source || "—"}</td>
                        <td className="muted">
                          {c.assignedTo || (
                            <span className="unassigned">Unassigned</span>
                          )}
                        </td>
                        <td className="muted">
                          {c.createdAt ? timeAgo(c.createdAt) : "—"}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="cust-actions">
                            <button
                              type="button"
                              className="cust-action-btn"
                              title="Open Deal Jacket"
                              onClick={() => openProfile(c)}
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              className="cust-action-btn ghost"
                              title="Edit"
                              onClick={() => {
                                editCustomer(c);
                                setShowAddForm(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="cust-action-btn danger"
                              title="Delete"
                              onClick={() => deleteCustomer(c.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {custTotalPages > 1 && (
                <div className="cust-pagination">
                  <button
                    type="button"
                    className="page-btn"
                    disabled={custSafePage === 0}
                    onClick={() => setCustPage(0)}
                  >
                    «
                  </button>
                  <button
                    type="button"
                    className="page-btn"
                    disabled={custSafePage === 0}
                    onClick={() => setCustPage(custSafePage - 1)}
                  >
                    ‹ Prev
                  </button>
                  {Array.from(
                    { length: Math.min(custTotalPages, 7) },
                    (_, i) => {
                      const start = Math.max(
                        0,
                        Math.min(custSafePage - 3, custTotalPages - 7),
                      );
                      const p = start + i;
                      return (
                        <button
                          key={p}
                          type="button"
                          className={`page-btn${p === custSafePage ? " active" : ""}`}
                          onClick={() => setCustPage(p)}
                        >
                          {p + 1}
                        </button>
                      );
                    },
                  )}
                  <button
                    type="button"
                    className="page-btn"
                    disabled={custSafePage === custTotalPages - 1}
                    onClick={() => setCustPage(custSafePage + 1)}
                  >
                    Next ›
                  </button>
                  <button
                    type="button"
                    className="page-btn"
                    disabled={custSafePage === custTotalPages - 1}
                    onClick={() => setCustPage(custTotalPages - 1)}
                  >
                    »
                  </button>
                  <span className="page-info">
                    Page {custSafePage + 1} of {custTotalPages} ·{" "}
                    {filteredCustomers.length.toLocaleString()} records
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── APPOINTMENTS ─────────────────────────────────────── */}
          {currentPage === "appointments" && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">Appointments</p>
                  <h1>Appointment Desk</h1>
                  <p className="page-subtitle">
                    View, edit, mark showroom, and complete every appointment.
                  </p>
                </div>
              </header>

              <article className="panel task-list appointment-tab-list">
                <div className="appointment-tab-head">
                  <div>
                    <p className="card-label">All Appointments</p>
                    <h3>{allAppointmentTasks.length} total appointments</h3>
                  </div>
                </div>
                {allAppointmentTasks.length === 0 && (
                  <p className="empty-state">No appointments scheduled.</p>
                )}
                {allAppointmentTasks.map((task) => (
                  <div
                    className={`task-card appointment-card-full ${task.status === "Complete" ? "done" : ""}`}
                    key={task.id}
                  >
                    <div>
                      <strong>{task.title}</strong>
                      <span>
                        {getCustomerName(task.customerId)} · {task.priority} ·{" "}
                        {task.status} · {new Date(task.dueAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="appointment-actions">
                      <button
                        type="button"
                        onClick={() =>
                          openProfile(
                            customers.find((c) => c.id === task.customerId) ||
                              customers[0],
                          )
                        }
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => openAppointmentModal(task)}
                      >
                        Edit
                      </button>
                      {task.status !== "Showroom" &&
                        task.status !== "Complete" && (
                          <button
                            type="button"
                            onClick={() => updateTaskStatus(task, "Showroom")}
                          >
                            In Showroom
                          </button>
                        )}
                      {task.status !== "Complete" && (
                        <button
                          type="button"
                          onClick={() => updateTaskStatus(task, "Complete")}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </article>
            </>
          )}

          {/* ── FINANCE ──────────────────────────────────────────── */}
          {currentPage === "finance" && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">F&I Manager</p>
                  <h1>Finance Applications</h1>
                  <p className="page-subtitle">
                    Review and update status on all finance and credit
                    applications across every deal. Open a customer deal jacket
                    to submit a new one.
                  </p>
                </div>
              </header>
              <div
                className="kpi-grid"
                style={{
                  gridTemplateColumns: "repeat(3,1fr)",
                  marginBottom: 18,
                }}
              >
                <div className="kpi-card kpi-blue">
                  <span>Total Apps</span>
                  <strong>{financeApplications.length}</strong>
                </div>
                <div className="kpi-card kpi-yellow">
                  <span>Pending</span>
                  <strong>{pendingFinance}</strong>
                </div>
                <div className="kpi-card kpi-green">
                  <span>Approved</span>
                  <strong>
                    {
                      financeApplications.filter((a) => a.status === "Approved")
                        .length
                    }
                  </strong>
                </div>
              </div>
              <div className="deal-list">
                {financeApplications.length === 0 && (
                  <p className="empty-state">
                    No finance applications yet. Open a customer deal jacket to
                    submit one.
                  </p>
                )}
                {financeApplications.map((app) => (
                  <div
                    className="deal-card clickable"
                    key={app.id}
                    onClick={() => {
                      const c = customers.find((x) => x.id === app.customerId);
                      if (c) openProfile(c);
                    }}
                  >
                    <div className="deal-card-main">
                      <strong>
                        {app.applicantName || getCustomerName(app.customerId)}
                      </strong>
                      <span>
                        {app.requestedVehicle ||
                          getCustomerName(app.customerId)}
                      </span>
                      <span>
                        ${app.monthlyIncome.toLocaleString()}/mo · $
                        {app.downPayment.toLocaleString()} down ·{" "}
                        {app.creditRange}
                      </span>
                      {app.lender && <small>Lender: {app.lender}</small>}
                    </div>
                    <select
                      value={app.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        updateFinanceStatus(
                          app.id,
                          e.target.value as FinanceApplication["status"],
                        )
                      }
                    >
                      <option>New</option>
                      <option>Submitted</option>
                      <option>Approved</option>
                      <option>Needs Review</option>
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── PIPELINE ─────────────────────────────────────────── */}
          {currentPage === "pipeline" && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">Sales Pipeline</p>
                  <h1>Deals by Stage</h1>
                  <p className="page-subtitle">
                    Track every active deal from initial desk to delivery. Click
                    any deal card to open the customer's deal jacket.
                  </p>
                </div>
              </header>
              <div className="pipeline-full">
                {pipelineStages.map((col) => (
                  <div className="pipeline-col-full" key={col.stage}>
                    <div className="pipeline-col-header">
                      <strong>{col.stage}</strong>
                      <span>
                        {col.sales.length} deal
                        {col.sales.length !== 1 ? "s" : ""} · $
                        {col.value.toLocaleString()}
                      </span>
                    </div>
                    {col.sales.length === 0 && (
                      <p className="empty-state">No deals in this stage.</p>
                    )}
                    {col.sales.map((sale) => (
                      <div
                        className="pipeline-card-full"
                        key={sale.id}
                        onClick={() => {
                          const c = customers.find(
                            (x) => x.id === sale.customerId,
                          );
                          if (c) openProfile(c);
                        }}
                      >
                        <strong>
                          {sale.year} {sale.make} {sale.model}
                        </strong>
                        <span>Stock #{sale.stockNumber}</span>
                        <span>${sale.salePrice.toLocaleString()}</span>
                        <small>{getCustomerName(sale.customerId)}</small>
                        <select
                          value={sale.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateSaleStage(
                              sale.id,
                              e.target.value as VehicleSale["stage"],
                            )
                          }
                        >
                          <option>Working</option>
                          <option>Finance</option>
                          <option>Delivered</option>
                          <option>Lost</option>
                        </select>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Desk / Payment Calculator */}
              <article className="panel" style={{ marginTop: 24 }}>
                <p className="eyebrow">Deal Desk</p>
                <h2>Payment Calculator</h2>
                <div className="desk-calc-grid">
                  <div className="desk-input-group">
                    <label>Sale Price ($)</label>
                    <input
                      placeholder="e.g. 38995"
                      value={deskCalc.salePrice}
                      onChange={(e) =>
                        setDeskCalc({ ...deskCalc, salePrice: e.target.value })
                      }
                    />
                  </div>
                  <div className="desk-input-group">
                    <label>Trade ACV ($)</label>
                    <input
                      placeholder="e.g. 12000"
                      value={deskCalc.tradeACV}
                      onChange={(e) =>
                        setDeskCalc({ ...deskCalc, tradeACV: e.target.value })
                      }
                    />
                  </div>
                  <div className="desk-input-group">
                    <label>Trade Payoff ($)</label>
                    <input
                      placeholder="e.g. 8000"
                      value={deskCalc.tradePayoff}
                      onChange={(e) =>
                        setDeskCalc({
                          ...deskCalc,
                          tradePayoff: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="desk-input-group">
                    <label>Down Payment ($)</label>
                    <input
                      placeholder="e.g. 3000"
                      value={deskCalc.downPayment}
                      onChange={(e) =>
                        setDeskCalc({
                          ...deskCalc,
                          downPayment: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="desk-input-group">
                    <label>APR (%)</label>
                    <input
                      value={deskCalc.apr}
                      onChange={(e) =>
                        setDeskCalc({ ...deskCalc, apr: e.target.value })
                      }
                    />
                  </div>
                  <div className="desk-input-group">
                    <label>Term (months)</label>
                    <select
                      value={deskCalc.termMonths}
                      onChange={(e) =>
                        setDeskCalc({ ...deskCalc, termMonths: e.target.value })
                      }
                    >
                      <option>24</option>
                      <option>36</option>
                      <option>48</option>
                      <option>60</option>
                      <option>72</option>
                      <option>84</option>
                    </select>
                  </div>
                  <div className="desk-input-group">
                    <label>Tax Rate (%)</label>
                    <input
                      value={deskCalc.taxRate}
                      onChange={(e) =>
                        setDeskCalc({ ...deskCalc, taxRate: e.target.value })
                      }
                    />
                  </div>
                </div>
                {deskPayment.monthly > 0 && (
                  <div className="desk-result">
                    <div className="desk-result-main">
                      <span>Est. Monthly Payment</span>
                      <strong>${deskPayment.monthly.toFixed(2)}/mo</strong>
                    </div>
                    <div className="desk-result-breakdown">
                      <span>
                        Amount Financed:{" "}
                        <b>
                          $
                          {deskPayment.amount.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </b>
                      </span>
                      <span>
                        Trade Equity:{" "}
                        <b
                          className={
                            deskPayment.tradeEquity >= 0
                              ? "kpi-green-text"
                              : "badge-danger"
                          }
                        >
                          $
                          {deskPayment.tradeEquity.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </b>
                      </span>
                      <span>
                        Est. Tax:{" "}
                        <b>
                          $
                          {deskPayment.taxed.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </b>
                      </span>
                    </div>
                  </div>
                )}
              </article>

              <article className="panel" style={{ marginTop: 24 }}>
                <p className="eyebrow">Add Vehicle to Pipeline</p>
                <form className="contact-form" onSubmit={addVehicleSale}>
                  <select
                    value={saleForm.customerId}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, customerId: e.target.value })
                    }
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Stock #"
                    value={saleForm.stockNumber}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, stockNumber: e.target.value })
                    }
                  />
                  <input
                    placeholder="Year"
                    value={saleForm.year}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, year: e.target.value })
                    }
                  />
                  <input
                    placeholder="Make"
                    value={saleForm.make}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, make: e.target.value })
                    }
                  />
                  <input
                    placeholder="Model"
                    value={saleForm.model}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, model: e.target.value })
                    }
                  />
                  <input
                    placeholder="Sale price ($)"
                    value={saleForm.salePrice}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, salePrice: e.target.value })
                    }
                  />
                  <select
                    value={saleForm.stage}
                    onChange={(e) =>
                      setSaleForm({
                        ...saleForm,
                        stage: e.target.value as VehicleSale["stage"],
                      })
                    }
                  >
                    <option>Working</option>
                    <option>Finance</option>
                    <option>Delivered</option>
                    <option>Lost</option>
                  </select>
                  <button type="submit">Add to Pipeline</button>
                </form>
              </article>
            </>
          )}

          {/* ── TRADES ───────────────────────────────────────────── */}
          {currentPage === "trades" && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">Trade-In Manager</p>
                  <h1>Vehicle Appraisals</h1>
                </div>
              </header>
              <article className="panel" style={{ marginBottom: 18 }}>
                <p className="eyebrow">Add Trade-In</p>
                <form className="contact-form" onSubmit={addTradeIn}>
                  <select
                    value={tradeForm.customerId}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, customerId: e.target.value })
                    }
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      placeholder="VIN (17 chars) — auto-fills year/make/model + ACV"
                      value={tradeForm.vin}
                      maxLength={17}
                      style={{
                        fontFamily: "monospace",
                        letterSpacing: 1,
                        flex: 1,
                      }}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        setTradeForm({ ...tradeForm, vin: v });
                        if (v.length === 17) lookupTradeVin(v);
                      }}
                    />
                    {tradeVinLoading && (
                      <span className="muted" style={{ whiteSpace: "nowrap" }}>
                        Decoding…
                      </span>
                    )}
                  </div>
                  <input
                    placeholder="Year"
                    value={tradeForm.year}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, year: e.target.value })
                    }
                  />
                  <input
                    placeholder="Make"
                    value={tradeForm.make}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, make: e.target.value })
                    }
                  />
                  <input
                    placeholder="Model"
                    value={tradeForm.model}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, model: e.target.value })
                    }
                  />
                  <input
                    placeholder="Mileage"
                    value={tradeForm.mileage}
                    onChange={(e) => {
                      setTradeForm({ ...tradeForm, mileage: e.target.value });
                      if (tradeForm.year && tradeForm.make && tradeForm.model) {
                        const bv = estimateBookValue(
                          tradeForm.year,
                          tradeForm.make,
                          tradeForm.model,
                          parseInt(e.target.value) || undefined,
                        );
                        setTradeBookValue(bv);
                        setTradeForm((f) => ({
                          ...f,
                          mileage: e.target.value,
                          estimatedValue: String(bv.avg),
                        }));
                      }
                    }}
                  />
                  <input
                    placeholder="Payoff amount ($)"
                    value={tradeForm.payoff}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, payoff: e.target.value })
                    }
                  />
                  <input
                    placeholder="Estimated ACV ($)"
                    value={tradeForm.estimatedValue}
                    onChange={(e) =>
                      setTradeForm({
                        ...tradeForm,
                        estimatedValue: e.target.value,
                      })
                    }
                  />
                  {tradeBookValue && tradeBookValue.avg > 0 && (
                    <div
                      className="book-value-panel"
                      style={{ margin: "4px 0" }}
                    >
                      <div className="bv-header">
                        <span className="bv-title">📊 Estimated ACV Range</span>
                        <span className="bv-age">
                          {tradeBookValue.ageYears} yr · {tradeBookValue.state}
                        </span>
                      </div>
                      <div className="bv-range">
                        <div className="bv-col low">
                          <span>Low</span>
                          <strong>
                            ${tradeBookValue.low.toLocaleString()}
                          </strong>
                        </div>
                        <div className="bv-col avg">
                          <span>Avg ACV</span>
                          <strong>
                            ${tradeBookValue.avg.toLocaleString()}
                          </strong>
                        </div>
                        <div className="bv-col high">
                          <span>Retail</span>
                          <strong>
                            ${tradeBookValue.high.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    placeholder="Notes (optional)"
                    value={tradeForm.notes}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, notes: e.target.value })
                    }
                  />
                  <button type="submit">Add Trade</button>
                </form>
              </article>
              <div className="trade-appraisal-grid">
                {tradeIns.length === 0 && (
                  <p className="empty-state large">
                    No trade-ins recorded yet.
                  </p>
                )}
                {tradeIns.map((t) => {
                  const equity = t.estimatedValue - t.payoff;
                  const equityPositive = equity >= 0;
                  return (
                    <article className="trade-appraisal-card" key={t.id}>
                      <div className="trade-card-top">
                        <div className="trade-vehicle-icon">
                          {t.make.slice(0, 1)}
                        </div>
                        <div>
                          <p className="eyebrow">Vehicle Appraisal</p>
                          <h3>
                            {t.year} {t.make} {t.model}
                          </h3>
                          <span>{t.mileage.toLocaleString()} miles</span>
                        </div>
                      </div>
                      <div className="trade-owner-row">
                        <span>Customer</span>
                        <button
                          type="button"
                          onClick={() => {
                            const customer = customers.find(
                              (item) => item.id === t.customerId,
                            );
                            if (customer) openProfile(customer);
                          }}
                        >
                          {getCustomerName(t.customerId)}
                        </button>
                      </div>
                      <div className="trade-value-grid">
                        <div>
                          <span>ACV</span>
                          <strong>${t.estimatedValue.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span>Payoff</span>
                          <strong>${t.payoff.toLocaleString()}</strong>
                        </div>
                        <div
                          className={
                            equityPositive
                              ? "trade-equity-positive"
                              : "trade-equity-negative"
                          }
                        >
                          <span>Equity</span>
                          <strong>${equity.toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="trade-equity-meter">
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(8, (Math.abs(equity) / Math.max(t.estimatedValue, 1)) * 100))}%`,
                          }}
                        />
                      </div>
                      {t.notes && (
                        <p className="trade-note">
                          <span>📝</span>
                          {t.notes}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {/* ── VIN ──────────────────────────────────────────────── */}
          {currentPage === "vin" && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">VIN Decoder</p>
                  <h1>Look Up Any Vehicle</h1>
                  <p className="page-subtitle">
                    Decode any 17-character VIN using the NHTSA database — year,
                    make, model, trim, engine, and body class instantly.
                  </p>
                </div>
              </header>
              <article className="panel vin-decoder-panel">
                <div className="vin-hero">
                  <div>
                    <span className="vin-hero-icon">⌁</span>
                    <p className="eyebrow">NHTSA Decode</p>
                    <h2>Vehicle identity scanner</h2>
                    <p>
                      Paste a VIN to reveal build specs, powertrain, origin, and
                      estimated trade value.
                    </p>
                  </div>
                  <div className="vin-count">
                    <strong>{vin.length}/17</strong>
                    <span>characters</span>
                  </div>
                </div>
                <form className="vin-search" onSubmit={lookupVin}>
                  <input
                    placeholder="1FTFW1E50NFA00001"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    maxLength={17}
                  />
                  <button
                    type="submit"
                    disabled={vinLoading || vin.length < 11}
                  >
                    {vinLoading ? "Scanning..." : "Decode VIN"}
                  </button>
                </form>
                <div className="vin-samples">
                  {[
                    "1FTFW1E50NFA00001",
                    "4T1B11HK0MU000001",
                    "1GCUYDED0NZ000001",
                  ].map((sample) => (
                    <button
                      type="button"
                      key={sample}
                      onClick={() => setVin(sample)}
                    >
                      {sample}
                    </button>
                  ))}
                </div>
                {vinError && <p className="auth-error">{vinError}</p>}
                {vinResult && (
                  <div className="vin-card">
                    {vinResult.warning && (
                      <p className="vin-warning">⚠ {vinResult.warning}</p>
                    )}
                    <div className="vin-result-hero">
                      <div className="vin-vehicle-badge">
                        {(vinResult.make || "V").slice(0, 1)}
                      </div>
                      <div>
                        <strong className="vin-title">
                          {vinResult.year} {vinResult.make} {vinResult.model}
                        </strong>
                        <span>
                          {vinResult.trim && vinResult.trim !== "—"
                            ? vinResult.trim
                            : "Trim unavailable"}
                        </span>
                      </div>
                    </div>
                    <div className="vin-stat-row">
                      <div>
                        <span>Origin</span>
                        <strong>{vinResult.country || "—"}</strong>
                      </div>
                      <div>
                        <span>Body</span>
                        <strong>{vinResult.bodyClass || "—"}</strong>
                      </div>
                      <div>
                        <span>Drive</span>
                        <strong>{vinResult.driveType || "—"}</strong>
                      </div>
                    </div>
                    <div className="vin-grid">
                      <div>
                        <span>VIN</span>
                        <b
                          style={{ fontFamily: "monospace", letterSpacing: 1 }}
                        >
                          {vinResult.vin}
                        </b>
                      </div>
                      <div>
                        <span>Body Style</span>
                        <b>{vinResult.bodyClass}</b>
                      </div>
                      <div>
                        <span>Engine</span>
                        <b>{vinResult.engine}</b>
                      </div>
                      <div>
                        <span>Drive Type</span>
                        <b>{vinResult.driveType}</b>
                      </div>
                      <div>
                        <span>Transmission</span>
                        <b>{vinResult.transmission}</b>
                      </div>
                      <div>
                        <span>Fuel Type</span>
                        <b>{vinResult.fuelType}</b>
                      </div>
                      <div>
                        <span>Doors</span>
                        <b>{vinResult.doors}</b>
                      </div>
                      <div>
                        <span>Manufacturer</span>
                        <b>{vinResult.manufacturer}</b>
                      </div>
                      <div>
                        <span>Plant Country</span>
                        <b>{vinResult.country}</b>
                      </div>
                    </div>
                    {(() => {
                      const bv = estimateBookValue(
                        vinResult.year,
                        vinResult.make,
                        vinResult.model,
                      );
                      if (!bv.avg) return null;
                      return (
                        <div className="book-value-panel">
                          <div className="bv-header">
                            <span className="bv-title">
                              📊 Estimated Trade / Book Value
                            </span>
                            <span className="bv-age">
                              {bv.ageYears} yr old · {bv.state} vehicle
                            </span>
                          </div>
                          <div className="bv-range">
                            <div className="bv-col low">
                              <span>Trade-In Low</span>
                              <strong>${bv.low.toLocaleString()}</strong>
                            </div>
                            <div className="bv-col avg">
                              <span>Avg ACV</span>
                              <strong>${bv.avg.toLocaleString()}</strong>
                            </div>
                            <div className="bv-col high">
                              <span>Retail High</span>
                              <strong>${bv.high.toLocaleString()}</strong>
                            </div>
                          </div>
                          <p className="bv-disclaimer">
                            Estimate based on depreciation model. For certified
                            book values use KBB, NADA, or Black Book.
                          </p>
                          <button
                            type="button"
                            className="search-go-btn"
                            style={{ marginTop: 8, width: "100%" }}
                            onClick={() => {
                              setTradeForm((f) => ({
                                ...f,
                                vin: vinResult.vin,
                                year: vinResult.year,
                                make: vinResult.make,
                                model: vinResult.model,
                                estimatedValue: String(bv.avg),
                              }));
                              setTradeBookValue(bv);
                              setCurrentPage("trades");
                            }}
                          >
                            Use as Trade-In →
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </article>
            </>
          )}

          {/* ── DESK TOOL ────────────────────────────────────────── */}
          {currentPage === "desk" && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">Deal Desk</p>
                  <h1>Structure a Deal</h1>
                  <p className="page-subtitle">
                    Build the full deal — vehicle, trade, F&I products, taxes,
                    fees — and see the real monthly payment and amount financed
                    instantly.
                  </p>
                </div>
                <div className="header-actions">
                  <button type="button" onClick={saveDeskDeal}>
                    Save Deal
                  </button>
                  <button type="button" onClick={printDeskPaymentOptions}>
                    Print Options
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      setDesk({
                        customerId: "",
                        stockNumber: "",
                        year: "",
                        make: "",
                        model: "",
                        trim: "",
                        msrp: "",
                        sellingPrice: "",
                        tradeYear: "",
                        tradeMake: "",
                        tradeModel: "",
                        tradeACV: "",
                        tradePayoff: "",
                        downPayment: "",
                        rebate: "",
                        docFee: "699",
                        titleFee: "100",
                        regFee: "200",
                        taxRate: "8.5",
                        gap: false,
                        gapPrice: "895",
                        warranty: false,
                        warrantyPrice: "2495",
                        tireWheel: false,
                        tirewheelPrice: "1195",
                        paintPro: false,
                        paintProPrice: "799",
                        creditLife: false,
                        creditLifePrice: "599",
                        apr: "7.9",
                        termMonths: "72",
                        lender: "",
                        buyerZip: "",
                      })
                    }
                  >
                    Clear Desk
                  </button>
                </div>
              </header>

              <div className="desk-layout">
                {/* ── LEFT: Deal Builder ── */}
                <div className="desk-builder">
                  {/* Customer */}
                  <div className="desk-section">
                    <p className="desk-section-title">Customer</p>
                    <div className="desk-row">
                      <div className="desk-field full">
                        <label>Select Customer</label>
                        <select
                          value={desk.customerId}
                          onChange={(e) => applyDeskCustomer(e.target.value)}
                        >
                          <option value="">— No customer selected —</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.firstName} {c.lastName} —{" "}
                              {c.interestedVehicle || "No vehicle"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="desk-section">
                    <p className="desk-section-title">Vehicle</p>
                    <div className="desk-row">
                      <div className="desk-field">
                        <label>Stock #</label>
                        <input
                          placeholder="A1024"
                          value={desk.stockNumber}
                          onChange={(e) =>
                            setDesk({ ...desk, stockNumber: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Year</label>
                        <input
                          placeholder="2024"
                          value={desk.year}
                          onChange={(e) =>
                            setDesk({ ...desk, year: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Make</label>
                        <input
                          placeholder="Toyota"
                          value={desk.make}
                          onChange={(e) =>
                            setDesk({ ...desk, make: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Model</label>
                        <input
                          placeholder="Camry"
                          value={desk.model}
                          onChange={(e) =>
                            setDesk({ ...desk, model: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Trim</label>
                        <input
                          placeholder="XSE"
                          value={desk.trim}
                          onChange={(e) =>
                            setDesk({ ...desk, trim: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="desk-row">
                      <div className="desk-field">
                        <label>MSRP ($)</label>
                        <input
                          placeholder="42000"
                          value={desk.msrp}
                          onChange={(e) =>
                            setDesk({ ...desk, msrp: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Selling Price ($)</label>
                        <input
                          placeholder="39995"
                          value={desk.sellingPrice}
                          onChange={(e) =>
                            setDesk({ ...desk, sellingPrice: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field desk-computed">
                        <label>Discount</label>
                        <span
                          className={
                            deskNumbers.discount > 0
                              ? "desk-positive"
                              : deskNumbers.discount < 0
                                ? "desk-negative"
                                : "desk-zero"
                          }
                        >
                          {deskNumbers.discount !== 0
                            ? `$${Math.abs(deskNumbers.discount).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${deskNumbers.discount > 0 ? "below MSRP" : "above MSRP"}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trade-In */}
                  <div className="desk-section">
                    <p className="desk-section-title">Trade-In</p>
                    <div className="desk-row">
                      <div className="desk-field">
                        <label>Year</label>
                        <input
                          placeholder="2020"
                          value={desk.tradeYear}
                          onChange={(e) =>
                            setDesk({ ...desk, tradeYear: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Make</label>
                        <input
                          placeholder="Honda"
                          value={desk.tradeMake}
                          onChange={(e) =>
                            setDesk({ ...desk, tradeMake: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Model</label>
                        <input
                          placeholder="Accord"
                          value={desk.tradeModel}
                          onChange={(e) =>
                            setDesk({ ...desk, tradeModel: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="desk-row">
                      <div className="desk-field">
                        <label>ACV ($)</label>
                        <input
                          placeholder="14000"
                          value={desk.tradeACV}
                          onChange={(e) =>
                            setDesk({ ...desk, tradeACV: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Payoff ($)</label>
                        <input
                          placeholder="8500"
                          value={desk.tradePayoff}
                          onChange={(e) =>
                            setDesk({ ...desk, tradePayoff: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field desk-computed">
                        <label>Trade Equity</label>
                        <span
                          className={
                            deskNumbers.equity > 0
                              ? "desk-positive"
                              : deskNumbers.equity < 0
                                ? "desk-negative"
                                : "desk-zero"
                          }
                        >
                          {deskNumbers.equity !== 0
                            ? `${deskNumbers.equity > 0 ? "+" : ""}$${deskNumbers.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${deskNumbers.equity < 0 ? "(upside down)" : "equity"}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cash & Rebates */}
                  <div className="desk-section">
                    <p className="desk-section-title">Cash & Incentives</p>
                    <div className="desk-row">
                      <div className="desk-field">
                        <label>Down Payment ($)</label>
                        <input
                          placeholder="3000"
                          value={desk.downPayment}
                          onChange={(e) =>
                            setDesk({ ...desk, downPayment: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Manufacturer Rebate ($)</label>
                        <input
                          placeholder="1500"
                          value={desk.rebate}
                          onChange={(e) =>
                            setDesk({ ...desk, rebate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* F&I Products */}
                  <div className="desk-section">
                    <p className="desk-section-title">F&I Products</p>
                    <div className="fi-menu">
                      {(
                        [
                          {
                            key: "gap",
                            label: "GAP Insurance",
                            priceKey: "gapPrice",
                          },
                          {
                            key: "warranty",
                            label: "Extended Warranty",
                            priceKey: "warrantyPrice",
                          },
                          {
                            key: "tireWheel",
                            label: "Tire & Wheel Protection",
                            priceKey: "tirewheelPrice",
                          },
                          {
                            key: "paintPro",
                            label: "Paint Protection",
                            priceKey: "paintProPrice",
                          },
                          {
                            key: "creditLife",
                            label: "Credit Life / Disability",
                            priceKey: "creditLifePrice",
                          },
                        ] as const
                      ).map(({ key, label, priceKey }) => (
                        <div className="fi-row" key={key}>
                          <label className="fi-checkbox">
                            <input
                              type="checkbox"
                              checked={desk[key] as boolean}
                              onChange={(e) =>
                                setDesk({ ...desk, [key]: e.target.checked })
                              }
                            />
                            <span
                              className={
                                desk[key] ? "fi-label active" : "fi-label"
                              }
                            >
                              {label}
                            </span>
                          </label>
                          <div className="fi-price-wrap">
                            <span>$</span>
                            <input
                              className="fi-price"
                              value={desk[priceKey] as string}
                              onChange={(e) =>
                                setDesk({ ...desk, [priceKey]: e.target.value })
                              }
                              disabled={!desk[key] as boolean}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Taxes & Fees */}
                  <div className="desk-section">
                    <p className="desk-section-title">Taxes & Fees</p>
                    <div className="desk-row">
                      <div className="desk-field">
                        <label>Buyer Zip Code</label>
                        <input
                          placeholder="e.g. 77001"
                          maxLength={5}
                          value={desk.buyerZip}
                          onChange={(e) => {
                            const z = e.target.value.replace(/\D/g, "");
                            const taxInfo = getAutoTaxInfo(z);
                            setDesk({
                              ...desk,
                              buyerZip: z,
                              taxRate: taxInfo
                                ? String(taxInfo.rate)
                                : desk.taxRate,
                            });
                          }}
                        />
                        {desk.buyerZip.length === 5 &&
                          (() => {
                            const info = getAutoTaxInfo(desk.buyerZip);
                            return info ? (
                              <small className="tax-zip-note">
                                {info.label} —{" "}
                                {info.exact ? "Exact local rate" : "State avg"}:{" "}
                                {info.note}
                              </small>
                            ) : (
                              <small className="tax-zip-note warn">
                                Zip not recognized
                              </small>
                            );
                          })()}
                      </div>
                      <div className="desk-field">
                        <label>
                          Tax Rate %{" "}
                          <span style={{ fontWeight: 400, color: "#94a3b8" }}>
                            (edit if needed)
                          </span>
                        </label>
                        <input
                          value={desk.taxRate}
                          onChange={(e) =>
                            setDesk({ ...desk, taxRate: e.target.value })
                          }
                        />
                        <small className="tax-zip-note">
                          Exact ZIP rates are used when available; otherwise ZIP
                          falls back to a state-average estimate.
                        </small>
                      </div>
                      <div className="desk-field">
                        <label>Doc Fee ($)</label>
                        <input
                          value={desk.docFee}
                          onChange={(e) =>
                            setDesk({ ...desk, docFee: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Title Fee ($)</label>
                        <input
                          value={desk.titleFee}
                          onChange={(e) =>
                            setDesk({ ...desk, titleFee: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Reg / License ($)</label>
                        <input
                          value={desk.regFee}
                          onChange={(e) =>
                            setDesk({ ...desk, regFee: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Finance Terms */}
                  <div className="desk-section">
                    <p className="desk-section-title">Finance Terms</p>
                    <div className="desk-row">
                      <div className="desk-field">
                        <label>APR (%)</label>
                        <input
                          value={desk.apr}
                          onChange={(e) =>
                            setDesk({ ...desk, apr: e.target.value })
                          }
                        />
                      </div>
                      <div className="desk-field">
                        <label>Term (months)</label>
                        <select
                          value={desk.termMonths}
                          onChange={(e) =>
                            setDesk({ ...desk, termMonths: e.target.value })
                          }
                        >
                          <option>24</option>
                          <option>36</option>
                          <option>48</option>
                          <option>60</option>
                          <option>72</option>
                          <option>84</option>
                        </select>
                      </div>
                      <div className="desk-field">
                        <label>Lender</label>
                        <input
                          placeholder="Chase Auto"
                          value={desk.lender}
                          onChange={(e) =>
                            setDesk({ ...desk, lender: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: Deal Summary ── */}
                <div className="desk-summary">
                  {/* Monthly Payment — big hero number */}
                  <div className="payment-hero">
                    <p className="payment-hero-label">Est. Monthly Payment</p>
                    <strong className="payment-hero-amount">
                      {deskNumbers.monthly > 0
                        ? `$${deskNumbers.monthly.toFixed(2)}`
                        : "$—"}
                    </strong>
                    <p className="payment-hero-sub">
                      {desk.termMonths} mo · {desk.apr}% APR
                      {desk.lender ? ` · ${desk.lender}` : ""}
                    </p>
                    {deskNumbers.equity > 0 && (
                      <div className="cash-back-pill">
                        <span>Customer equity / money back</span>
                        <strong>
                          $
                          {deskNumbers.equity.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Deal Breakdown */}
                  <div className="deal-breakdown">
                    <p className="desk-section-title">Deal Breakdown</p>

                    <div className="deal-line">
                      <span>Selling Price</span>
                      <span>
                        {deskNumbers.selling > 0
                          ? `$${deskNumbers.selling.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : "—"}
                      </span>
                    </div>
                    {deskNumbers.fiTotal > 0 && (
                      <>
                        {deskNumbers.fiItems.map((item) => (
                          <div className="deal-line indent" key={item.name}>
                            <span>+ {item.name}</span>
                            <span>
                              $
                              {item.price.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="deal-line">
                      <span>Sales Tax ({desk.taxRate}%)</span>
                      <span>
                        {deskNumbers.salesTax > 0
                          ? `$${deskNumbers.salesTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : "—"}
                      </span>
                    </div>
                    <div className="deal-line">
                      <span>Doc / Title / Reg</span>
                      <span>
                        {deskNumbers.totalFees > 0
                          ? `$${deskNumbers.totalFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : "—"}
                      </span>
                    </div>
                    {deskNumbers.equity !== 0 && (
                      <div
                        className={`deal-line ${deskNumbers.equity > 0 ? "deal-line-credit" : "deal-line-debit"}`}
                      >
                        <span>
                          {deskNumbers.equity > 0
                            ? "– Trade Equity / Money Back"
                            : "+ Negative Equity"}
                        </span>
                        <span>
                          {deskNumbers.equity > 0 ? "-" : "+"}$
                          {Math.abs(deskNumbers.equity).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 0 },
                          )}
                        </span>
                      </div>
                    )}
                    {parseFloat(desk.downPayment) > 0 && (
                      <div className="deal-line deal-line-credit">
                        <span>– Down Payment</span>
                        <span>
                          -$
                          {(parseFloat(desk.downPayment) || 0).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 0 },
                          )}
                        </span>
                      </div>
                    )}
                    {parseFloat(desk.rebate) > 0 && (
                      <div className="deal-line deal-line-credit">
                        <span>– Manufacturer Rebate</span>
                        <span>
                          -$
                          {(parseFloat(desk.rebate) || 0).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 0 },
                          )}
                        </span>
                      </div>
                    )}
                    <div className="deal-line deal-line-total">
                      <span>Amount Financed</span>
                      <strong>
                        {deskNumbers.financed > 0
                          ? `$${deskNumbers.financed.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  {hasDeskAmountToCalculate && (
                    <div className="desk-target-card">
                      <div className="desk-target-head">
                        <p className="desk-section-title">Payment Target</p>
                        <span>Reverse-calculate cash needed</span>
                      </div>
                      <div className="desk-target-row">
                        <label>
                          Desired monthly payment
                          <input
                            placeholder="650"
                            value={targetPayment}
                            onChange={(e) => setTargetPayment(e.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={!targetPaymentResult}
                          onClick={() => {
                            if (!targetPaymentResult) return;
                            const requiredDown = String(
                              Math.ceil(targetPaymentResult.requiredDown),
                            );
                            setDesk({
                              ...desk,
                              downPayment: requiredDown,
                            });
                            setPaymentGridDowns((downs) => {
                              const next = [...downs];
                              const existingIndex = next.findIndex(
                                (down) =>
                                  (parseFloat(down) || 0) ===
                                  Number(requiredDown),
                              );
                              if (existingIndex >= 0) return next;
                              next[0] = requiredDown;
                              return next;
                            });
                          }}
                        >
                          Apply Down
                        </button>
                      </div>
                      {targetPaymentResult && (
                        <div className="desk-target-result">
                          <span>Recommended total down</span>
                          <strong>
                            $
                            {targetPaymentResult.requiredDown.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 0 },
                            )}
                          </strong>
                          <small>
                            Extra from current down: $
                            {targetPaymentResult.additionalDown.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 0 },
                            )}
                          </small>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Grid */}
                  {hasDeskAmountToCalculate && (
                    <div className="payment-grid-wrap">
                      <p className="desk-section-title">Payment Grid</p>
                      <p className="payment-grid-note">
                        Compare 3 custom down payment, APR, and term scenarios
                      </p>
                      <div className="payment-grid-down-editor">
                        {paymentGridDowns.map((down, index) => {
                          const downAmount = parseFloat(down) || 0;
                          const scenario = paymentGridScenarios[index];
                          return (
                            <div
                              className={`payment-scenario-card ${
                                downAmount ===
                                  (parseFloat(desk.downPayment) || 0) &&
                                Number(scenario.term) ===
                                  (parseInt(desk.termMonths) || 72) &&
                                Number(scenario.apr) ===
                                  (parseFloat(desk.apr) || 0)
                                  ? "active"
                                  : ""
                              }`}
                              key={index}
                              onClick={() =>
                                setDesk({
                                  ...desk,
                                  apr: scenario.apr,
                                  termMonths: scenario.term,
                                  downPayment: String(downAmount),
                                })
                              }
                            >
                              <label
                                className="print-option-toggle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  aria-label={`Print option ${index + 1}`}
                                  checked={selectedPrintOptions[index]}
                                  onChange={(e) => {
                                    const next = [...selectedPrintOptions];
                                    next[index] = e.target.checked;
                                    setSelectedPrintOptions(next);
                                  }}
                                />
                              </label>
                              <label onClick={(e) => e.stopPropagation()}>
                                Down {index + 1}
                                <input
                                  value={down}
                                  onChange={(e) => {
                                    const next = [...paymentGridDowns];
                                    next[index] = e.target.value.replace(
                                      /[^\d.]/g,
                                      "",
                                    );
                                    setPaymentGridDowns(next);
                                  }}
                                />
                              </label>
                              <label onClick={(e) => e.stopPropagation()}>
                                APR %
                                <input
                                  value={scenario.apr}
                                  onChange={(e) => {
                                    const next = [...paymentGridScenarios];
                                    next[index] = {
                                      ...next[index],
                                      apr: e.target.value.replace(
                                        /[^\d.]/g,
                                        "",
                                      ),
                                    };
                                    setPaymentGridScenarios(next);
                                  }}
                                />
                              </label>
                              <label onClick={(e) => e.stopPropagation()}>
                                Term
                                <input
                                  value={scenario.term}
                                  onChange={(e) => {
                                    const next = [...paymentGridScenarios];
                                    next[index] = {
                                      ...next[index],
                                      term: e.target.value.replace(
                                        /[^\d]/g,
                                        "",
                                      ),
                                    };
                                    setPaymentGridScenarios(next);
                                  }}
                                />
                              </label>
                            </div>
                          );
                        })}
                      </div>
                      <div className="payment-grid-scroll">
                        <table className="payment-grid-table">
                          <thead>
                            <tr>
                              <th>Scenario</th>
                              <th>Down</th>
                              <th>APR</th>
                              <th>Term</th>
                              <th>Payment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paymentGrid.map((row, index) => (
                              <tr
                                key={index}
                                onClick={() =>
                                  setDesk({
                                    ...desk,
                                    apr: String(row.apr),
                                    termMonths: String(row.term),
                                    downPayment: String(row.down),
                                  })
                                }
                                className={
                                  row.term ===
                                    (parseInt(desk.termMonths) || 72) &&
                                  row.down ===
                                    (parseFloat(desk.downPayment) || 0) &&
                                  row.apr === (parseFloat(desk.apr) || 0)
                                    ? "grid-row-active"
                                    : ""
                                }
                              >
                                <td>
                                  <strong>Option {index + 1}</strong>
                                </td>
                                <td>${row.down.toLocaleString()}</td>
                                <td>{row.apr}%</td>
                                <td>{row.term} mo</td>
                                <td
                                  className={row.payment > 0 ? "" : "grid-zero"}
                                >
                                  ${row.payment.toFixed(0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── ACTIVITIES ───────────────────────────────────────── */}
          {currentPage === "activities" && (
            <div className="activities-page">
              <header className="page-header">
                <div>
                  <p className="eyebrow">Activity Log</p>
                  <h1>Activity Summary</h1>
                  <p className="page-subtitle">
                    See who was worked and how many calls, texts, emails,
                    appointments, and leads came in for the selected period.
                    Notes stay inside each customer's profile.
                  </p>
                </div>
                <div className="header-actions">
                  <button
                    type="button"
                    className={
                      activityReportRange === "day" ? "" : "ghost-button"
                    }
                    onClick={() => setActivityReportRange("day")}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={
                      activityReportRange === "week" ? "" : "ghost-button"
                    }
                    onClick={() => setActivityReportRange("week")}
                  >
                    This Week
                  </button>
                </div>
              </header>
              <div className="activity-stat-grid">
                <div className="activity-stat-card">
                  <span>New Leads</span>
                  <strong>{activityReportTotals.leads}</strong>
                </div>
                <div className="activity-stat-card">
                  <span>Calls</span>
                  <strong>{activityReportTotals.calls}</strong>
                </div>
                <div className="activity-stat-card">
                  <span>Texts</span>
                  <strong>{activityReportTotals.texts}</strong>
                </div>
                <div className="activity-stat-card">
                  <span>Emails</span>
                  <strong>{activityReportTotals.emails}</strong>
                </div>
                <div className="activity-stat-card">
                  <span>Appointments</span>
                  <strong>{activityReportTotals.appointments}</strong>
                </div>
              </div>
              <div className="activity-report-table">
                {activityReportRows.length === 0 && (
                  <p className="empty-state large">
                    No customer interactions for this period.
                  </p>
                )}
                {activityReportRows.map((row) => (
                  <button
                    className="activity-report-row"
                    key={row.customer.id}
                    onClick={() => openProfile(row.customer)}
                    type="button"
                  >
                    <div>
                      <strong>
                        {row.customer.firstName} {row.customer.lastName}
                      </strong>
                      <span>
                        Last interaction:{" "}
                        {new Date(row.lastInteraction).toLocaleString()}
                      </span>
                    </div>
                    <div className="activity-counts">
                      <span>Leads {row.leads}</span>
                      <span>Calls {row.calls}</span>
                      <span>Texts {row.texts}</span>
                      <span>Emails {row.emails}</span>
                      <span>Appts {row.appointments}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SERVICE ──────────────────────────────────────────── */}
          {currentPage === "service" &&
            (() => {
              const roStatuses: RoStatus[] = [
                "Check-In",
                "In Progress",
                "On Hold - Parts",
                "Multi-Point",
                "Ready",
                "Closed",
              ];
              const openROs = repairOrders.filter((r) => r.status !== "Closed");
              const readyROs = repairOrders.filter((r) => r.status === "Ready");
              const inProgROs = repairOrders.filter(
                (r) => r.status === "In Progress" || r.status === "Multi-Point",
              );
              const holdROs = repairOrders.filter(
                (r) => r.status === "On Hold - Parts",
              );
              const serviceRev = openROs.reduce((t, r) => t + r.total, 0);

              function roStatusClass(s: RoStatus) {
                return (
                  {
                    "Check-In": "ro-checkin",
                    "In Progress": "ro-inprogress",
                    "On Hold - Parts": "ro-hold",
                    "Multi-Point": "ro-mpi",
                    Ready: "ro-ready",
                    Closed: "ro-closed",
                  }[s] ?? ""
                );
              }

              async function updateRoStatus(id: number, status: RoStatus) {
                try {
                  const res = await fetch(
                    `${API_BASE}/api/repair-orders/${id}/status`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status }),
                    },
                  );
                  const updated = await res.json();
                  setRepairOrders((prev) =>
                    prev.map((r) => (r.id === id ? updated : r)),
                  );
                } catch {
                  setRepairOrders((prev) =>
                    prev.map((r) =>
                      r.id === id
                        ? {
                            ...r,
                            status,
                            closedAt:
                              status === "Closed"
                                ? new Date().toISOString()
                                : r.closedAt,
                          }
                        : r,
                    ),
                  );
                }
              }

              async function handleCreateRo(e: React.FormEvent) {
                e.preventDefault();
                const newRo: RepairOrder = {
                  id: Date.now(),
                  roNumber: `RO-${String(Date.now()).slice(-6)}`,
                  customerName: roForm.customerName || "Walk-in",
                  customerPhone: roForm.customerPhone,
                  vehicleYear: roForm.vehicleYear,
                  vehicleMake: roForm.vehicleMake,
                  vehicleModel: roForm.vehicleModel,
                  vehicleMileageIn: Number(roForm.vehicleMileageIn) || 0,
                  vehicleVin: roForm.vehicleVin,
                  advisor: roForm.advisor,
                  technician: roForm.technician,
                  status: "Check-In",
                  promisedTime: roForm.promisedTime,
                  lines: roForm.concern
                    ? [
                        {
                          id: 1,
                          description: roForm.concern,
                          type: "Concern",
                          laborHours: 0,
                          laborTotal: 0,
                          partsTotal: 0,
                          tech: "",
                          status: "Open",
                        },
                      ]
                    : [],
                  laborTotal: 0,
                  partsTotal: 0,
                  total: 0,
                  notes: roForm.notes,
                  createdAt: new Date().toISOString(),
                };
                try {
                  const res = await fetch(`${API_BASE}/api/repair-orders`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newRo),
                  });
                  const saved = await res.json();
                  setRepairOrders((prev) => [saved, ...prev]);
                } catch {
                  setRepairOrders((prev) => [newRo, ...prev]);
                }
                setRoForm({
                  customerName: "",
                  customerPhone: "",
                  vehicleYear: "",
                  vehicleMake: "",
                  vehicleModel: "",
                  vehicleMileageIn: "",
                  vehicleVin: "",
                  advisor: "",
                  technician: "",
                  promisedTime: "",
                  concern: "",
                  notes: "",
                });
                setShowRoForm(false);
                setAppMessage(`RO ${newRo.roNumber} opened.`);
              }

              return (
                <>
                  <header className="page-header">
                    <div>
                      <p className="eyebrow">Service Department</p>
                      <h1>Open Repair Orders</h1>
                      <p className="page-subtitle">
                        Live view of every vehicle in service. Update status as
                        work progresses.
                      </p>
                    </div>
                    <div className="header-actions">
                      <button
                        type="button"
                        onClick={() => setShowRoForm((v) => !v)}
                      >
                        + New RO
                      </button>
                    </div>
                  </header>

                  {/* Service KPIs */}
                  <div
                    className="kpi-grid"
                    style={{ gridTemplateColumns: "repeat(4,1fr)" }}
                  >
                    <div className="kpi-card kpi-blue">
                      <span>Open ROs</span>
                      <strong>{openROs.length}</strong>
                      <small>Active vehicles</small>
                    </div>
                    <div className="kpi-card kpi-yellow">
                      <span>In Progress</span>
                      <strong>{inProgROs.length}</strong>
                      <small>Tech working now</small>
                    </div>
                    <div
                      className="kpi-card"
                      style={{
                        background: "linear-gradient(135deg,#f97316,#ef4444)",
                        color: "#fff",
                      }}
                    >
                      <span>On Hold — Parts</span>
                      <strong>{holdROs.length}</strong>
                      <small>Waiting on parts</small>
                    </div>
                    <div className="kpi-card kpi-green">
                      <span>Ready for Pickup</span>
                      <strong>{readyROs.length}</strong>
                      <small>${serviceRev.toLocaleString()} est. rev</small>
                    </div>
                  </div>

                  {/* New RO Form */}
                  {showRoForm && (
                    <article className="panel" style={{ marginBottom: 18 }}>
                      <p className="eyebrow">Open New Repair Order</p>
                      <h2>Vehicle Check-In</h2>
                      <form className="ro-form" onSubmit={handleCreateRo}>
                        <div className="ro-form-group">
                          <label>Customer Name</label>
                          <input
                            placeholder="John Smith"
                            value={roForm.customerName}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                customerName: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ro-form-group">
                          <label>Phone</label>
                          <input
                            placeholder="(555) 000-0000"
                            value={roForm.customerPhone}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                customerPhone: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ro-form-group">
                          <label>Year</label>
                          <input
                            placeholder="2021"
                            value={roForm.vehicleYear}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                vehicleYear: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ro-form-group">
                          <label>Make</label>
                          <input
                            placeholder="Toyota"
                            value={roForm.vehicleMake}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                vehicleMake: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ro-form-group">
                          <label>Model</label>
                          <input
                            placeholder="Camry"
                            value={roForm.vehicleModel}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                vehicleModel: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ro-form-group">
                          <label>Mileage In</label>
                          <input
                            placeholder="38200"
                            value={roForm.vehicleMileageIn}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                vehicleMileageIn: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ro-form-group">
                          <label>VIN (optional)</label>
                          <input
                            placeholder="1HGBH41JXMN109186"
                            value={roForm.vehicleVin}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                vehicleVin: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ro-form-group">
                          <label>Service Advisor</label>
                          <select
                            value={roForm.advisor}
                            onChange={(e) =>
                              setRoForm({ ...roForm, advisor: e.target.value })
                            }
                          >
                            <option value="">Select advisor</option>
                            {["Avery", "Mike", "Sarah", "Dan"].map((a) => (
                              <option key={a}>{a}</option>
                            ))}
                          </select>
                        </div>
                        <div className="ro-form-group">
                          <label>Technician</label>
                          <select
                            value={roForm.technician}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                technician: e.target.value,
                              })
                            }
                          >
                            <option value="">Unassigned</option>
                            {["Mike T.", "Dan W.", "Chris R.", "Sam L."].map(
                              (t) => (
                                <option key={t}>{t}</option>
                              ),
                            )}
                          </select>
                        </div>
                        <div className="ro-form-group">
                          <label>Promised Time</label>
                          <input
                            placeholder="3:00 PM Today"
                            value={roForm.promisedTime}
                            onChange={(e) =>
                              setRoForm({
                                ...roForm,
                                promisedTime: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ro-form-group ro-form-wide">
                          <label>Customer Concern</label>
                          <input
                            placeholder="Describe the concern or service needed..."
                            value={roForm.concern}
                            onChange={(e) =>
                              setRoForm({ ...roForm, concern: e.target.value })
                            }
                          />
                        </div>
                        <div className="ro-form-group ro-form-wide">
                          <label>Notes</label>
                          <input
                            placeholder="Internal notes..."
                            value={roForm.notes}
                            onChange={(e) =>
                              setRoForm({ ...roForm, notes: e.target.value })
                            }
                          />
                        </div>
                        <div className="ro-form-actions">
                          <button type="submit">Open RO</button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setShowRoForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </article>
                  )}

                  {/* RO Board — columns by status */}
                  <div className="ro-board">
                    {roStatuses
                      .filter((s) => s !== "Closed")
                      .map((col) => {
                        const colRos = repairOrders.filter(
                          (r) => r.status === col,
                        );
                        return (
                          <div className="ro-col" key={col}>
                            <div className="ro-col-header">
                              <span
                                className={`ro-status-badge ${roStatusClass(col)}`}
                              >
                                {col}
                              </span>
                              <span className="ro-col-count">
                                {colRos.length}
                              </span>
                            </div>
                            {colRos.length === 0 && (
                              <p
                                className="empty-state"
                                style={{ fontSize: 12, padding: "10px 0" }}
                              >
                                Empty
                              </p>
                            )}
                            {colRos.map((ro) => (
                              <div
                                className={`ro-card ${roStatusClass(ro.status)}`}
                                key={ro.id}
                              >
                                <div className="ro-card-header">
                                  <span className="ro-number">
                                    {ro.roNumber}
                                  </span>
                                  {ro.promisedTime && (
                                    <span className="ro-promise">
                                      <Clock size={11} /> {ro.promisedTime}
                                    </span>
                                  )}
                                </div>
                                <strong className="ro-customer">
                                  {ro.customerName}
                                </strong>
                                <span className="ro-vehicle">
                                  {ro.vehicleYear} {ro.vehicleMake}{" "}
                                  {ro.vehicleModel}
                                </span>
                                <span
                                  className="ro-vehicle"
                                  style={{ color: "#94a3b8" }}
                                >
                                  {ro.vehicleMileageIn.toLocaleString()} mi ·{" "}
                                  {ro.vehicleVin || "No VIN"}
                                </span>
                                <div className="ro-advisors">
                                  <span>Adv: {ro.advisor || "—"}</span>
                                  <span>Tech: {ro.technician || "—"}</span>
                                </div>
                                {ro.lines.length > 0 && (
                                  <div className="ro-lines">
                                    {ro.lines.map((line) => (
                                      <div className="ro-line" key={line.id}>
                                        <span
                                          className={`ro-line-status ${line.status === "Complete" ? "line-done" : line.status === "In Progress" ? "line-wip" : "line-open"}`}
                                        >
                                          {line.status === "Complete" ? (
                                            <CheckCircle size={10} />
                                          ) : line.status === "In Progress" ? (
                                            <Clock size={10} />
                                          ) : (
                                            <AlertTriangle size={10} />
                                          )}
                                        </span>
                                        <span className="ro-line-desc">
                                          {line.description}
                                        </span>
                                        <span className="ro-line-total">
                                          $
                                          {(
                                            line.laborTotal + line.partsTotal
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {ro.notes && (
                                  <p className="ro-notes">{ro.notes}</p>
                                )}
                                <div className="ro-total-row">
                                  <span>Total</span>
                                  <strong>${ro.total.toLocaleString()}</strong>
                                </div>
                                <div className="ro-status-actions">
                                  {roStatuses
                                    .filter((s) => s !== ro.status)
                                    .map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        className={`ro-move-btn ${roStatusClass(s)}`}
                                        onClick={() => updateRoStatus(ro.id, s)}
                                      >
                                        → {s}
                                      </button>
                                    ))}
                                </div>
                                {ro.customerId && (
                                  <button
                                    type="button"
                                    className="open-btn"
                                    style={{ marginTop: 6, width: "100%" }}
                                    onClick={() => {
                                      window.location.hash = `#/customers/${ro.customerId}`;
                                    }}
                                  >
                                    View Customer Profile
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                  </div>

                  {/* Closed ROs */}
                  {repairOrders.filter((r) => r.status === "Closed").length >
                    0 && (
                    <article className="panel" style={{ marginTop: 18 }}>
                      <p className="eyebrow">Closed Today</p>
                      <h2>Completed Repair Orders</h2>
                      <table className="ro-table">
                        <thead>
                          <tr>
                            <th>RO #</th>
                            <th>Customer</th>
                            <th>Vehicle</th>
                            <th>Advisor</th>
                            <th>Tech</th>
                            <th>Total</th>
                            <th>Closed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repairOrders
                            .filter((r) => r.status === "Closed")
                            .map((ro) => (
                              <tr key={ro.id}>
                                <td>
                                  <code>{ro.roNumber}</code>
                                </td>
                                <td>{ro.customerName}</td>
                                <td>
                                  {ro.vehicleYear} {ro.vehicleMake}{" "}
                                  {ro.vehicleModel}
                                </td>
                                <td>{ro.advisor}</td>
                                <td>{ro.technician}</td>
                                <td>
                                  <strong>${ro.total.toLocaleString()}</strong>
                                </td>
                                <td>
                                  <small>
                                    {ro.closedAt
                                      ? new Date(
                                          ro.closedAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "—"}
                                  </small>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </article>
                  )}
                </>
              );
            })()}
        </section>
      </main>
    </>
  );
}

export default App;
