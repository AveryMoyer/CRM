import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
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
  Landmark,
  DollarSign,
  ShieldCheck,
  BadgeDollarSign,
  ClipboardList,
  MessageSquare,
  Mail,
  Send,
  ChevronDown,
  Zap,
  RefreshCw,
  PauseCircle,
  UserMinus,
  Warehouse,
  BarChart2,
  Package,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Target,
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
  driverLicenseNumber: string;
  driverLicenseState: string;
  driverLicenseExpiration: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  residenceType: string;
  timeAtAddress: string;
  employerName: string;
  employerAddress: string;
  jobTitle: string;
  employmentStatus: string;
  timeOnJob: string;
  monthlyIncome: number;
  otherIncome: number;
  bankName: string;
  downPayment: number;
  requestedVehicle: string;
  vehicleVin: string;
  vehicleMileage: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  tradeTitleStatus: string;
  tradeRegistrationStatus: string;
  incomeDocsReceived: boolean;
  identityDocsReceived: boolean;
  residenceDocsReceived: boolean;
  insuranceDocsReceived: boolean;
  tradeDocsReceived: boolean;
  submissionPlatform: string;
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

type FiProductCategory =
  | "GAP"
  | "Extended Warranty"
  | "Tire & Wheel"
  | "Prepaid Maintenance"
  | "Paint Protection"
  | "Key Replacement"
  | "Credit Life"
  | "Credit Disability";

type FundingStatus =
  | "Pending Structure"
  | "Submitted to Lender"
  | "Approved"
  | "Stipulations Required"
  | "Funded"
  | "Unwound"
  | "Declined";

type DealStip = {
  id: number;
  label: string;
  received: boolean;
  receivedAt?: string;
  note?: string;
};

type FiProductSold = {
  productId: number;
  category: FiProductCategory;
  name: string;
  retailPrice: number;
  dealerCost: number;
  termMonths?: number;
};

type FiProduct = {
  id: number;
  dealershipId?: number;
  category: FiProductCategory;
  name: string;
  providerName: string;
  termMonths?: number;
  mileageLimit?: number;
  dealerCost: number;
  retailPrice: number;
  retailCap: number;
  minProfit: number;
  active: boolean;
};

type LenderTier = "Prime" | "Near-Prime" | "Subprime" | "Deep Subprime";

type Lender = {
  id: number;
  dealershipId?: number;
  name: string;
  tier: LenderTier;
  minCreditScore?: number;
  maxLtv?: number;
  maxTermMonths?: number;
  contactName?: string;
  contactPhone?: string;
  active: boolean;
};

type LenderDecisionStatus = "Pending" | "Approved" | "Countered" | "Declined";

type LenderSubmission = {
  id: number;
  vehicleSaleId: number;
  lenderId: number;
  lenderName: string;
  submittedAt: string;
  status: LenderDecisionStatus;
  approvedRate?: number;
  approvedTerm?: number;
  approvedAmount?: number;
  maxLtv?: number;
  counterConditions?: string;
  declineReason?: string;
  decidedAt?: string;
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
  lender?: string;
  lenderContactName?: string;
  lenderPhone?: string;
  apr?: number;
  termMonths?: number;
  downPayment?: number;
  tradeAllowance?: number;
  tradePayoff?: number;
  dealerReserve?: number;
  backEndGross?: number;
  fundingStatus?: FundingStatus;
  fundingDate?: string;
  fiProducts?: FiProductSold[];
  stips?: DealStip[];
  lenderSubmissions?: LenderSubmission[];
  acceptedSubmissionId?: number;
  ofacCleared?: boolean;
  redFlagsCleared?: boolean;
  truthInLendingPrinted?: boolean;
  eContractSent?: boolean;
  eContractSigned?: boolean;
  financeManagerName?: string;
  notes?: string;
  createdAt?: string;
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

type MessageStatus = "queued" | "sent" | "delivered" | "failed" | "received";

type Message = {
  id: number;
  customerId: number;
  channel: "Text" | "Email";
  direction: "Outbound" | "Inbound";
  subject?: string;
  body: string;
  template?: string;
  status: MessageStatus;
  providerSid?: string;
  fromNumber?: string;
  toNumber?: string;
  fromEmail?: string;
  toEmail?: string;
  errorMessage?: string;
  sequenceId?: number;
  sequenceStepIndex?: number;
  createdAt: string;
  updatedAt?: string;
};

type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  body: string;
  channel: "Text" | "Email";
  createdAt: string;
};

type SequenceStep = {
  index: number;
  delayDays: number;
  channel: "Text" | "Email";
  subject?: string;
  body: string;
};

type EmailSequence = {
  id: number;
  name: string;
  triggerEvent: "lead_created" | "appointment_set" | "deal_lost" | "manual";
  steps: SequenceStep[];
  active: boolean;
  createdAt: string;
};

type EnrollmentStatus = "active" | "completed" | "paused" | "unsubscribed";

type SequenceEnrollment = {
  id: number;
  customerId: number;
  sequenceId: number;
  enrolledAt: string;
  currentStepIndex: number;
  status: EnrollmentStatus;
  completedAt?: string;
};

type InventoryStatus =
  | "Available"
  | "In Transit"
  | "Sold"
  | "Hold"
  | "Archived";

type InventoryVehicle = {
  id: number;
  dealershipId: number;
  stockNumber: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  bodyClass: string;
  extColor: string;
  intColor: string;
  mileage: number;
  msrp: number;
  internetPrice: number;
  invoicePrice: number;
  status: InventoryStatus;
  condition: "New" | "Used" | "CPO";
  daysOnLot: number;
  addedAt: string;
  notes: string;
  imageUrl?: string;
};

type SalesGoal = {
  id: number;
  dealershipId: number;
  salespersonName: string;
  month: string;
  unitGoal: number;
  grossGoal: number;
};

type AuditLogEntry = {
  id: number;
  dealershipId: number;
  userId: number;
  userName: string;
  action: string;
  entity: string;
  entityId: number;
  before?: string;
  after?: string;
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
  emailTemplates?: EmailTemplate[];
  emailSequences?: EmailSequence[];
  sequenceEnrollments?: SequenceEnrollment[];
  repairOrders?: RepairOrder[];
  fiProducts?: FiProduct[];
  lenders?: Lender[];
  inventory?: InventoryVehicle[];
  salesGoals?: SalesGoal[];
  auditLog?: AuditLogEntry[];
};

type CrmRole =
  | "SuperAdmin"
  | "DealerGroupAdmin"
  | "DealerPrincipal"
  | "GeneralManager"
  | "SalesManager"
  | "FinanceManager"
  | "ServiceManager"
  | "Salesperson"
  | "ServiceAdvisor"
  | "Technician";

type UserAccount = {
  id: number;
  name: string;
  email: string;
  role: CrmRole | string;
  phone?: string;
  avatarUrl?: string;
  dealershipId?: number;
  dealerGroupId?: number;
};

type DealershipBranding = {
  id: number;
  name: string;
  brand: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
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
  | "pipeline"
  | "trades"
  | "vin"
  | "activities"
  | "desk"
  | "service"
  | "fi-manager"
  | "comms"
  | "inventory"
  | "reports";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:4000";

// ── Tenant-aware fetch wrapper ─────────────────────────────────────────────
// Reads dealership/user context from localStorage and injects it as headers
// on every API call so the backend can enforce row-level isolation.
function getTenantHeaders(): Record<string, string> {
  const userRaw = localStorage.getItem("crm-current-user");
  const user: UserAccount | null = userRaw ? JSON.parse(userRaw) : null;
  if (!user) return {};
  const headers: Record<string, string> = {
    "X-User-Id": String(user.id),
    "X-User-Role": user.role,
  };
  if (user.dealershipId) headers["X-Dealership-Id"] = String(user.dealershipId);
  if (user.dealerGroupId)
    headers["X-Dealer-Group-Id"] = String(user.dealerGroupId);
  return headers;
}

async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const tenantHeaders = getTenantHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...tenantHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

function applyDealerBranding(dealership: DealershipBranding | null) {
  const root = document.documentElement;
  if (dealership?.primaryColor) {
    root.style.setProperty("--dealer-primary", dealership.primaryColor);
    root.style.setProperty(
      "--dealer-accent",
      dealership.accentColor || dealership.primaryColor,
    );
  } else {
    root.style.removeProperty("--dealer-primary");
    root.style.removeProperty("--dealer-accent");
  }
}

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
  const [currentDealership, setCurrentDealership] =
    useState<DealershipBranding | null>(() => {
      const saved = localStorage.getItem("crm-dealership");
      return saved ? (JSON.parse(saved) as DealershipBranding) : null;
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
  const [fiProducts, setFiProducts] = useState<FiProduct[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedLenderIds, setSelectedLenderIds] = useState<Set<number>>(
    new Set(),
  );
  const [fiPriceOverrides, setFiPriceOverrides] = useState<
    Record<number, string>
  >({});
  const [activeDeal, setActiveDeal] = useState<VehicleSale | null>(null);
  const activeDealRef = useRef<VehicleSale | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailSequences, setEmailSequences] = useState<EmailSequence[]>([]);
  const [sequenceEnrollments, setSequenceEnrollments] = useState<
    SequenceEnrollment[]
  >([]);
  const [commsCustomerId, setCommsCustomerId] = useState<number | null>(null);
  const [commsTab, setCommsTab] = useState<"inbox" | "sequences" | "templates">(
    "inbox",
  );
  const [commsChannel, setCommsChannel] = useState<"Text" | "Email">("Text");
  const [commsBody, setCommsBody] = useState("");
  const [commsSubject, setCommsSubject] = useState("");
  const [commsTemplateId, setCommsTemplateId] = useState<number | null>(null);
  const [commsSending, setCommsSending] = useState(false);
  const [threadSearchQuery, setThreadSearchQuery] = useState("");
  const [bulkSmsOpen, setBulkSmsOpen] = useState(false);
  const [bulkSmsBody, setBulkSmsBody] = useState("");
  const [bulkSmsFilter, setBulkSmsFilter] = useState<
    "All" | "Working" | "Appt Set" | "Lost"
  >("All");
  const [bulkSmsSending, setBulkSmsSending] = useState(false);
  const [inventory, setInventory] = useState<InventoryVehicle[]>([]);
  const [salesGoals, setSalesGoals] = useState<SalesGoal[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [invFilter, setInvFilter] = useState<InventoryStatus | "All">("All");
  const [invCondition, setInvCondition] = useState<
    "All" | "New" | "Used" | "CPO"
  >("All");
  const [invSearch, setInvSearch] = useState("");
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [invEditTarget, setInvEditTarget] = useState<InventoryVehicle | null>(
    null,
  );
  const [invForm, setInvForm] = useState({
    stockNumber: "",
    vin: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    bodyClass: "",
    extColor: "",
    intColor: "",
    mileage: "",
    msrp: "",
    internetPrice: "",
    invoicePrice: "",
    status: "Available" as InventoryStatus,
    condition: "Used" as "New" | "Used" | "CPO",
    notes: "",
  });
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
    driverLicenseNumber: "",
    driverLicenseState: "",
    driverLicenseExpiration: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    residenceType: "Rent",
    timeAtAddress: "",
    employerName: "",
    employerAddress: "",
    jobTitle: "",
    employmentStatus: "Full-time",
    timeOnJob: "",
    monthlyIncome: "",
    otherIncome: "",
    bankName: "",
    downPayment: "",
    requestedVehicle: "",
    vehicleVin: "",
    vehicleMileage: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    tradeTitleStatus: "Not Applicable",
    tradeRegistrationStatus: "Not Applicable",
    incomeDocsReceived: false,
    identityDocsReceived: false,
    residenceDocsReceived: false,
    insuranceDocsReceived: false,
    tradeDocsReceived: false,
    submissionPlatform: "Internal CRM",
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
  const [deskMode, setDeskMode] = useState<"retail" | "lease" | "compare">(
    "retail",
  );
  const [leaseDesk, setLeaseDesk] = useState({
    residualPct: "52",
    moneyFactor: "0.00125",
    termMonths: "36",
    acquisition: "795",
    disposition: "395",
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

  const leaseNumbers = useMemo(() => {
    const msrp = parseFloat(desk.msrp) || 0;
    const cap = parseFloat(desk.sellingPrice) || msrp;
    const down = parseFloat(desk.downPayment) || 0;
    const acv = parseFloat(desk.tradeACV) || 0;
    const payoff = parseFloat(desk.tradePayoff) || 0;
    const equity = acv - payoff;
    const rebate = parseFloat(desk.rebate) || 0;
    const residualPct = parseFloat(leaseDesk.residualPct) / 100;
    const mf = parseFloat(leaseDesk.moneyFactor) || 0;
    const term = parseInt(leaseDesk.termMonths) || 36;
    const acquisition = parseFloat(leaseDesk.acquisition) || 0;
    const residual = msrp * residualPct;
    // Adjusted cap cost
    const adjCap = cap + acquisition - down - equity - rebate;
    const depreciation = (adjCap - residual) / term;
    const rentCharge = (adjCap + residual) * mf;
    const basePmt = depreciation + rentCharge;
    const taxRate = (parseFloat(desk.taxRate) || 0) / 100;
    const monthly = basePmt * (1 + taxRate);
    const totalCost = monthly * term + down;
    // Retail comparison total cost
    const retailTotal = deskNumbers.monthly * parseInt(desk.termMonths || "72");
    return {
      residual,
      adjCap,
      depreciation,
      rentCharge,
      basePmt,
      monthly,
      totalCost,
      retailTotal,
      term,
    };
  }, [desk, leaseDesk, deskNumbers]);

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

  // ── Equity Mining ────────────────────────────────────────────────────────
  // Surface sold customers whose vehicle is estimated to have positive equity.
  // Heuristic: rough ACV = salePrice * (0.85 ^ yearsOwned) capped at $4k floor,
  // minus estimated remaining balance (simple amortization proxy).
  const equityMiningTargets = useMemo(() => {
    const now = Date.now();
    return vehicleSales
      .filter((s) => s.stage === "Delivered" || s.fundingStatus === "Funded")
      .map((sale) => {
        const customer = customers.find((c) => c.id === sale.customerId);
        if (!customer) return null;

        const soldDate = sale.createdAt
          ? new Date(sale.createdAt).getTime()
          : now - 1000 * 60 * 60 * 24 * 365 * 2;
        const yearsOwned = Math.max(
          0,
          (now - soldDate) / (1000 * 60 * 60 * 24 * 365),
        );

        // Estimated current ACV using straight-line depreciation (~15%/yr)
        const estimatedACV = Math.max(
          4000,
          sale.salePrice * Math.pow(0.85, yearsOwned),
        );

        // Estimate remaining balance via simple amortization proxy
        const term = sale.termMonths ?? 60;
        const apr = (sale.apr ?? 6.9) / 100 / 12;
        const totalFinanced =
          sale.salePrice -
          (sale.downPayment ?? 0) +
          (sale.tradePayoff ?? 0) -
          (sale.tradeAllowance ?? 0);
        const monthsPaid = Math.min(term, yearsOwned * 12);
        let remainingBalance = 0;
        if (totalFinanced > 0 && apr > 0) {
          const payment =
            (totalFinanced * apr) / (1 - Math.pow(1 + apr, -term));
          remainingBalance = Math.max(
            0,
            totalFinanced * Math.pow(1 + apr, monthsPaid) -
              payment * ((Math.pow(1 + apr, monthsPaid) - 1) / apr),
          );
        } else if (totalFinanced > 0) {
          remainingBalance = Math.max(
            0,
            totalFinanced - (totalFinanced / term) * monthsPaid,
          );
        }

        const equity = Math.round(estimatedACV - remainingBalance);
        if (equity < 1500) return null; // only surface meaningful equity
        if (yearsOwned < 1.5) return null; // need at least 18 months

        return {
          customer,
          sale,
          yearsOwned: Math.round(yearsOwned * 10) / 10,
          estimatedACV: Math.round(estimatedACV),
          remainingBalance: Math.round(remainingBalance),
          equity,
        };
      })
      .filter(
        (
          item,
        ): item is {
          customer: Customer;
          sale: VehicleSale;
          yearsOwned: number;
          estimatedACV: number;
          remainingBalance: number;
          equity: number;
        } => Boolean(item),
      )
      .sort((a, b) => b.equity - a.equity)
      .slice(0, 8);
  }, [vehicleSales, customers]);

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
      if (window.location.hash === "#/finance") {
        window.location.hash = "#/fi-manager";
        return;
      }
      const route = parseHashRoute(window.location.hash);
      setSelectedCustomerId(route.selectedCustomerId);
      setCurrentPage(route.page as AppPage);
    }
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("crm-dealership");
    if (saved) applyDealerBranding(JSON.parse(saved) as DealershipBranding);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    apiFetch(`${API_BASE}/api/bootstrap`)
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
        if (d.fiProducts) setFiProducts(d.fiProducts);
        if (d.lenders) setLenders(d.lenders);
        if (d.emailTemplates) setEmailTemplates(d.emailTemplates);
        if (d.emailSequences) setEmailSequences(d.emailSequences);
        if (d.sequenceEnrollments)
          setSequenceEnrollments(d.sequenceEnrollments);
        if (d.inventory) setInventory(d.inventory);
        if (d.salesGoals) setSalesGoals(d.salesGoals);
        if (d.auditLog) setAuditLog(d.auditLog);
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
  function generateBuyersOrder() {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const customerName = desk.customerId
      ? getCustomerName(Number(desk.customerId))
      : "Customer";
    const vehicleName =
      [desk.year, desk.make, desk.model, desk.trim].filter(Boolean).join(" ") ||
      "Vehicle";
    const dealerName = currentDealership?.name ?? "AutoSuite Dealership";
    const today = new Date().toLocaleDateString();

    const pageW = doc.internal.pageSize.getWidth();
    let y = 48;

    // Header bar
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageW, 36, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(dealerName, 40, 24);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Buyer's Order · ${today}`, pageW - 40, 24, { align: "right" });

    y = 58;
    doc.setTextColor(15, 23, 42);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("BUYER'S ORDER", 40, y);
    y += 28;

    // Customer + Vehicle
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Buyer: ${customerName}`, 40, y);
    doc.text(`Vehicle: ${vehicleName}`, 40, y + 16);
    if (desk.stockNumber) doc.text(`Stock #: ${desk.stockNumber}`, 40, y + 32);
    y += 56;

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(40, y, pageW - 40, y);
    y += 16;

    // Line items helper
    const col1 = 40;
    const col2 = pageW - 40;
    const lineH = 20;

    const drawLine = (label: string, value: string, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(11);
      doc.setTextColor(bold ? 15 : 71, bold ? 23 : 85, bold ? 42 : 105);
      doc.text(label, col1, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(value, col2, y, { align: "right" });
      y += lineH;
    };

    const fmt = (n: number) =>
      `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(99, 102, 241);
    doc.text("VEHICLE PRICING", col1, y);
    y += lineH;

    drawLine("MSRP", fmt(deskNumbers.msrp));
    drawLine("Selling Price", fmt(deskNumbers.selling));
    if (deskNumbers.discount !== 0)
      drawLine(
        `Discount ${deskNumbers.discount > 0 ? "(below MSRP)" : "(over MSRP)"}`,
        `${deskNumbers.discount > 0 ? "-" : "+"}${fmt(deskNumbers.discount)}`,
      );

    if (
      desk.tradeYear ||
      desk.tradeMake ||
      parseFloat(desk.tradeACV || "0") > 0
    ) {
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(99, 102, 241);
      doc.text("TRADE-IN", col1, y);
      y += lineH;
      const tradeName =
        [desk.tradeYear, desk.tradeMake, desk.tradeModel]
          .filter(Boolean)
          .join(" ") || "Trade Vehicle";
      drawLine(tradeName + " ACV", fmt(parseFloat(desk.tradeACV || "0")));
      if (parseFloat(desk.tradePayoff || "0") > 0)
        drawLine(
          "Trade Payoff",
          `-${fmt(parseFloat(desk.tradePayoff || "0"))}`,
        );
      drawLine(
        "Trade Equity",
        `${deskNumbers.equity >= 0 ? "+" : "-"}${fmt(deskNumbers.equity)}`,
      );
    }

    if (deskNumbers.fiItems.length > 0) {
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(99, 102, 241);
      doc.text("F&I PRODUCTS", col1, y);
      y += lineH;
      deskNumbers.fiItems.forEach((item) =>
        drawLine(item.name, fmt(item.price)),
      );
    }

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(99, 102, 241);
    doc.text("FEES & TAXES", col1, y);
    y += lineH;

    if (parseFloat(desk.docFee || "0") > 0)
      drawLine("Documentary Fee", fmt(parseFloat(desk.docFee || "0")));
    if (parseFloat(desk.titleFee || "0") > 0)
      drawLine("Title Fee", fmt(parseFloat(desk.titleFee || "0")));
    if (parseFloat(desk.regFee || "0") > 0)
      drawLine("Registration Fee", fmt(parseFloat(desk.regFee || "0")));
    drawLine(`Sales Tax (${desk.taxRate}%)`, fmt(deskNumbers.salesTax));

    if (parseFloat(desk.downPayment || "0") > 0) {
      y += 8;
      drawLine("Down Payment", `-${fmt(parseFloat(desk.downPayment || "0"))}`);
    }
    if (parseFloat(desk.rebate || "0") > 0) {
      drawLine("Rebate", `-${fmt(parseFloat(desk.rebate || "0"))}`);
    }

    // Divider
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(40, y, pageW - 40, y);
    y += 16;

    // Amount Financed
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Amount Financed", col1, y);
    doc.setTextColor(99, 102, 241);
    doc.text(fmt(Math.max(0, deskNumbers.financed)), col2, y, {
      align: "right",
    });
    y += lineH + 4;

    // Payment summary box
    doc.setFillColor(245, 243, 255);
    doc.roundedRect(40, y, pageW - 80, 54, 8, 8, "F");
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${desk.termMonths} months · ${desk.apr}% APR${desk.lender ? ` · ${desk.lender}` : ""}`,
      pageW / 2,
      y + 18,
      { align: "center" },
    );
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Est. Monthly Payment: $${deskNumbers.monthly > 0 ? deskNumbers.monthly.toFixed(2) : "—"}`,
      pageW / 2,
      y + 42,
      { align: "center" },
    );
    y += 70;

    // Signature lines
    y += 16;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    const sigY = y + 40;
    doc.line(40, sigY, 260, sigY);
    doc.line(pageW - 260, sigY, pageW - 40, sigY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Buyer Signature / Date", 40, sigY + 14);
    doc.text("Finance Manager / Date", pageW - 260, sigY + 14);

    // Disclaimer
    y = sigY + 36;
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "This document is an estimate only. Final terms, taxes, fees, and payments are subject to lender approval and state regulations.",
      40,
      y,
      { maxWidth: pageW - 80 },
    );

    doc.save(
      `buyers-order-${customerName.replace(/\s/g, "-")}-${today.replace(/\//g, "-")}.pdf`,
    );
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
      const dealership = (data.dealership as DealershipBranding) || null;
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
      if (dealership) {
        setCurrentDealership(dealership);
        localStorage.setItem("crm-dealership", JSON.stringify(dealership));
        applyDealerBranding(dealership);
      }
      const boot = await apiFetch(`${API_BASE}/api/bootstrap`);
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
    localStorage.removeItem("crm-dealership");
    setCurrentUser(null);
    setCurrentDealership(null);
    applyDealerBranding(null);
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
      const res = await apiFetch(
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
        const res = await apiFetch(
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
        const res = await apiFetch(`${API_BASE}/api/customers`, {
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
        autoEnrollOnStatusChange(created.id, "lead_created");
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
    autoEnrollOnStatusChange(customer.id, "appointment_set");

    try {
      await apiFetch(`${API_BASE}/api/customers/${customer.id}`, {
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
      await apiFetch(`${API_BASE}/api/customers/${customer.id}`, {
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
      const res = await apiFetch(`${API_BASE}/api/customers/${id}`, {
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

  async function autoEnrollOnStatusChange(
    customerId: number,
    trigger: EmailSequence["triggerEvent"],
  ) {
    const matching = emailSequences.filter(
      (s) => s.active && s.triggerEvent === trigger,
    );
    for (const seq of matching) {
      const alreadyActive = sequenceEnrollments.some(
        (e) =>
          e.customerId === customerId &&
          e.sequenceId === seq.id &&
          e.status === "active",
      );
      if (alreadyActive) continue;
      try {
        const res = await apiFetch(`${API_BASE}/api/sequence-enrollments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId, sequenceId: seq.id }),
        });
        if (res.ok) {
          const enroll = await res.json();
          setSequenceEnrollments((prev) => [enroll, ...prev]);
        }
      } catch {
        /* silent — auto-enroll is best-effort */
      }
    }
  }

  async function assignLead(customer: Customer, assignedTo: string) {
    try {
      const res = await apiFetch(`${API_BASE}/api/customers/${customer.id}`, {
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
      const res = await apiFetch(`${API_BASE}/api/finance-applications`, {
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
      const res = await apiFetch(
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
      const res = await apiFetch(
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
      const res = await apiFetch(`${API_BASE}/api/trade-ins`, {
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
      const res = await apiFetch(`${API_BASE}/api/vehicle-sales`, {
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
      const res = await apiFetch(`${API_BASE}/api/vehicle-sales/${id}/stage`, {
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
    if (stage === "Lost") {
      const sale = vehicleSales.find((s) => s.id === id);
      if (sale) autoEnrollOnStatusChange(sale.customerId, "deal_lost");
    }
  }

  // ── Activity ──────────────────────────────────────────────────────────────

  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityForm.note) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/activities`, {
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
      const res = await apiFetch(`${API_BASE}/api/activities`, {
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
      const res = await apiFetch(`${API_BASE}/api/activities`, {
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
      const res = await apiFetch(`${API_BASE}/api/tasks`, {
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
    const res = await apiFetch(
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
      const noteRes = await apiFetch(`${API_BASE}/api/activities`, {
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
      const res = await apiFetch(`${API_BASE}/api/tasks/${task.id}`, {
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
      const res = await apiFetch(`${API_BASE}/api/tasks/${task.id}/complete`, {
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
      const res = await apiFetch(`${API_BASE}/api/messages`, {
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
      const res = await apiFetch(`${API_BASE}/api/vin/${vin}`);
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
      const res = await apiFetch(`${API_BASE}/api/vin/${vinStr}`);
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
        const bvRes = await apiFetch(`${API_BASE}/api/book-value?${bvParams}`);
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
                        placeholder="Driver license / ID number"
                        value={creditForm.driverLicenseNumber}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            driverLicenseNumber: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Driver license state"
                        value={creditForm.driverLicenseState}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            driverLicenseState: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Driver license expiration"
                        value={creditForm.driverLicenseExpiration}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            driverLicenseExpiration: e.target.value,
                          })
                        }
                      />
                      <h3 className="form-section-title">Residence</h3>
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
                        placeholder="Employer address"
                        value={creditForm.employerAddress}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            employerAddress: e.target.value,
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
                      <input
                        placeholder="Vehicle VIN"
                        value={creditForm.vehicleVin}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            vehicleVin: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Vehicle mileage"
                        value={creditForm.vehicleMileage}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            vehicleMileage: e.target.value,
                          })
                        }
                      />
                      <h3 className="form-section-title">Insurance & Trade</h3>
                      <input
                        placeholder="Insurance provider"
                        value={creditForm.insuranceProvider}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            insuranceProvider: e.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Insurance policy / binder number"
                        value={creditForm.insurancePolicyNumber}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            insurancePolicyNumber: e.target.value,
                          })
                        }
                      />
                      <select
                        value={creditForm.tradeTitleStatus}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            tradeTitleStatus: e.target.value,
                          })
                        }
                      >
                        <option>Not Applicable</option>
                        <option>Needed</option>
                        <option>Received</option>
                      </select>
                      <select
                        value={creditForm.tradeRegistrationStatus}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            tradeRegistrationStatus: e.target.value,
                          })
                        }
                      >
                        <option>Not Applicable</option>
                        <option>Needed</option>
                        <option>Received</option>
                      </select>
                      <select
                        value={creditForm.submissionPlatform}
                        onChange={(e) =>
                          setCreditForm({
                            ...creditForm,
                            submissionPlatform: e.target.value,
                          })
                        }
                      >
                        <option>Internal CRM</option>
                        <option>Dealertrack</option>
                        <option>RouteOne</option>
                        <option>CUDL</option>
                        <option>FEX DMS</option>
                      </select>
                      <h3 className="form-section-title">Required Docs</h3>
                      {[
                        ["identityDocsReceived", "Photo ID received"],
                        ["incomeDocsReceived", "Income docs received"],
                        ["residenceDocsReceived", "Residence docs received"],
                        ["insuranceDocsReceived", "Insurance binder received"],
                        [
                          "tradeDocsReceived",
                          "Trade title/registration received",
                        ],
                      ].map(([field, label]) => (
                        <label className="checkbox-field" key={field}>
                          <input
                            type="checkbox"
                            checked={Boolean(
                              creditForm[field as keyof typeof creditForm],
                            )}
                            onChange={(e) =>
                              setCreditForm({
                                ...creditForm,
                                [field]: e.target.checked,
                              })
                            }
                          />
                          {label}
                        </label>
                      ))}
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
                          <small>
                            {app.submissionPlatform || "Internal CRM"} ·{" "}
                            {app.requestedVehicle || "No vehicle selected"}
                            {app.vehicleVin ? ` · VIN ${app.vehicleVin}` : ""}
                          </small>
                          <small>
                            Insurance: {app.insuranceProvider || "Needed"} ·
                            Trade title: {app.tradeTitleStatus || "N/A"} ·
                            Registration: {app.tradeRegistrationStatus || "N/A"}
                          </small>
                          <small>
                            Docs: ID {app.identityDocsReceived ? "✓" : "—"} ·
                            Income {app.incomeDocsReceived ? "✓" : "—"} ·
                            Residence {app.residenceDocsReceived ? "✓" : "—"} ·
                            Insurance {app.insuranceDocsReceived ? "✓" : "—"} ·
                            Trade {app.tradeDocsReceived ? "✓" : "—"}
                          </small>
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
    { page: "pipeline", label: "Pipeline", icon: <TrendingUp size={16} /> },
    {
      page: "fi-manager",
      label: "F&I Manager",
      icon: <Landmark size={16} />,
      badge:
        vehicleSales.filter(
          (s) =>
            s.stage === "Finance" && (s.stips ?? []).some((st) => !st.received),
        ).length || undefined,
    },
    { page: "trades", label: "Trade-Ins", icon: <ArrowLeftRight size={16} /> },
    { page: "vin", label: "VIN Lookup", icon: <Search size={16} /> },
    { page: "activities", label: "Activities", icon: <Activity size={16} /> },
    { page: "desk", label: "Desk Tool", icon: <Calculator size={16} /> },
    { page: "service", label: "Service", icon: <Wrench size={16} /> },
    {
      page: "comms",
      label: "Comms",
      icon: <MessageSquare size={16} />,
      badge:
        messages.filter(
          (m) => m.direction === "Inbound" && m.status === "received",
        ).length || undefined,
    },
    { page: "inventory", label: "Inventory", icon: <Warehouse size={16} /> },
    { page: "reports", label: "Reports", icon: <BarChart2 size={16} /> },
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
            {currentDealership && (
              <div
                style={{
                  background: "var(--dealer-primary, #1a1a2e)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 18 }}>🏢</span>
                <div>
                  <strong>{currentDealership.name}</strong>
                  {currentDealership.brand && (
                    <span style={{ opacity: 0.75, marginLeft: 6 }}>
                      — {currentDealership.brand}
                    </span>
                  )}
                  <div style={{ opacity: 0.65, fontSize: 11, marginTop: 1 }}>
                    {currentUser?.role} · Rooftop #{currentDealership.id}
                  </div>
                </div>
              </div>
            )}
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
            {currentDealership?.logoUrl ? (
              <img
                src={currentDealership.logoUrl}
                alt={currentDealership.name}
                className="brand-logo"
                style={{ height: 32, width: "auto", objectFit: "contain" }}
              />
            ) : (
              <div className="brand-mark">AS</div>
            )}
            <div className="brand-name">
              <strong>{currentDealership?.name ?? "AutoSuite"}</strong>
              <span>
                {currentDealership?.brand ? currentDealership.brand : "CRM"}
              </span>
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
                serviceEquityTargets.length > 0 ||
                equityMiningTargets.length > 0) && (
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
                      <h2>Service Equity Signals</h2>
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

                  {equityMiningTargets.length > 0 && (
                    <article className="panel equity-mining-panel">
                      <p className="eyebrow equity-mine-eye">
                        🔑 Equity Mining
                      </p>
                      <h2>Upgrade Opportunities</h2>
                      <p className="panel-note">
                        Sold customers estimated to have positive equity — ready
                        for a trade-up call.
                      </p>
                      <div className="lead-list">
                        {equityMiningTargets.map(
                          ({
                            customer,
                            sale,
                            yearsOwned,
                            estimatedACV,
                            remainingBalance,
                            equity,
                          }) => (
                            <div
                              className="lead-card equity-mine-card"
                              key={sale.id}
                            >
                              <div>
                                <strong
                                  className="profile-link-name"
                                  onClick={() => openProfile(customer)}
                                >
                                  {customer.firstName} {customer.lastName}
                                </strong>
                                <span>
                                  {sale.year} {sale.make} {sale.model} ·{" "}
                                  {yearsOwned}yr owned
                                </span>
                                <small className="equity-mine-numbers">
                                  ACV ~${estimatedACV.toLocaleString()} · Owed
                                  ~$
                                  {remainingBalance.toLocaleString()} ·{" "}
                                  <span className="equity-positive">
                                    +${equity.toLocaleString()} equity
                                  </span>
                                </small>
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  className="open-btn"
                                  onClick={() => openProfile(customer)}
                                >
                                  Profile
                                </button>
                                <button
                                  type="button"
                                  className="open-btn"
                                  style={{
                                    background: "#6366f1",
                                    color: "#fff",
                                  }}
                                  onClick={() => {
                                    setCommsCustomerId(customer.id);
                                    setCommsTab("inbox");
                                    setCommsChannel("Text");
                                    setCommsBody(
                                      `Hi ${customer.firstName}, it's ${currentUser?.name ?? "your dealer"}! Based on current market conditions, your ${sale.year} ${sale.make} ${sale.model} may have significant equity. Would you be open to exploring an upgrade? No pressure — just wanted to reach out!`,
                                    );
                                    navigate("comms");
                                  }}
                                >
                                  📱 Text
                                </button>
                              </div>
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

          {/* ── FINANCE (removed — content merged into F&I Manager) */}
          {false && (
            <>
              <header className="page-header">
                <div>
                  <p className="eyebrow">F&I Portal</p>
                  <h1>Finance Command Center</h1>
                  <p className="page-subtitle">
                    Track credit apps, lender submissions, documents, trade
                    equity, desking scenarios, and F&I product opportunities in
                    one mobile-first workflow.
                  </p>
                </div>
                <div className="header-actions">
                  <button
                    type="button"
                    onClick={() => {
                      const customer = customers[0];
                      if (customer) {
                        openProfile(customer);
                        setProfileTab("credit");
                      }
                    }}
                  >
                    Start Credit App
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      window.location.hash = "#/desk";
                    }}
                  >
                    Open Desk Tool
                  </button>
                </div>
              </header>
              <div className="finance-portal-steps">
                {[
                  ["1", "Info", "Credit app + identity"],
                  ["2", "Trade", "Equity + payoff"],
                  ["3", "Finance", "Lender decisioning"],
                  ["4", "Sign", "Docs + delivery"],
                ].map(([step, title, detail]) => (
                  <div className="finance-step-card" key={step}>
                    <strong>{step}</strong>
                    <span>{title}</span>
                    <small>{detail}</small>
                  </div>
                ))}
              </div>
              <div className="kpi-grid finance-kpi-grid">
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
                <div className="kpi-card kpi-purple">
                  <span>Credit Packets</span>
                  <strong>{creditApplications.length}</strong>
                </div>
              </div>
              <div className="finance-portal-grid">
                <section className="finance-portal-panel">
                  <div className="section-heading-row">
                    <div>
                      <p className="card-label">Lender Queue</p>
                      <h2>Applications Awaiting Decision</h2>
                    </div>
                    <span className="finance-secure-badge">Secure F&I</span>
                  </div>
                  <div className="deal-list">
                    {financeApplications.length === 0 && (
                      <p className="empty-state">
                        No finance applications yet. Open a customer deal jacket
                        to submit one.
                      </p>
                    )}
                    {financeApplications.map((app) => (
                      <div
                        className="deal-card clickable finance-app-card"
                        key={app.id}
                        onClick={() => {
                          const c = customers.find(
                            (x) => x.id === app.customerId,
                          );
                          if (c) openProfile(c);
                        }}
                      >
                        <div className="deal-card-main">
                          <strong>
                            {app.applicantName ||
                              getCustomerName(app.customerId)}
                          </strong>
                          <span>
                            {app.requestedVehicle || "Vehicle not selected"} ·{" "}
                            {app.creditRange || "Pending bureau"}
                          </span>
                          <span>
                            ${app.monthlyIncome.toLocaleString()}/mo income · $
                            {app.downPayment.toLocaleString()} down
                          </span>
                          <small>
                            Lender: {app.lender || "Not routed"} · Platform:
                            Internal CRM
                          </small>
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
                </section>
                <aside className="finance-portal-panel">
                  <p className="card-label">Portal Tools</p>
                  <div className="finance-tool-list">
                    <div>
                      <strong>Instant Credit App</strong>
                      <span>
                        Capture identity, income, residence, and consent.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const customer = customers[0];
                          if (customer) {
                            openProfile(customer);
                            setProfileTab("credit");
                          }
                        }}
                      >
                        Launch App
                      </button>
                    </div>
                    <div>
                      <strong>Digital Docs</strong>
                      <span>
                        ID, pay stubs, proof of insurance, residence docs.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const customer = customers[0];
                          if (customer) {
                            openProfile(customer);
                            setProfileTab("credit");
                          }
                        }}
                      >
                        Review Docs
                      </button>
                    </div>
                    <div>
                      <strong>Desking + What-Ifs</strong>
                      <span>
                        Use Desk Tool for rates, terms, down, taxes, and F&I.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = "#/desk";
                        }}
                      >
                        Desk Deal
                      </button>
                    </div>
                    <div>
                      <strong>Trade Equity</strong>
                      <span>
                        VIN decode, value estimate, payoff, equity applied.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const customer = customers[0];
                          if (customer) {
                            openProfile(customer);
                            setProfileTab("deals");
                          }
                        }}
                      >
                        View Trades
                      </button>
                    </div>
                  </div>
                </aside>
                <section className="finance-portal-panel">
                  <p className="card-label">Credit Packets</p>
                  <div className="deal-list">
                    {creditApplications.length === 0 ? (
                      <p className="empty-state">
                        No full credit packets submitted yet.
                      </p>
                    ) : (
                      creditApplications.slice(0, 5).map((app) => (
                        <div className="deal-card" key={app.id}>
                          <strong>{app.applicantName}</strong>
                          <span>
                            {app.submissionPlatform || "Internal CRM"} ·{" "}
                            {app.requestedVehicle || "No vehicle"}
                          </span>
                          <small>
                            Docs: ID {app.identityDocsReceived ? "✓" : "—"} ·
                            Income {app.incomeDocsReceived ? "✓" : "—"} ·
                            Insurance {app.insuranceDocsReceived ? "✓" : "—"}
                          </small>
                          <button
                            type="button"
                            onClick={() => {
                              const c = customers.find(
                                (item) => item.id === app.customerId,
                              );
                              if (c) {
                                openProfile(c);
                                setProfileTab("credit");
                              }
                            }}
                          >
                            Open Packet
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
                <section className="finance-portal-panel">
                  <p className="card-label">Menu Selling</p>
                  <div className="finance-product-grid">
                    {[
                      "GAP",
                      "Warranty",
                      "Tire & Wheel",
                      "Paint Protection",
                    ].map((product) => (
                      <div className="finance-product-card" key={product}>
                        <strong>{product}</strong>
                        <span>Show payment impact in Desk Tool</span>
                        <button
                          type="button"
                          onClick={() => {
                            window.location.hash = "#/desk";
                          }}
                        >
                          Add in Desk
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
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

              {/* ── Lender Response Status Board ── */}
              <article className="panel" style={{ marginTop: 24 }}>
                <p className="eyebrow">Finance</p>
                <h2>Lender Response Board</h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 16,
                  }}
                >
                  Track every deal's lender submission status in one view.
                </p>
                {(() => {
                  const activeDeals = vehicleSales.filter(
                    (s) => s.stage !== "Lost" && s.stage !== "Delivered",
                  );
                  if (activeDeals.length === 0)
                    return <p className="empty-state">No active deals.</p>;
                  return (
                    <div className="lender-board">
                      {activeDeals.map((deal) => {
                        const cust = customers.find(
                          (c) => c.id === deal.customerId,
                        );
                        const subs = deal.lenderSubmissions ?? [];
                        const statusColor: Record<string, string> = {
                          Approved: "#22c55e",
                          Countered: "#f59e0b",
                          Declined: "#ef4444",
                          Pending: "#6366f1",
                        };
                        return (
                          <div key={deal.id} className="lender-board-row">
                            <div className="lender-board-vehicle">
                              <strong>
                                {deal.year} {deal.make} {deal.model}
                              </strong>
                              <small>
                                {cust
                                  ? `${cust.firstName} ${cust.lastName}`
                                  : "—"}{" "}
                                · #{deal.stockNumber}
                              </small>
                            </div>
                            {subs.length === 0 ? (
                              <span className="lender-no-subs">
                                No submissions yet
                              </span>
                            ) : (
                              <div className="lender-subs-list">
                                {subs.map((sub, i) => (
                                  <div key={i} className="lender-sub-chip">
                                    <span className="lender-sub-name">
                                      {sub.lenderName}
                                    </span>
                                    <span
                                      className="lender-sub-status"
                                      style={{
                                        color:
                                          statusColor[sub.status] ??
                                          "var(--text-muted)",
                                      }}
                                    >
                                      {sub.status}
                                    </span>
                                    {sub.approvedAmount && (
                                      <span className="lender-sub-amount">
                                        ${sub.approvedAmount.toLocaleString()}
                                      </span>
                                    )}
                                    {sub.apr && (
                                      <span className="lender-sub-apr">
                                        {sub.apr}% / {sub.termMonths}mo
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {deal.acceptedSubmissionId && (
                              <span className="lender-accepted-badge">
                                ✓ Lender Accepted
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </article>

              {/* ── Deal Jacket / Document Checklist ── */}
              <article className="panel" style={{ marginTop: 24 }}>
                <p className="eyebrow">Compliance</p>
                <h2>Deal Jacket Checklist</h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 16,
                  }}
                >
                  Standard document checklist for every deal. Track what's
                  collected per vehicle sale.
                </p>
                {(() => {
                  const activeDeals = vehicleSales.filter(
                    (s) => s.stage !== "Lost",
                  );
                  if (activeDeals.length === 0)
                    return <p className="empty-state">No active deals.</p>;
                  const stdDocs = [
                    "Credit Application",
                    "Driver's License (front & back)",
                    "Proof of Insurance",
                    "Pay Stubs (2 most recent)",
                    "Buyer's Order",
                    "Retail Installment Contract",
                    "OFAC / Red Flags Cleared",
                    "Truth in Lending Disclosure",
                    "Trade Title (if applicable)",
                  ];
                  return (
                    <div className="deal-jacket-list">
                      {activeDeals.map((deal) => {
                        const cust = customers.find(
                          (c) => c.id === deal.customerId,
                        );
                        const checked: Record<string, boolean> = {
                          "Credit Application": true,
                          "Driver's License (front & back)": true,
                          "Buyer's Order": !!deal.stage,
                          "OFAC / Red Flags Cleared": !!(
                            deal.ofacCleared && deal.redFlagsCleared
                          ),
                          "Truth in Lending Disclosure":
                            !!deal.truthInLendingPrinted,
                          "Retail Installment Contract": !!deal.eContractSigned,
                        };
                        const doneCount = stdDocs.filter(
                          (d) => checked[d],
                        ).length;
                        return (
                          <div key={deal.id} className="deal-jacket-card">
                            <div className="deal-jacket-header">
                              <div>
                                <strong>
                                  {deal.year} {deal.make} {deal.model}
                                </strong>
                                <small>
                                  {" "}
                                  ·{" "}
                                  {cust
                                    ? `${cust.firstName} ${cust.lastName}`
                                    : "—"}{" "}
                                  · {deal.stage}
                                </small>
                              </div>
                              <span className="deal-jacket-progress">
                                {doneCount}/{stdDocs.length} docs
                              </span>
                            </div>
                            <div className="deal-jacket-docs">
                              {stdDocs.map((doc) => (
                                <div
                                  key={doc}
                                  className={`deal-jacket-doc${checked[doc] ? " done" : ""}`}
                                >
                                  <span>{checked[doc] ? "✓" : "○"}</span>
                                  <span>{doc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </article>

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
                    onClick={generateBuyersOrder}
                    disabled={!deskNumbers.selling && !desk.make && !desk.year}
                    title={
                      !deskNumbers.selling && !desk.make && !desk.year
                        ? "Enter vehicle info first"
                        : "Download PDF buyer's order"
                    }
                  >
                    📄 Buyer's Order PDF
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

              {/* Mode Tabs */}
              <div className="desk-mode-tabs">
                {(["retail", "lease", "compare"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`desk-mode-tab${deskMode === m ? " active" : ""}`}
                    onClick={() => setDeskMode(m)}
                  >
                    {m === "retail"
                      ? "Retail Finance"
                      : m === "lease"
                        ? "Lease"
                        : "Lease vs. Buy"}
                  </button>
                ))}
              </div>

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

                  {/* Lease Inputs — only shown in lease/compare mode */}
                  {(deskMode === "lease" || deskMode === "compare") && (
                    <div className="desk-section">
                      <p className="desk-section-title">Lease Parameters</p>
                      <div className="desk-row">
                        <div className="desk-field">
                          <label>Residual %</label>
                          <input
                            placeholder="52"
                            value={leaseDesk.residualPct}
                            onChange={(e) =>
                              setLeaseDesk({
                                ...leaseDesk,
                                residualPct: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="desk-field">
                          <label>Money Factor</label>
                          <input
                            placeholder="0.00125"
                            value={leaseDesk.moneyFactor}
                            onChange={(e) =>
                              setLeaseDesk({
                                ...leaseDesk,
                                moneyFactor: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="desk-field">
                          <label>Lease Term (mo)</label>
                          <select
                            value={leaseDesk.termMonths}
                            onChange={(e) =>
                              setLeaseDesk({
                                ...leaseDesk,
                                termMonths: e.target.value,
                              })
                            }
                          >
                            <option>24</option>
                            <option>27</option>
                            <option>36</option>
                            <option>39</option>
                            <option>42</option>
                            <option>48</option>
                          </select>
                        </div>
                        <div className="desk-field">
                          <label>Acquisition Fee ($)</label>
                          <input
                            value={leaseDesk.acquisition}
                            onChange={(e) =>
                              setLeaseDesk({
                                ...leaseDesk,
                                acquisition: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="desk-field">
                          <label>Disposition Fee ($)</label>
                          <input
                            value={leaseDesk.disposition}
                            onChange={(e) =>
                              setLeaseDesk({
                                ...leaseDesk,
                                disposition: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="desk-field desk-computed">
                          <label>Residual Value</label>
                          <span>
                            $
                            {leaseNumbers.residual > 0
                              ? leaseNumbers.residual.toLocaleString(
                                  undefined,
                                  { maximumFractionDigits: 0 },
                                )
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── RIGHT: Deal Summary ── */}
                <div className="desk-summary">
                  {/* Monthly Payment — big hero number */}
                  <div className="payment-hero">
                    <p className="payment-hero-label">
                      {deskMode === "lease"
                        ? "Est. Lease Payment"
                        : "Est. Monthly Payment"}
                    </p>
                    <strong className="payment-hero-amount">
                      {deskMode === "lease"
                        ? leaseNumbers.monthly > 0
                          ? `$${leaseNumbers.monthly.toFixed(2)}`
                          : "$—"
                        : deskNumbers.monthly > 0
                          ? `$${deskNumbers.monthly.toFixed(2)}`
                          : "$—"}
                    </strong>
                    <p className="payment-hero-sub">
                      {deskMode === "lease"
                        ? `${leaseNumbers.term} mo lease · MF ${leaseDesk.moneyFactor} · ${leaseDesk.residualPct}% residual`
                        : `${desk.termMonths} mo · ${desk.apr}% APR${desk.lender ? ` · ${desk.lender}` : ""}`}
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

                  {/* Lease vs. Buy comparison table */}
                  {deskMode === "compare" && (
                    <div className="deal-breakdown">
                      <p className="desk-section-title">
                        Lease vs. Buy Comparison
                      </p>
                      <table className="lease-summary-table">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th>Lease ({leaseNumbers.term} mo)</th>
                            <th>Finance ({desk.termMonths} mo)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="highlight">
                            <td>Monthly Payment</td>
                            <td>
                              $
                              {leaseNumbers.monthly > 0
                                ? leaseNumbers.monthly.toFixed(2)
                                : "—"}
                            </td>
                            <td>
                              $
                              {deskNumbers.monthly > 0
                                ? deskNumbers.monthly.toFixed(2)
                                : "—"}
                            </td>
                          </tr>
                          <tr>
                            <td>Due at Signing</td>
                            <td>
                              $
                              {(
                                parseFloat(desk.downPayment) || 0
                              ).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                            <td>
                              $
                              {(
                                parseFloat(desk.downPayment) || 0
                              ).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                          <tr>
                            <td>Total Cost</td>
                            <td>
                              $
                              {leaseNumbers.totalCost > 0
                                ? leaseNumbers.totalCost.toLocaleString(
                                    undefined,
                                    { maximumFractionDigits: 0 },
                                  )
                                : "—"}
                            </td>
                            <td>
                              $
                              {leaseNumbers.retailTotal > 0
                                ? leaseNumbers.retailTotal.toLocaleString(
                                    undefined,
                                    { maximumFractionDigits: 0 },
                                  )
                                : "—"}
                            </td>
                          </tr>
                          <tr>
                            <td>Residual / Equity</td>
                            <td>
                              $
                              {leaseNumbers.residual > 0
                                ? leaseNumbers.residual.toLocaleString(
                                    undefined,
                                    { maximumFractionDigits: 0 },
                                  )
                                : "—"}{" "}
                              (buyout)
                            </td>
                            <td>Own outright</td>
                          </tr>
                          <tr>
                            <td>Mileage Limit</td>
                            <td>12k–15k/yr</td>
                            <td>Unlimited</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Lease breakdown (lease mode only) */}
                  {deskMode === "lease" && leaseNumbers.monthly > 0 && (
                    <div className="deal-breakdown">
                      <p className="desk-section-title">Lease Breakdown</p>
                      <table className="lease-summary-table">
                        <tbody>
                          <tr>
                            <td>Adjusted Cap Cost</td>
                            <td>
                              $
                              {leaseNumbers.adjCap.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                          <tr>
                            <td>Residual Value</td>
                            <td>
                              $
                              {leaseNumbers.residual.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                          <tr>
                            <td>Depreciation / mo</td>
                            <td>${leaseNumbers.depreciation.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>Rent Charge / mo</td>
                            <td>${leaseNumbers.rentCharge.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>Base Payment</td>
                            <td>${leaseNumbers.basePmt.toFixed(2)}</td>
                          </tr>
                          <tr className="highlight">
                            <td>Monthly w/ Tax</td>
                            <td>${leaseNumbers.monthly.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>Total Lease Cost</td>
                            <td>
                              $
                              {leaseNumbers.totalCost.toLocaleString(
                                undefined,
                                { maximumFractionDigits: 0 },
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

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

              {/* ── Gross / Reserve Calculator ── */}
              <article className="panel" style={{ marginTop: 24 }}>
                <p className="eyebrow">F&I Management</p>
                <h2>Gross &amp; Reserve Calculator</h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 16,
                  }}
                >
                  Calculate front-end gross, back-end gross, dealer reserve, and
                  total profit on any deal.
                </p>
                {(() => {
                  const selling = parseFloat(desk.sellingPrice) || 0;
                  const invoice = parseFloat(desk.msrp) || 0;
                  const holdback = invoice * 0.03;
                  const floorplan = invoice * 0.005;
                  const frontGross = selling - invoice + holdback - floorplan;
                  const backGross = deskNumbers.fiTotal ?? 0;
                  const financed = Math.max(0, deskNumbers.financed);
                  const aprDec = (parseFloat(desk.apr) || 0) / 100;
                  const term = parseInt(desk.termMonths) || 72;
                  const buyRate = Math.max(0, aprDec - 0.02);
                  const reserveRate = aprDec - buyRate;
                  const reserveEst =
                    financed > 0 && term > 0
                      ? (financed * reserveRate * term) / 12 / 2
                      : 0;
                  const totalGross = frontGross + backGross + reserveEst;
                  return (
                    <div className="gross-calc-grid">
                      {[
                        [
                          "Invoice / Pack Base",
                          `$${invoice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                        ],
                        [
                          "Holdback (3%)",
                          `+$${holdback.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                        ],
                        [
                          "Floorplan Cost (~0.5%)",
                          `-$${floorplan.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                        ],
                        [
                          "Front-End Gross",
                          `$${frontGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                          frontGross >= 0 ? "gross-pos" : "gross-neg",
                        ],
                        [
                          "Back-End / F&I Gross",
                          `$${backGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                          "gross-pos",
                        ],
                        [
                          "Est. Dealer Reserve",
                          `$${reserveEst.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                          "gross-pos",
                        ],
                        [
                          "Total Gross Profit",
                          `$${totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                          totalGross >= 0 ? "gross-total-pos" : "gross-neg",
                        ],
                      ].map(([label, val, cls]) => (
                        <div
                          key={String(label)}
                          className={`gross-calc-row${cls ? ` ${cls}` : ""}`}
                        >
                          <span>{label}</span>
                          <strong>{val}</strong>
                        </div>
                      ))}
                      <p className="gross-calc-note">
                        Reserve estimated at buy rate +2% spread, 50%
                        participation. Holdback/floorplan are approximations.
                      </p>
                    </div>
                  );
                })()}
              </article>
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

          {/* ── F&I MANAGER ──────────────────────────────────────── */}
          {currentPage === "fi-manager" &&
            (() => {
              const fiDeals = vehicleSales.filter((s) => s.stage !== "Working");
              const totalReserve = fiDeals.reduce(
                (sum, s) => sum + (s.dealerReserve ?? 0),
                0,
              );
              const totalFiRevenue = fiDeals.reduce(
                (sum, s) =>
                  sum +
                  (s.fiProducts ?? []).reduce((ps, p) => ps + p.retailPrice, 0),
                0,
              );
              const totalFiGross = fiDeals.reduce(
                (sum, s) =>
                  sum +
                  (s.fiProducts ?? []).reduce(
                    (ps, p) => ps + (p.retailPrice - p.dealerCost),
                    0,
                  ),
                0,
              );
              const pendingStipDeals = fiDeals.filter((s) =>
                (s.stips ?? []).some((st) => !st.received),
              );

              const fundingColors: Record<string, string> = {
                "Pending Structure": "#f59e0b",
                "Submitted to Lender": "#3b82f6",
                Approved: "#10b981",
                "Stipulations Required": "#ef4444",
                Funded: "#6366f1",
                Unwound: "#6b7280",
                Declined: "#dc2626",
              };

              async function saveDeal(deal: VehicleSale) {
                try {
                  const res = await apiFetch(
                    `${API_BASE}/api/vehicle-sales/${deal.id}/deal`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(deal),
                    },
                  );
                  if (res.ok) {
                    const saved = await res.json();
                    // Only sync vehicleSales list — don't overwrite activeDeal
                    // (UI already updated optimistically via setActiveDeal before this call)
                    setVehicleSales((prev) =>
                      prev.map((s) => (s.id === saved.id ? saved : s)),
                    );
                  }
                } catch {
                  setAppMessage("Could not save deal.");
                }
              }

              async function toggleStip(deal: VehicleSale, stipId: number) {
                const stips = (deal.stips ?? []).map((st) =>
                  st.id === stipId
                    ? {
                        ...st,
                        received: !st.received,
                        receivedAt: !st.received
                          ? new Date().toISOString()
                          : undefined,
                      }
                    : st,
                );
                try {
                  const res = await apiFetch(
                    `${API_BASE}/api/vehicle-sales/${deal.id}/stips`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ stips }),
                    },
                  );
                  if (res.ok) {
                    const updated = await res.json();
                    setVehicleSales((prev) =>
                      prev.map((s) => (s.id === updated.id ? updated : s)),
                    );
                    if (activeDeal?.id === deal.id) setActiveDeal(updated);
                  }
                } catch {
                  setAppMessage("Could not update stip.");
                }
              }

              async function submitToLenders(
                deal: VehicleSale,
                lenderIds: number[],
              ) {
                try {
                  const res = await apiFetch(
                    `${API_BASE}/api/vehicle-sales/${deal.id}/submit-lenders`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ lenderIds }),
                    },
                  );
                  if (res.ok) {
                    const updated = await res.json();
                    setVehicleSales((prev) =>
                      prev.map((s) => (s.id === updated.id ? updated : s)),
                    );
                    setActiveDeal(updated);
                    setSelectedLenderIds(new Set());
                    setAppMessage(
                      "Submitted to lenders. Awaiting decisions...",
                    );
                    // Poll for responses every 2s up to 15s
                    let polls = 0;
                    const interval = setInterval(async () => {
                      polls++;
                      try {
                        const r2 = await apiFetch(
                          `${API_BASE}/api/vehicle-sales/${deal.id}/deal`,
                        );
                        if (r2.ok) {
                          const fresh = await r2.json();
                          setVehicleSales((prev) =>
                            prev.map((s) => (s.id === fresh.id ? fresh : s)),
                          );
                          setActiveDeal(fresh);
                          const allDecided = (
                            fresh.lenderSubmissions ?? []
                          ).every(
                            (s: LenderSubmission) => s.status !== "Pending",
                          );
                          if (allDecided || polls >= 7) clearInterval(interval);
                        }
                      } catch {
                        clearInterval(interval);
                      }
                    }, 2000);
                  }
                } catch {
                  setAppMessage("Could not submit to lenders.");
                }
              }

              async function acceptSubmission(
                deal: VehicleSale,
                submissionId: number,
              ) {
                try {
                  const res = await apiFetch(
                    `${API_BASE}/api/vehicle-sales/${deal.id}/accept-submission`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ submissionId }),
                    },
                  );
                  if (res.ok) {
                    const updated = await res.json();
                    setVehicleSales((prev) =>
                      prev.map((s) => (s.id === updated.id ? updated : s)),
                    );
                    setActiveDeal(updated);
                    setAppMessage(
                      `Accepted: ${updated.lender} at ${updated.apr}% APR`,
                    );
                  }
                } catch {
                  setAppMessage("Could not accept submission.");
                }
              }

              const deal = activeDeal ?? fiDeals[0] ?? null;
              // Keep ref in sync so onBlur closures always see latest deal
              activeDealRef.current = deal;
              const dealCustomer = deal
                ? customers.find((c) => c.id === deal.customerId)
                : null;
              const amountFinanced = deal
                ? Math.max(
                    0,
                    deal.salePrice -
                      (deal.downPayment ?? 0) -
                      (deal.tradeAllowance ?? 0) +
                      (deal.tradePayoff ?? 0) +
                      (deal.fiProducts ?? []).reduce(
                        (s, p) => s + p.retailPrice,
                        0,
                      ),
                  )
                : 0;
              const monthlyPayment =
                deal?.apr && deal?.termMonths && amountFinanced > 0
                  ? (() => {
                      const r = deal.apr / 100 / 12;
                      return Math.round(
                        (amountFinanced * r) /
                          (1 - Math.pow(1 + r, -deal.termMonths)),
                      );
                    })()
                  : null;

              return (
                <>
                  <header className="page-header">
                    <div>
                      <h1>F&amp;I Manager</h1>
                      <p className="page-subtitle">
                        Deal structuring, funding pipeline, and product
                        management
                      </p>
                    </div>
                  </header>

                  {/* ── KPI Stats ── */}
                  <div className="fi-kpi-grid">
                    {[
                      {
                        label: "Deals in Queue",
                        value: fiDeals.length,
                        icon: <ClipboardList size={18} />,
                        bg: "#6366f118",
                        color: "#6366f1",
                      },
                      {
                        label: "Total Reserve",
                        value: `$${totalReserve.toLocaleString()}`,
                        icon: <DollarSign size={18} />,
                        bg: "#10b98118",
                        color: "#10b981",
                      },
                      {
                        label: "F&I Revenue",
                        value: `$${totalFiRevenue.toLocaleString()}`,
                        icon: <BadgeDollarSign size={18} />,
                        bg: "#3b82f618",
                        color: "#3b82f6",
                      },
                      {
                        label: "F&I Gross",
                        value: `$${totalFiGross.toLocaleString()}`,
                        icon: <TrendingUp size={18} />,
                        bg: "#f59e0b18",
                        color: "#d97706",
                      },
                      {
                        label: "Stips Pending",
                        value: pendingStipDeals.length,
                        icon: <AlertTriangle size={18} />,
                        bg:
                          pendingStipDeals.length > 0
                            ? "#ef444418"
                            : "#10b98118",
                        color:
                          pendingStipDeals.length > 0 ? "#ef4444" : "#10b981",
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="fi-kpi-card">
                        <div
                          className="fi-kpi-icon"
                          style={{ background: stat.bg, color: stat.color }}
                        >
                          {stat.icon}
                        </div>
                        <div>
                          <div className="fi-kpi-label">{stat.label}</div>
                          <div className="fi-kpi-value">{stat.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Commission Calculator ── */}
                  {(() => {
                    const commRate = 0.25; // 25% of back-end gross — typical F&I commission
                    const flatPerDeal = 150; // flat per-deal bonus
                    const backEndGrossTotal = fiDeals.reduce((sum, s) => {
                      const fiGross = (s.fiProducts ?? []).reduce(
                        (ps, p) => ps + (p.retailPrice - p.dealerCost),
                        0,
                      );
                      const reserve = s.dealerReserve ?? 0;
                      return sum + fiGross + reserve;
                    }, 0);
                    const commissionEarned =
                      backEndGrossTotal * commRate +
                      fiDeals.filter((s) => (s.fiProducts ?? []).length > 0)
                        .length *
                        flatPerDeal;
                    const deliveredDeals = fiDeals.filter(
                      (s) => s.stage === "Delivered",
                    );
                    const pvr =
                      deliveredDeals.length > 0
                        ? Math.round(backEndGrossTotal / deliveredDeals.length)
                        : 0;
                    return (
                      <div className="fi-commission-bar">
                        <div className="fi-commission-item">
                          <span className="fi-commission-label">
                            Back-End Gross
                          </span>
                          <span className="fi-commission-value">
                            ${backEndGrossTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="fi-commission-divider" />
                        <div className="fi-commission-item">
                          <span className="fi-commission-label">
                            Est. Commission
                          </span>
                          <span className="fi-commission-value green">
                            $
                            {commissionEarned.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="fi-commission-divider" />
                        <div className="fi-commission-item">
                          <span className="fi-commission-label">
                            PVR (Per Vehicle Retail)
                          </span>
                          <span className="fi-commission-value">
                            ${pvr.toLocaleString()}
                          </span>
                        </div>
                        <div className="fi-commission-divider" />
                        <div className="fi-commission-item">
                          <span className="fi-commission-label">Rate Used</span>
                          <span className="fi-commission-value muted">
                            {(commRate * 100).toFixed(0)}% + ${flatPerDeal}/deal
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="fi-layout">
                    {/* ── Deal Queue ── */}
                    <div className="fi-queue">
                      <div className="fi-queue-header">
                        Deal Queue ({fiDeals.length})
                      </div>
                      <div className="fi-queue-list">
                        {fiDeals.length === 0 && (
                          <div className="fi-queue-empty">
                            No deals in queue
                          </div>
                        )}
                        {fiDeals.map((s) => {
                          const cust = customers.find(
                            (c) => c.id === s.customerId,
                          );
                          const pendingStips = (s.stips ?? []).filter(
                            (st) => !st.received,
                          ).length;
                          const isActive =
                            activeDeal?.id === s.id ||
                            (!activeDeal && s.id === fiDeals[0]?.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                // If this deal is already active, don't clobber unsaved edits
                                if (activeDeal?.id === s.id) return;
                                setActiveDeal(s);
                                setFiPriceOverrides({});
                              }}
                              className={`fi-queue-item${isActive ? " active" : ""}`}
                            >
                              <div className="fi-queue-item-name">
                                {cust
                                  ? `${cust.firstName} ${cust.lastName}`
                                  : `Deal #${s.id}`}
                              </div>
                              <div className="fi-queue-item-vehicle">
                                {s.year} {s.make} {s.model} · #{s.stockNumber}
                              </div>
                              <div className="fi-queue-item-badges">
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 7px",
                                    borderRadius: 999,
                                    background:
                                      (fundingColors[
                                        s.fundingStatus ?? "Pending Structure"
                                      ] ?? "#94a3b8") + "22",
                                    color:
                                      fundingColors[
                                        s.fundingStatus ?? "Pending Structure"
                                      ] ?? "#94a3b8",
                                  }}
                                >
                                  {s.fundingStatus ?? "Pending Structure"}
                                </span>
                                {pendingStips > 0 && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                      background: "#ef444420",
                                      color: "#ef4444",
                                    }}
                                  >
                                    {pendingStips} stip
                                    {pendingStips > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Deal Detail ── */}
                    {deal ? (
                      <div className="fi-detail-col">
                        {/* Deal Header */}
                        <div className="fi-card">
                          <div className="fi-deal-header">
                            <div>
                              <div className="fi-deal-eyebrow">Deal</div>
                              <div className="fi-deal-name">
                                {dealCustomer
                                  ? `${dealCustomer.firstName} ${dealCustomer.lastName}`
                                  : `Deal #${deal.id}`}
                              </div>
                              <div className="fi-deal-sub">
                                {deal.year} {deal.make} {deal.model} · Stock #
                                {deal.stockNumber}
                              </div>
                            </div>
                            <select
                              className="fi-funding-select"
                              style={{
                                color:
                                  fundingColors[
                                    deal.fundingStatus ?? "Pending Structure"
                                  ],
                              }}
                              value={deal.fundingStatus ?? "Pending Structure"}
                              onChange={(e) => {
                                const updated = {
                                  ...deal,
                                  fundingStatus: e.target
                                    .value as FundingStatus,
                                };
                                setActiveDeal(updated);
                                saveDeal(updated);
                              }}
                            >
                              {(
                                [
                                  "Pending Structure",
                                  "Submitted to Lender",
                                  "Approved",
                                  "Stipulations Required",
                                  "Funded",
                                  "Unwound",
                                  "Declined",
                                ] as FundingStatus[]
                              ).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Deal Structure Grid */}
                          <div className="fi-structure-grid">
                            {[
                              {
                                label: "Sale Price",
                                field: "salePrice" as const,
                                prefix: "$",
                              },
                              {
                                label: "Down Payment",
                                field: "downPayment" as const,
                                prefix: "$",
                              },
                              {
                                label: "Trade Allowance",
                                field: "tradeAllowance" as const,
                                prefix: "$",
                              },
                              {
                                label: "Trade Payoff",
                                field: "tradePayoff" as const,
                                prefix: "$",
                              },
                              {
                                label: "APR (%)",
                                field: "apr" as const,
                                prefix: "",
                              },
                              {
                                label: "Term (months)",
                                field: "termMonths" as const,
                                prefix: "",
                              },
                              {
                                label: "Dealer Reserve",
                                field: "dealerReserve" as const,
                                prefix: "$",
                              },
                            ].map(({ label, field, prefix }) => (
                              <label
                                key={field}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                  fontSize: 12,
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: "var(--text-muted,#64748b)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    fontSize: 10,
                                  }}
                                >
                                  {label}
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    border: "1px solid var(--border,#e2e8f0)",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                  }}
                                >
                                  {prefix && (
                                    <span
                                      style={{
                                        padding: "6px 8px",
                                        background: "var(--bg,#f8fafc)",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: "var(--text-muted,#64748b)",
                                      }}
                                    >
                                      {prefix}
                                    </span>
                                  )}
                                  <input
                                    type="number"
                                    value={(deal[field] as number) ?? ""}
                                    onChange={(e) =>
                                      setActiveDeal({
                                        ...deal,
                                        [field]:
                                          e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value),
                                      })
                                    }
                                    onBlur={() => {
                                      if (activeDealRef.current)
                                        saveDeal(activeDealRef.current);
                                    }}
                                    style={{
                                      flex: 1,
                                      border: "none",
                                      padding: "6px 10px",
                                      fontSize: 13,
                                      background: "transparent",
                                      outline: "none",
                                      width: "100%",
                                    }}
                                  />
                                </div>
                              </label>
                            ))}
                            <label
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                                fontSize: 12,
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: "var(--text-muted,#64748b)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                  fontSize: 10,
                                }}
                              >
                                Lender
                              </span>
                              <div className="fi-input-wrap">
                                <input
                                  className="fi-input"
                                  value={deal.lender ?? ""}
                                  onChange={(e) =>
                                    setActiveDeal({
                                      ...deal,
                                      lender: e.target.value,
                                    })
                                  }
                                  onBlur={() => {
                                    if (activeDealRef.current)
                                      saveDeal(activeDealRef.current);
                                  }}
                                  placeholder="e.g. Ford Motor Credit"
                                />
                              </div>
                            </label>
                          </div>

                          {monthlyPayment && (
                            <div className="fi-payment-bar">
                              <div>
                                <div className="fi-payment-stat-label">
                                  Est. Payment
                                </div>
                                <div className="fi-payment-stat-value">
                                  ${monthlyPayment.toLocaleString()}/mo
                                </div>
                              </div>
                              <div>
                                <div className="fi-payment-stat-label">
                                  Amount Financed
                                </div>
                                <div className="fi-payment-stat-value">
                                  ${amountFinanced.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="fi-payment-stat-label">
                                  F&amp;I Revenue
                                </div>
                                <div className="fi-payment-stat-value green">
                                  $
                                  {(deal.fiProducts ?? [])
                                    .reduce((s, p) => s + p.retailPrice, 0)
                                    .toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="fi-payment-stat-label">
                                  F&amp;I Gross
                                </div>
                                <div className="fi-payment-stat-value amber">
                                  $
                                  {(deal.fiProducts ?? [])
                                    .reduce(
                                      (s, p) =>
                                        s + (p.retailPrice - p.dealerCost),
                                      0,
                                    )
                                    .toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* F&I Product Menu */}
                        <div className="fi-card">
                          <div className="fi-card-title">
                            <BadgeDollarSign size={16} /> F&amp;I Product Menu
                          </div>
                          <div className="fi-product-grid">
                            {fiProducts.map((product) => {
                              const isSold = (deal.fiProducts ?? []).some(
                                (p) => p.productId === product.id,
                              );
                              // Per-month payment impact
                              const dealAprM = (deal.apr ?? 7.9) / 100 / 12;
                              const dealTerm = deal.termMonths ?? 72;
                              const moImpact =
                                dealAprM > 0
                                  ? (product.retailPrice * dealAprM) /
                                    (1 - Math.pow(1 + dealAprM, -dealTerm))
                                  : product.retailPrice / dealTerm;
                              // Profit floor check
                              const profitFloor =
                                product.dealerCost + (product.minProfit ?? 0);
                              const belowFloor =
                                isSold && product.retailPrice < profitFloor;
                              const atCap =
                                product.retailPrice >=
                                (product.retailCap ?? Infinity);
                              // Resolve the current sold price (may have been overridden)
                              const soldEntry = (deal.fiProducts ?? []).find(
                                (p) => p.productId === product.id,
                              );
                              const currentSoldPrice =
                                soldEntry?.retailPrice ?? product.retailPrice;
                              const inputKey = product.id;
                              const inputVal =
                                fiPriceOverrides[inputKey] !== undefined
                                  ? fiPriceOverrides[inputKey]
                                  : String(currentSoldPrice);
                              const soldGross =
                                currentSoldPrice - product.dealerCost;
                              const soldBelowFloor =
                                soldGross < (product.minProfit ?? 0);
                              const soldMoImpact =
                                dealAprM > 0
                                  ? (currentSoldPrice * dealAprM) /
                                    (1 - Math.pow(1 + dealAprM, -dealTerm))
                                  : currentSoldPrice / dealTerm;

                              return (
                                <div
                                  key={product.id}
                                  className={`fi-product-btn${isSold ? " selected" : ""}`}
                                >
                                  {/* Top row: info + toggle */}
                                  <div className="fi-product-top-row">
                                    <div
                                      className="fi-product-info"
                                      onClick={() => {
                                        const current = deal.fiProducts ?? [];
                                        const next = isSold
                                          ? current.filter(
                                              (p) => p.productId !== product.id,
                                            )
                                          : [
                                              ...current,
                                              {
                                                productId: product.id,
                                                category: product.category,
                                                name: product.name,
                                                retailPrice:
                                                  product.retailPrice,
                                                dealerCost: product.dealerCost,
                                                termMonths: product.termMonths,
                                              },
                                            ];
                                        const updated = {
                                          ...deal,
                                          fiProducts: next,
                                        };
                                        setActiveDeal(updated);
                                        saveDeal(updated);
                                        // Clear any override when removing
                                        if (isSold) {
                                          setFiPriceOverrides((prev) => {
                                            const n = { ...prev };
                                            delete n[inputKey];
                                            return n;
                                          });
                                        }
                                      }}
                                      style={{ flex: 1, cursor: "pointer" }}
                                    >
                                      <div className="fi-product-category">
                                        {product.category}
                                      </div>
                                      <div className="fi-product-name">
                                        {product.name}
                                      </div>
                                      <div className="fi-product-provider">
                                        {product.providerName}
                                        {product.termMonths
                                          ? ` · ${product.termMonths}mo`
                                          : ""}
                                      </div>
                                    </div>
                                    {isSold && (
                                      <CheckCircle
                                        size={16}
                                        color="#3b82f6"
                                        style={{ flexShrink: 0 }}
                                      />
                                    )}
                                  </div>

                                  {/* Pricing row */}
                                  <div className="fi-product-pricing">
                                    {isSold ? (
                                      /* ── Editable price when sold ── */
                                      <div className="fi-price-edit-wrap">
                                        <span className="fi-price-edit-prefix">
                                          $
                                        </span>
                                        <input
                                          type="number"
                                          className={`fi-price-edit-input${soldBelowFloor ? " below-floor" : ""}`}
                                          value={inputVal}
                                          min={profitFloor}
                                          max={product.retailCap}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            setFiPriceOverrides((prev) => ({
                                              ...prev,
                                              [inputKey]: e.target.value,
                                            }));
                                          }}
                                          onBlur={(e) => {
                                            e.stopPropagation();
                                            const raw =
                                              parseFloat(e.target.value) || 0;
                                            // Clamp to floor and cap
                                            const clamped = Math.min(
                                              Math.max(raw, profitFloor),
                                              product.retailCap ?? raw,
                                            );
                                            setFiPriceOverrides((prev) => ({
                                              ...prev,
                                              [inputKey]: String(clamped),
                                            }));
                                            const updatedProducts = (
                                              deal.fiProducts ?? []
                                            ).map((p) =>
                                              p.productId === product.id
                                                ? { ...p, retailPrice: clamped }
                                                : p,
                                            );
                                            const updated = {
                                              ...deal,
                                              fiProducts: updatedProducts,
                                            };
                                            setActiveDeal(updated);
                                            saveDeal(updated);
                                          }}
                                        />
                                        <span className="fi-price-edit-range">
                                          floor ${profitFloor.toLocaleString()}{" "}
                                          · cap $
                                          {(
                                            product.retailCap ?? 0
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="fi-product-price">
                                        ${product.retailPrice.toLocaleString()}
                                      </span>
                                    )}
                                    <span
                                      className="fi-product-gross"
                                      style={{
                                        color: (
                                          isSold ? soldBelowFloor : belowFloor
                                        )
                                          ? "#ef4444"
                                          : undefined,
                                      }}
                                    >
                                      +$
                                      {(isSold
                                        ? soldGross
                                        : product.retailPrice -
                                          product.dealerCost
                                      ).toLocaleString()}{" "}
                                      gross
                                      {(isSold
                                        ? soldBelowFloor
                                        : belowFloor) && (
                                        <span className="fi-floor-warn">
                                          {" "}
                                          ⚠ below floor
                                        </span>
                                      )}
                                    </span>
                                    {atCap && !isSold && (
                                      <span
                                        style={{
                                          fontSize: 10,
                                          color: "#f59e0b",
                                          fontWeight: 700,
                                        }}
                                      >
                                        At cap
                                      </span>
                                    )}
                                  </div>

                                  <div className="fi-product-mo-impact">
                                    +$
                                    {(isSold ? soldMoImpact : moImpact).toFixed(
                                      2,
                                    )}
                                    /mo
                                  </div>
                                </div>
                              );
                            })}
                            {fiProducts.length === 0 && (
                              <div
                                className="fi-empty"
                                style={{ gridColumn: "1/-1" }}
                              >
                                No products configured for this rooftop.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stipulation Tracker */}
                        <div className="fi-card">
                          <div className="fi-card-title">
                            <ClipboardList size={16} /> Stipulation Tracker
                          </div>
                          {(deal.stips ?? []).length === 0 && (
                            <div className="fi-empty">
                              No stips on this deal.
                            </div>
                          )}
                          <div className="fi-stip-list">
                            {(deal.stips ?? []).map((stip) => (
                              <div
                                key={stip.id}
                                className={`fi-stip-row${stip.received ? " received" : ""}`}
                              >
                                <button
                                  type="button"
                                  className={`fi-stip-checkbox${stip.received ? " received" : ""}`}
                                  onClick={() => toggleStip(deal, stip.id)}
                                >
                                  {stip.received && (
                                    <CheckCircle size={14} color="#fff" />
                                  )}
                                </button>
                                <div style={{ flex: 1 }}>
                                  <div
                                    className={`fi-stip-label${stip.received ? " received" : ""}`}
                                  >
                                    {stip.label}
                                  </div>
                                  {stip.receivedAt && (
                                    <div className="fi-stip-date">
                                      Received{" "}
                                      {new Date(
                                        stip.receivedAt,
                                      ).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`fi-stip-badge${stip.received ? " received" : ""}`}
                                >
                                  {stip.received ? "Received" : "Missing"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Compliance */}
                        <div className="fi-card">
                          <div className="fi-card-title">
                            <ShieldCheck size={16} /> Compliance &amp;
                            e-Contracting
                          </div>
                          <div className="fi-compliance-grid">
                            {(
                              [
                                "ofacCleared",
                                "redFlagsCleared",
                                "truthInLendingPrinted",
                                "eContractSent",
                                "eContractSigned",
                              ] as const
                            ).map((field) => {
                              const labels: Record<string, string> = {
                                ofacCleared: "OFAC Cleared",
                                redFlagsCleared: "Red Flags Cleared",
                                truthInLendingPrinted:
                                  "Truth in Lending Printed",
                                eContractSent: "e-Contract Sent",
                                eContractSigned: "e-Contract Signed",
                              };
                              const checked = Boolean(deal[field]);
                              return (
                                <button
                                  key={field}
                                  type="button"
                                  className={`fi-compliance-btn${checked ? " checked" : ""}`}
                                  onClick={() => {
                                    const updated = {
                                      ...deal,
                                      [field]: !checked,
                                    };
                                    setActiveDeal(updated);
                                    saveDeal(updated);
                                  }}
                                >
                                  <div
                                    className={`fi-compliance-check${checked ? " checked" : ""}`}
                                  >
                                    {checked && (
                                      <CheckCircle size={14} color="#fff" />
                                    )}
                                  </div>
                                  <span className="fi-compliance-label">
                                    {labels[field]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="finance-portal-panel"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 300,
                        }}
                      >
                        <p className="empty-state">
                          Select a deal from the queue to view details.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Lender Submission Panel ── */}
                  <div className="fi-card">
                    <div className="fi-card-title">
                      <CreditCard size={16} /> Submit to Lenders
                      {deal && (deal.lenderSubmissions ?? []).length > 0 && (
                        <span
                          className="badge"
                          style={{ background: "#3b82f620", color: "#3b82f6" }}
                        >
                          {(deal.lenderSubmissions ?? []).length} submitted
                        </span>
                      )}
                    </div>

                    {!deal ? (
                      <div className="fi-empty">
                        Select a deal to submit to lenders.
                      </div>
                    ) : (
                      <>
                        {/* Live callback dashboard — show if submissions exist */}
                        {(deal.lenderSubmissions ?? []).length > 0 && (
                          <div className="fi-sub-list">
                            {(deal.lenderSubmissions ?? []).map((sub) => {
                              const statusColors: Record<
                                LenderDecisionStatus,
                                string
                              > = {
                                Pending: "#f59e0b",
                                Approved: "#10b981",
                                Countered: "#6366f1",
                                Declined: "#ef4444",
                              };
                              const color = statusColors[sub.status];
                              return (
                                <div key={sub.id} className="fi-sub-row">
                                  <div className="fi-sub-lender-name">
                                    {sub.lenderName}
                                  </div>
                                  <div className="fi-sub-details">
                                    {sub.status === "Approved" && (
                                      <span className="fi-sub-approved">
                                        ✓ {sub.approvedRate}% APR ·{" "}
                                        {sub.approvedTerm}mo
                                        {sub.maxLtv
                                          ? ` · LTV ≤${sub.maxLtv}%`
                                          : ""}
                                      </span>
                                    )}
                                    {sub.status === "Countered" && (
                                      <span className="fi-sub-countered">
                                        {sub.counterConditions}
                                      </span>
                                    )}
                                    {sub.status === "Declined" && (
                                      <span className="fi-sub-declined">
                                        {sub.declineReason}
                                      </span>
                                    )}
                                    {sub.status === "Pending" && (
                                      <span className="fi-sub-pending">
                                        Awaiting decision…
                                      </span>
                                    )}
                                  </div>
                                  <div className="fi-sub-right">
                                    <span
                                      className="fi-sub-badge"
                                      style={{
                                        background: `${color}20`,
                                        color,
                                      }}
                                    >
                                      {sub.status}
                                    </span>
                                    {sub.status === "Approved" &&
                                      sub.id !== deal.acceptedSubmissionId && (
                                        <button
                                          type="button"
                                          className="fi-accept-btn"
                                          onClick={() =>
                                            acceptSubmission(deal, sub.id)
                                          }
                                        >
                                          Accept &amp; Import
                                        </button>
                                      )}
                                    {sub.id === deal.acceptedSubmissionId && (
                                      <span className="fi-accepted-pill">
                                        ✓ Accepted
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Shotgun lender checklist */}
                        <div className="fi-sub-section-title">
                          Select lenders to submit:
                        </div>
                        <div className="fi-lender-checklist">
                          {lenders.map((lender) => {
                            const alreadySubmitted = (
                              deal.lenderSubmissions ?? []
                            ).some((s) => s.lenderId === lender.id);
                            const tierColors: Record<LenderTier, string> = {
                              Prime: "#10b981",
                              "Near-Prime": "#3b82f6",
                              Subprime: "#f59e0b",
                              "Deep Subprime": "#ef4444",
                            };
                            const checked = selectedLenderIds.has(lender.id);
                            return (
                              <label
                                key={lender.id}
                                className={`fi-lender-check-row${alreadySubmitted ? " submitted" : ""}${checked ? " selected" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={alreadySubmitted}
                                  checked={checked}
                                  onChange={() => {
                                    setSelectedLenderIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(lender.id))
                                        next.delete(lender.id);
                                      else next.add(lender.id);
                                      return next;
                                    });
                                  }}
                                />
                                <span className="fi-lender-check-name">
                                  {lender.name}
                                </span>
                                <span
                                  className="fi-lender-tier-badge"
                                  style={{
                                    color: tierColors[lender.tier],
                                    background: `${tierColors[lender.tier]}18`,
                                  }}
                                >
                                  {lender.tier}
                                </span>
                                {lender.minCreditScore && (
                                  <span className="fi-lender-score">
                                    ≥{lender.minCreditScore}
                                  </span>
                                )}
                                {alreadySubmitted && (
                                  <span className="fi-lender-sent-tag">
                                    Sent
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          className="fi-shotgun-btn"
                          disabled={selectedLenderIds.size === 0}
                          onClick={() =>
                            submitToLenders(deal, Array.from(selectedLenderIds))
                          }
                        >
                          <CreditCard size={15} />
                          Submit to {selectedLenderIds.size || ""} Lender
                          {selectedLenderIds.size !== 1 ? "s" : ""}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Credit Packets */}
                  <div className="fi-card">
                    <div className="fi-card-title">
                      <FileText size={16} /> Credit Packets
                      <span
                        className="badge"
                        style={{ background: "#6366f120", color: "#6366f1" }}
                      >
                        {creditApplications.length} packets
                      </span>
                    </div>
                    {creditApplications.length === 0 ? (
                      <div className="fi-empty">
                        No full credit packets submitted yet.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {creditApplications.slice(0, 6).map((app) => (
                          <div key={app.id} className="fi-packet-row">
                            <div style={{ flex: 1 }}>
                              <div className="fi-packet-name">
                                {app.applicantName}
                              </div>
                              <div className="fi-packet-sub">
                                {app.submissionPlatform || "Internal CRM"} ·{" "}
                                {app.requestedVehicle || "No vehicle"}
                              </div>
                              <div className="fi-packet-docs">
                                <span
                                  style={{
                                    color: app.identityDocsReceived
                                      ? "#10b981"
                                      : "#ef4444",
                                  }}
                                >
                                  ID {app.identityDocsReceived ? "✓" : "✗"}
                                </span>
                                <span
                                  style={{
                                    color: app.incomeDocsReceived
                                      ? "#10b981"
                                      : "#ef4444",
                                  }}
                                >
                                  Income {app.incomeDocsReceived ? "✓" : "✗"}
                                </span>
                                <span
                                  style={{
                                    color: app.insuranceDocsReceived
                                      ? "#10b981"
                                      : "#ef4444",
                                  }}
                                >
                                  Insurance{" "}
                                  {app.insuranceDocsReceived ? "✓" : "✗"}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="fi-open-btn"
                              onClick={() => {
                                const c = customers.find(
                                  (item) => item.id === app.customerId,
                                );
                                if (c) {
                                  openProfile(c);
                                  setProfileTab("credit");
                                }
                              }}
                            >
                              Open
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── CIT (Contracts in Transit) Tracker ── */}
                  {(() => {
                    const citDeals = vehicleSales.filter(
                      (s) =>
                        s.fundingStatus === "Submitted to Lender" ||
                        s.fundingStatus === "Approved" ||
                        s.fundingStatus === "Stipulations Required",
                    );
                    return (
                      <div className="fi-card">
                        <div className="fi-card-title">
                          <TrendingUp size={16} /> Contracts in Transit (CIT)
                          <span
                            className="badge"
                            style={{
                              background: "#6366f120",
                              color: "#6366f1",
                            }}
                          >
                            {citDeals.length} pending
                          </span>
                        </div>
                        {citDeals.length === 0 ? (
                          <div className="fi-empty">
                            No contracts awaiting funding.
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {citDeals.map((s) => {
                              const cust = customers.find(
                                (c) => c.id === s.customerId,
                              );
                              const submittedDate =
                                s.lenderSubmissions?.find(
                                  (ls) => ls.status !== "Pending",
                                )?.decidedAt ?? s.createdAt;
                              const daysOut = submittedDate
                                ? Math.floor(
                                    (Date.now() -
                                      new Date(submittedDate).getTime()) /
                                      86400000,
                                  )
                                : null;
                              const amtFinanced =
                                s.salePrice -
                                (s.downPayment ?? 0) -
                                (s.tradeAllowance ?? 0) +
                                (s.tradePayoff ?? 0);
                              return (
                                <div key={s.id} className="fi-cit-row">
                                  <div className="fi-cit-vehicle">
                                    <div>
                                      {cust
                                        ? `${cust.firstName} ${cust.lastName}`
                                        : `Deal #${s.id}`}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 400,
                                        color: "var(--text-muted,#64748b)",
                                      }}
                                    >
                                      {s.year} {s.make} {s.model} ·{" "}
                                      {s.lender ?? "Lender TBD"}
                                    </div>
                                  </div>
                                  <div className="fi-cit-amount">
                                    $
                                    {amtFinanced > 0
                                      ? amtFinanced.toLocaleString(undefined, {
                                          maximumFractionDigits: 0,
                                        })
                                      : "—"}
                                  </div>
                                  <div
                                    className={`fi-cit-days${daysOut !== null && daysOut > 5 ? " overdue" : ""}`}
                                  >
                                    {daysOut !== null ? `${daysOut}d out` : "—"}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                      background:
                                        (fundingColors[
                                          s.fundingStatus ?? "Pending Structure"
                                        ] ?? "#94a3b8") + "22",
                                      color:
                                        fundingColors[
                                          s.fundingStatus ?? "Pending Structure"
                                        ] ?? "#94a3b8",
                                    }}
                                  >
                                    {s.fundingStatus}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              );
            })()}

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
                  const res = await apiFetch(
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
                  const res = await apiFetch(`${API_BASE}/api/repair-orders`, {
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

          {/* ── COMMS ─────────────────────────────────────────────── */}
          {currentPage === "comms" &&
            (() => {
              const threadCustomer = commsCustomerId
                ? customers.find((c) => c.id === commsCustomerId)
                : null;

              const thread = messages
                .filter((m) => m.customerId === commsCustomerId)
                .sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
                );

              const allInbound = messages.filter(
                (m) => m.direction === "Inbound",
              );

              // All customers: messaged ones first (most recent), then rest alphabetically
              const threadCustomersWithMsg = customers
                .filter((c) => messages.some((m) => m.customerId === c.id))
                .sort((a, b) => {
                  const aLast = messages
                    .filter((m) => m.customerId === a.id)
                    .sort(
                      (x, y) =>
                        new Date(y.createdAt).getTime() -
                        new Date(x.createdAt).getTime(),
                    )[0]?.createdAt;
                  const bLast = messages
                    .filter((m) => m.customerId === b.id)
                    .sort(
                      (x, y) =>
                        new Date(y.createdAt).getTime() -
                        new Date(x.createdAt).getTime(),
                    )[0]?.createdAt;
                  return (
                    new Date(bLast ?? 0).getTime() -
                    new Date(aLast ?? 0).getTime()
                  );
                });
              const threadCustomersNoMsg = customers
                .filter((c) => !messages.some((m) => m.customerId === c.id))
                .sort((a, b) =>
                  `${a.firstName} ${a.lastName}`.localeCompare(
                    `${b.firstName} ${b.lastName}`,
                  ),
                );
              const threadCustomers = [
                ...threadCustomersWithMsg,
                ...threadCustomersNoMsg,
              ];
              const filteredThreadCustomers = threadSearchQuery.trim()
                ? threadCustomers.filter((c) =>
                    `${c.firstName} ${c.lastName} ${c.phone} ${c.email ?? ""}`
                      .toLowerCase()
                      .includes(threadSearchQuery.toLowerCase()),
                  )
                : threadCustomers;

              async function sendMessage() {
                if (!commsCustomerId || !commsBody.trim()) return;
                setCommsSending(true);
                try {
                  const customer = customers.find(
                    (c) => c.id === commsCustomerId,
                  );
                  const res = await apiFetch(`${API_BASE}/api/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      customerId: commsCustomerId,
                      channel: commsChannel,
                      body: commsBody.trim(),
                      subject: commsSubject.trim() || undefined,
                      toNumber: customer?.phone,
                      toEmail: customer?.email,
                    }),
                  });
                  if (res.ok) {
                    const msg = await res.json();
                    setMessages((prev) => [...prev, msg]);
                    setCommsBody("");
                    setCommsSubject("");
                    setCommsTemplateId(null);
                    // Simulate delivery after 1.5s
                    setTimeout(() => {
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === msg.id
                            ? { ...m, status: "delivered" as MessageStatus }
                            : m,
                        ),
                      );
                    }, 1500);
                  }
                } catch {
                  setAppMessage("Could not send message.");
                } finally {
                  setCommsSending(false);
                }
              }

              async function simulateInbound() {
                if (!commsCustomerId) return;
                const customer = customers.find(
                  (c) => c.id === commsCustomerId,
                );
                const res = await apiFetch(
                  `${API_BASE}/api/messages/simulate-inbound`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      customerId: commsCustomerId,
                      body: "Hey, just checking in — does the offer still stand?",
                      fromNumber: customer?.phone ?? "+15550000000",
                    }),
                  },
                );
                if (res.ok) {
                  const msg = await res.json();
                  setMessages((prev) => [...prev, msg]);
                }
              }

              async function enrollInSequence(sequenceId: number) {
                if (!commsCustomerId) return;
                const res = await apiFetch(
                  `${API_BASE}/api/sequence-enrollments`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      customerId: commsCustomerId,
                      sequenceId,
                    }),
                  },
                );
                if (res.ok) {
                  const enroll = await res.json();
                  setSequenceEnrollments((prev) => [enroll, ...prev]);
                  setAppMessage("Customer enrolled in sequence.");
                } else {
                  setAppMessage("Already enrolled or error.");
                }
              }

              async function pauseEnrollment(enrollmentId: number) {
                await apiFetch(
                  `${API_BASE}/api/sequence-enrollments/${enrollmentId}/pause`,
                  { method: "PATCH" },
                );
                setSequenceEnrollments((prev) =>
                  prev.map((e) =>
                    e.id === enrollmentId
                      ? { ...e, status: "paused" as EnrollmentStatus }
                      : e,
                  ),
                );
              }

              async function unsubscribeEnrollment(enrollmentId: number) {
                await apiFetch(
                  `${API_BASE}/api/sequence-enrollments/${enrollmentId}/unsubscribe`,
                  { method: "PATCH" },
                );
                setSequenceEnrollments((prev) =>
                  prev.map((e) =>
                    e.id === enrollmentId
                      ? { ...e, status: "unsubscribed" as EnrollmentStatus }
                      : e,
                  ),
                );
              }

              function applyTemplate(tmplId: number) {
                const tmpl = emailTemplates.find((t) => t.id === tmplId);
                if (!tmpl) return;
                const customer = customers.find(
                  (c) => c.id === commsCustomerId,
                );
                const sale = vehicleSales.find(
                  (s) => s.customerId === commsCustomerId,
                );
                const replace = (text: string) =>
                  text
                    .replace(/\{\{firstName\}\}/g, customer?.firstName ?? "")
                    .replace(/\{\{vehicleYear\}\}/g, sale?.year ?? "")
                    .replace(/\{\{vehicleMake\}\}/g, sale?.make ?? "")
                    .replace(/\{\{vehicleModel\}\}/g, sale?.model ?? "")
                    .replace(
                      /\{\{senderName\}\}/g,
                      currentUser?.name ?? "Your Dealer",
                    );
                setCommsChannel(tmpl.channel);
                setCommsBody(replace(tmpl.body));
                setCommsSubject(replace(tmpl.subject));
                setCommsTemplateId(tmplId);
              }

              const statusDot = (s: MessageStatus) => {
                const colors: Record<MessageStatus, string> = {
                  queued: "#94a3b8",
                  sent: "#60a5fa",
                  delivered: "#22c55e",
                  failed: "#ef4444",
                  received: "#a855f7",
                };
                return (
                  <span
                    title={s}
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: colors[s],
                      marginLeft: 4,
                      verticalAlign: "middle",
                    }}
                  />
                );
              };

              return (
                <>
                  <header className="page-header">
                    <div>
                      <p className="eyebrow">Communication Hub</p>
                      <h1>Comms</h1>
                      <p className="page-subtitle">
                        Two-way SMS · Email · Drip Sequences
                      </p>
                    </div>
                    <div className="header-actions">
                      {allInbound.length > 0 && (
                        <span className="badge" style={{ fontSize: 13 }}>
                          {allInbound.length} unread
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setBulkSmsOpen(true)}
                      >
                        <Send size={13} /> Bulk SMS
                      </button>
                    </div>
                  </header>

                  {/* ── Bulk SMS Modal ── */}
                  {bulkSmsOpen &&
                    (() => {
                      const targets = customers.filter(
                        (c) =>
                          c.phone &&
                          (bulkSmsFilter === "All" ||
                            c.status === bulkSmsFilter),
                      );
                      async function sendBulkSms() {
                        if (!bulkSmsBody.trim() || targets.length === 0) return;
                        setBulkSmsSending(true);
                        let sent = 0;
                        for (const c of targets) {
                          try {
                            const res = await apiFetch(
                              `${API_BASE}/api/messages`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  customerId: c.id,
                                  direction: "Outbound",
                                  channel: "Text",
                                  body: bulkSmsBody,
                                  status: "sent",
                                }),
                              },
                            );
                            if (res.ok) {
                              const msg = await res.json();
                              setMessages((prev) => [msg, ...prev]);
                              sent++;
                            }
                          } catch {
                            /* continue */
                          }
                        }
                        setBulkSmsSending(false);
                        setBulkSmsOpen(false);
                        setBulkSmsBody("");
                        setAppMessage(`Bulk SMS sent to ${sent} customers.`);
                      }
                      return (
                        <div
                          className="modal-backdrop"
                          onClick={() => setBulkSmsOpen(false)}
                        >
                          <div
                            className="modal-box"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: 480 }}
                          >
                            <h3>Bulk SMS Blast</h3>
                            <div
                              className="form-group"
                              style={{ marginTop: 14 }}
                            >
                              <label>Filter Recipients</label>
                              <select
                                value={bulkSmsFilter}
                                onChange={(e) =>
                                  setBulkSmsFilter(
                                    e.target.value as typeof bulkSmsFilter,
                                  )
                                }
                              >
                                <option value="All">
                                  All Customers with Phone
                                </option>
                                <option value="Working">Status: Working</option>
                                <option value="Appt Set">
                                  Status: Appt Set
                                </option>
                                <option value="Lost">Status: Lost</option>
                              </select>
                            </div>
                            <p
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                margin: "6px 0 12px",
                              }}
                            >
                              {targets.length} recipient
                              {targets.length !== 1 ? "s" : ""} selected
                            </p>
                            <div className="form-group">
                              <label>Message</label>
                              <textarea
                                rows={4}
                                maxLength={160}
                                placeholder="Type your SMS message (160 char max)..."
                                value={bulkSmsBody}
                                onChange={(e) => setBulkSmsBody(e.target.value)}
                              />
                              <small
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: 11,
                                }}
                              >
                                {bulkSmsBody.length}/160
                              </small>
                            </div>
                            <div className="modal-footer">
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() => setBulkSmsOpen(false)}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={
                                  bulkSmsSending ||
                                  !bulkSmsBody.trim() ||
                                  targets.length === 0
                                }
                                onClick={sendBulkSms}
                              >
                                {bulkSmsSending
                                  ? "Sending…"
                                  : `Send to ${targets.length} contacts`}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  <div className="comms-shell">
                    {/* ── Thread List ── */}
                    <aside className="comms-thread-list">
                      <div className="comms-thread-search">
                        <Search size={13} />
                        <input
                          placeholder="Search customers…"
                          value={threadSearchQuery}
                          onChange={(e) => setThreadSearchQuery(e.target.value)}
                        />
                      </div>
                      {filteredThreadCustomers.length === 0 && (
                        <div className="comms-empty-threads">
                          No customers match.
                        </div>
                      )}
                      {filteredThreadCustomers.map((c, idx) => {
                        const lastMsg = messages
                          .filter((m) => m.customerId === c.id)
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime(),
                          )[0];
                        const hasUnread = messages.some(
                          (m) =>
                            m.customerId === c.id &&
                            m.direction === "Inbound" &&
                            m.status === "received",
                        );
                        const hasMessages = messages.some(
                          (m) => m.customerId === c.id,
                        );
                        const prevC = filteredThreadCustomers[idx - 1];
                        const prevHasMsg = prevC
                          ? messages.some((m) => m.customerId === prevC.id)
                          : true;
                        const showDivider =
                          !threadSearchQuery.trim() &&
                          !hasMessages &&
                          prevHasMsg;
                        return (
                          <div key={c.id}>
                            {showDivider && (
                              <div className="comms-thread-divider">
                                All Customers
                              </div>
                            )}
                            <button
                              type="button"
                              className={`comms-thread-item${commsCustomerId === c.id ? " active" : ""}${hasUnread ? " unread" : ""}`}
                              onClick={() => {
                                setCommsCustomerId(c.id);
                                setCommsTab("inbox");
                              }}
                            >
                              <div className="comms-thread-avatar">
                                {c.firstName[0]}
                                {c.lastName[0]}
                              </div>
                              <div className="comms-thread-meta">
                                <div className="comms-thread-name">
                                  {c.firstName} {c.lastName}
                                  {hasUnread && (
                                    <span className="comms-unread-dot" />
                                  )}
                                </div>
                                {hasMessages ? (
                                  <>
                                    <div className="comms-thread-preview">
                                      {lastMsg?.body.slice(0, 48)}…
                                    </div>
                                    <div className="comms-thread-time">
                                      {timeAgo(lastMsg?.createdAt)}
                                    </div>
                                  </>
                                ) : (
                                  <div
                                    className="comms-thread-preview"
                                    style={{ fontStyle: "italic" }}
                                  >
                                    {c.phone || c.email || "No contact info"}
                                  </div>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </aside>

                    {/* ── Right Panel ── */}
                    <div className="comms-panel">
                      {!commsCustomerId ? (
                        <div className="comms-empty">
                          <MessageSquare size={40} />
                          <p>Select a customer to view their thread</p>
                          <p className="muted">
                            Or start a new conversation by selecting any
                            customer
                          </p>
                          <div
                            style={{
                              marginTop: 16,
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              justifyContent: "center",
                            }}
                          >
                            {customers.slice(0, 6).map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="fi-compliance-btn"
                                onClick={() => {
                                  setCommsCustomerId(c.id);
                                  setCommsTab("inbox");
                                }}
                              >
                                {c.firstName} {c.lastName}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Panel Header */}
                          <div className="comms-panel-header">
                            <button
                              type="button"
                              className="comms-panel-contact comms-contact-link"
                              onClick={() =>
                                threadCustomer && openProfile(threadCustomer)
                              }
                              title="Open customer profile"
                            >
                              <div className="comms-thread-avatar lg">
                                {threadCustomer?.firstName[0]}
                                {threadCustomer?.lastName[0]}
                              </div>
                              <div>
                                <strong>
                                  {threadCustomer?.firstName}{" "}
                                  {threadCustomer?.lastName}
                                </strong>
                                <small>
                                  {threadCustomer?.phone} ·{" "}
                                  {threadCustomer?.email}
                                </small>
                              </div>
                            </button>
                            <div className="comms-panel-tabs">
                              {(
                                [
                                  [
                                    "inbox",
                                    "Inbox",
                                    <MessageSquare size={13} />,
                                  ],
                                  ["sequences", "Sequences", <Zap size={13} />],
                                  [
                                    "templates",
                                    "Templates",
                                    <Mail size={13} />,
                                  ],
                                ] as const
                              ).map(([tab, label, icon]) => (
                                <button
                                  key={tab}
                                  type="button"
                                  className={`comms-tab-btn${commsTab === tab ? " active" : ""}`}
                                  onClick={() => setCommsTab(tab)}
                                >
                                  {icon} {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* ── Inbox Tab ── */}
                          {commsTab === "inbox" && (
                            <>
                              <div className="comms-thread-body">
                                {thread.length === 0 && (
                                  <div className="comms-no-messages">
                                    No messages yet. Send the first one below.
                                  </div>
                                )}
                                {thread.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`comms-bubble ${msg.direction === "Outbound" ? "outbound" : "inbound"}`}
                                  >
                                    <div className="comms-bubble-meta">
                                      <span className="comms-channel-badge">
                                        {msg.channel === "Text" ? (
                                          <MessageSquare size={11} />
                                        ) : (
                                          <Mail size={11} />
                                        )}{" "}
                                        {msg.channel}
                                      </span>
                                      {msg.subject && (
                                        <strong className="comms-subject">
                                          {msg.subject}
                                        </strong>
                                      )}
                                    </div>
                                    <div className="comms-bubble-body">
                                      {msg.body}
                                    </div>
                                    <div className="comms-bubble-time">
                                      {new Date(
                                        msg.createdAt,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      ·{" "}
                                      {new Date(
                                        msg.createdAt,
                                      ).toLocaleDateString()}
                                      {msg.direction === "Outbound" &&
                                        statusDot(msg.status)}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Compose */}
                              <div className="comms-compose">
                                <div className="comms-compose-toolbar">
                                  <select
                                    value={commsChannel}
                                    onChange={(e) =>
                                      setCommsChannel(
                                        e.target.value as "Text" | "Email",
                                      )
                                    }
                                    className="comms-channel-select"
                                  >
                                    <option value="Text">📱 SMS</option>
                                    <option value="Email">✉️ Email</option>
                                  </select>
                                  <select
                                    value={commsTemplateId ?? ""}
                                    onChange={(e) =>
                                      e.target.value
                                        ? applyTemplate(Number(e.target.value))
                                        : undefined
                                    }
                                    className="comms-channel-select"
                                  >
                                    <option value="">Use template…</option>
                                    {emailTemplates
                                      .filter((t) => t.channel === commsChannel)
                                      .map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.name}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="comms-sim-btn"
                                    onClick={simulateInbound}
                                    title="Simulate inbound reply"
                                  >
                                    <RefreshCw size={12} /> Sim Reply
                                  </button>
                                </div>
                                {commsChannel === "Email" && (
                                  <input
                                    className="comms-subject-input"
                                    placeholder="Subject…"
                                    value={commsSubject}
                                    onChange={(e) =>
                                      setCommsSubject(e.target.value)
                                    }
                                  />
                                )}
                                <div className="comms-compose-row">
                                  <textarea
                                    className="comms-compose-input"
                                    placeholder={
                                      commsChannel === "Text"
                                        ? "Type a text message…"
                                        : "Type an email…"
                                    }
                                    value={commsBody}
                                    rows={3}
                                    onChange={(e) =>
                                      setCommsBody(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && e.metaKey)
                                        sendMessage();
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="comms-send-btn"
                                    disabled={!commsBody.trim() || commsSending}
                                    onClick={sendMessage}
                                  >
                                    <Send size={16} />
                                    {commsSending ? "Sending…" : "Send"}
                                  </button>
                                </div>
                                <div className="comms-compose-hint">
                                  ⌘+Enter to send
                                </div>
                              </div>
                            </>
                          )}

                          {/* ── Sequences Tab ── */}
                          {commsTab === "sequences" && (
                            <div className="comms-seq-panel">
                              <h3 className="comms-seq-title">
                                <Zap size={15} /> Drip Sequences
                              </h3>
                              <p className="comms-seq-desc">
                                Enroll {threadCustomer?.firstName} in an
                                automated follow-up sequence. Steps send on a
                                schedule until the customer replies or is
                                removed.
                              </p>

                              {/* Active enrollments for this customer */}
                              {sequenceEnrollments.filter(
                                (e) =>
                                  e.customerId === commsCustomerId &&
                                  e.status === "active",
                              ).length > 0 && (
                                <div className="comms-enrolled-list">
                                  <div className="comms-seq-section-label">
                                    Active Enrollments
                                  </div>
                                  {sequenceEnrollments
                                    .filter(
                                      (e) =>
                                        e.customerId === commsCustomerId &&
                                        e.status === "active",
                                    )
                                    .map((e) => {
                                      const seq = emailSequences.find(
                                        (s) => s.id === e.sequenceId,
                                      );
                                      return (
                                        <div
                                          key={e.id}
                                          className="comms-enrollment-card"
                                        >
                                          <div>
                                            <strong>{seq?.name}</strong>
                                            <small>
                                              Step {e.currentStepIndex + 1} of{" "}
                                              {seq?.steps.length ?? "?"}
                                            </small>
                                          </div>
                                          <div className="comms-enroll-actions">
                                            <button
                                              type="button"
                                              className="comms-enroll-btn pause"
                                              onClick={() =>
                                                pauseEnrollment(e.id)
                                              }
                                            >
                                              <PauseCircle size={12} /> Pause
                                            </button>
                                            <button
                                              type="button"
                                              className="comms-enroll-btn unsub"
                                              onClick={() =>
                                                unsubscribeEnrollment(e.id)
                                              }
                                            >
                                              <UserMinus size={12} /> Remove
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}

                              {/* Available sequences */}
                              <div className="comms-seq-section-label">
                                Available Sequences
                              </div>
                              {emailSequences
                                .filter((s) => s.active)
                                .map((seq) => {
                                  const alreadyEnrolled =
                                    sequenceEnrollments.some(
                                      (e) =>
                                        e.customerId === commsCustomerId &&
                                        e.sequenceId === seq.id &&
                                        e.status === "active",
                                    );
                                  return (
                                    <div
                                      key={seq.id}
                                      className="comms-seq-card"
                                    >
                                      <div className="comms-seq-card-header">
                                        <div>
                                          <strong>{seq.name}</strong>
                                          <span className="comms-seq-trigger">
                                            Trigger:{" "}
                                            {seq.triggerEvent.replace("_", " ")}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          className={`comms-enroll-btn${alreadyEnrolled ? " enrolled" : ""}`}
                                          disabled={alreadyEnrolled}
                                          onClick={() =>
                                            enrollInSequence(seq.id)
                                          }
                                        >
                                          {alreadyEnrolled
                                            ? "Enrolled"
                                            : "Enroll"}
                                        </button>
                                      </div>
                                      <div className="comms-seq-steps">
                                        {seq.steps.map((step) => (
                                          <div
                                            key={step.index}
                                            className="comms-seq-step"
                                          >
                                            <span className="comms-step-day">
                                              Day {step.delayDays}
                                            </span>
                                            <span className="comms-step-channel">
                                              {step.channel === "Text" ? (
                                                <MessageSquare size={11} />
                                              ) : (
                                                <Mail size={11} />
                                              )}
                                            </span>
                                            <span className="comms-step-preview">
                                              {step.body.slice(0, 60)}…
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* ── Templates Tab ── */}
                          {commsTab === "templates" && (
                            <div className="comms-seq-panel">
                              <h3 className="comms-seq-title">
                                <Mail size={15} /> Message Templates
                              </h3>
                              <p className="comms-seq-desc">
                                Click any template to pre-fill the compose box.
                                Tokens like <code>{"{{firstName}}"}</code> are
                                replaced automatically.
                              </p>
                              {emailTemplates.map((tmpl) => (
                                <div
                                  key={tmpl.id}
                                  className={`comms-tmpl-card${commsTemplateId === tmpl.id ? " selected" : ""}`}
                                  onClick={() => {
                                    applyTemplate(tmpl.id);
                                    setCommsTab("inbox");
                                  }}
                                >
                                  <div className="comms-tmpl-header">
                                    <strong>{tmpl.name}</strong>
                                    <span className="comms-channel-badge">
                                      {tmpl.channel === "Text" ? (
                                        <MessageSquare size={11} />
                                      ) : (
                                        <Mail size={11} />
                                      )}{" "}
                                      {tmpl.channel}
                                    </span>
                                  </div>
                                  {tmpl.subject && (
                                    <div className="comms-tmpl-subject">
                                      {tmpl.subject}
                                    </div>
                                  )}
                                  <div className="comms-tmpl-body">
                                    {tmpl.body.slice(0, 120)}
                                    {tmpl.body.length > 120 ? "…" : ""}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

          {/* ── INVENTORY ──────────────────────────────────────────── */}
          {currentPage === "inventory" &&
            (() => {
              const filteredInv = inventory.filter((v) => {
                const matchStatus =
                  invFilter === "All" || v.status === invFilter;
                const matchCond =
                  invCondition === "All" || v.condition === invCondition;
                const q = invSearch.toLowerCase();
                const matchSearch =
                  !q ||
                  `${v.year} ${v.make} ${v.model} ${v.trim} ${v.stockNumber} ${v.vin}`
                    .toLowerCase()
                    .includes(q);
                return matchStatus && matchCond && matchSearch;
              });
              const available = inventory.filter(
                (v) => v.status === "Available",
              ).length;
              const sold = inventory.filter((v) => v.status === "Sold").length;
              const hold = inventory.filter((v) => v.status === "Hold").length;
              const aging = inventory.filter(
                (v) =>
                  v.daysOnLot >= 60 &&
                  v.status !== "Sold" &&
                  v.status !== "Archived",
              ).length;

              function openInvModal(v?: InventoryVehicle) {
                if (v) {
                  setInvEditTarget(v);
                  setInvForm({
                    stockNumber: v.stockNumber,
                    vin: v.vin,
                    year: v.year,
                    make: v.make,
                    model: v.model,
                    trim: v.trim,
                    bodyClass: v.bodyClass,
                    extColor: v.extColor,
                    intColor: v.intColor,
                    mileage: String(v.mileage),
                    msrp: String(v.msrp),
                    internetPrice: String(v.internetPrice),
                    invoicePrice: String(v.invoicePrice),
                    status: v.status,
                    condition: v.condition,
                    notes: v.notes,
                  });
                } else {
                  setInvEditTarget(null);
                  setInvForm({
                    stockNumber: "",
                    vin: "",
                    year: "",
                    make: "",
                    model: "",
                    trim: "",
                    bodyClass: "",
                    extColor: "",
                    intColor: "",
                    mileage: "",
                    msrp: "",
                    internetPrice: "",
                    invoicePrice: "",
                    status: "Available",
                    condition: "Used",
                    notes: "",
                  });
                }
                setInvModalOpen(true);
              }

              async function saveInvVehicle() {
                const payload = {
                  ...invForm,
                  mileage: Number(invForm.mileage) || 0,
                  msrp: Number(invForm.msrp) || 0,
                  internetPrice: Number(invForm.internetPrice) || 0,
                  invoicePrice: Number(invForm.invoicePrice) || 0,
                };
                if (invEditTarget) {
                  const res = await apiFetch(
                    `${API_BASE}/api/inventory/${invEditTarget.id}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    },
                  );
                  if (res.ok) {
                    const updated = await res.json();
                    setInventory((prev) =>
                      prev.map((v) =>
                        v.id === invEditTarget.id ? updated : v,
                      ),
                    );
                  }
                } else {
                  const res = await apiFetch(`${API_BASE}/api/inventory`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (res.ok) {
                    const created = await res.json();
                    setInventory((prev) => [...prev, created]);
                  }
                }
                setInvModalOpen(false);
              }

              async function deleteInvVehicle(id: number) {
                await apiFetch(`${API_BASE}/api/inventory/${id}`, {
                  method: "DELETE",
                });
                setInventory((prev) => prev.filter((v) => v.id !== id));
              }

              function exportInvCSV() {
                const headers = [
                  "Stock#",
                  "VIN",
                  "Year",
                  "Make",
                  "Model",
                  "Trim",
                  "Condition",
                  "Status",
                  "Mileage",
                  "MSRP",
                  "Internet Price",
                  "Invoice",
                  "Ext Color",
                  "Days on Lot",
                ];
                const rows = filteredInv.map((v) => [
                  v.stockNumber,
                  v.vin,
                  v.year,
                  v.make,
                  v.model,
                  v.trim,
                  v.condition,
                  v.status,
                  v.mileage,
                  v.msrp,
                  v.internetPrice,
                  v.invoicePrice,
                  v.extColor,
                  v.daysOnLot,
                ]);
                const csv = [headers, ...rows]
                  .map((r) => r.join(","))
                  .join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(
                  new Blob([csv], { type: "text/csv" }),
                );
                a.download = "inventory.csv";
                a.click();
              }

              const statusColor: Record<InventoryStatus, string> = {
                Available: "#22c55e",
                "In Transit": "#f59e0b",
                Sold: "#6366f1",
                Hold: "#ef4444",
                Archived: "#94a3b8",
              };

              return (
                <>
                  <header className="page-header">
                    <div>
                      <p className="eyebrow">Vehicle Lot</p>
                      <h1>Inventory</h1>
                      <p className="page-subtitle">
                        {inventory.length} vehicles · {available} available ·{" "}
                        {aging} aging 60+ days
                      </p>
                    </div>
                    <div className="header-actions">
                      <button type="button" onClick={exportInvCSV}>
                        <Download size={14} /> Export CSV
                      </button>
                      <button type="button" onClick={() => openInvModal()}>
                        <Plus size={14} /> Add Vehicle
                      </button>
                    </div>
                  </header>

                  {/* KPI row */}
                  <div className="inv-kpi-row">
                    {[
                      ["Available", available, "#22c55e"],
                      ["On Hold", hold, "#ef4444"],
                      ["Sold", sold, "#6366f1"],
                      ["Aging 60d+", aging, "#f59e0b"],
                    ].map(([label, val, color]) => (
                      <div key={String(label)} className="inv-kpi-card">
                        <span
                          className="inv-kpi-val"
                          style={{ color: String(color) }}
                        >
                          {String(val)}
                        </span>
                        <span className="inv-kpi-label">{String(label)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Filters */}
                  <div className="inv-filters">
                    <div className="inv-search-wrap">
                      <Search size={13} />
                      <input
                        placeholder="Search stock#, VIN, year, make…"
                        value={invSearch}
                        onChange={(e) => setInvSearch(e.target.value)}
                      />
                    </div>
                    {(
                      [
                        "All",
                        "Available",
                        "In Transit",
                        "Hold",
                        "Sold",
                        "Archived",
                      ] as const
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`inv-filter-btn${invFilter === s ? " active" : ""}`}
                        onClick={() => setInvFilter(s)}
                      >
                        {s}
                      </button>
                    ))}
                    <select
                      value={invCondition}
                      onChange={(e) =>
                        setInvCondition(e.target.value as typeof invCondition)
                      }
                      className="inv-select"
                    >
                      <option value="All">All Conditions</option>
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="CPO">CPO</option>
                    </select>
                  </div>

                  {/* Table */}
                  <div className="inv-table-wrap">
                    <table className="inv-table">
                      <thead>
                        <tr>
                          <th>Stock #</th>
                          <th>Vehicle</th>
                          <th>Condition</th>
                          <th>Status</th>
                          <th>Mileage</th>
                          <th>MSRP</th>
                          <th>Internet</th>
                          <th>Days on Lot</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInv.length === 0 && (
                          <tr>
                            <td
                              colSpan={9}
                              style={{
                                textAlign: "center",
                                padding: "40px",
                                color: "var(--text-muted)",
                              }}
                            >
                              No vehicles match.
                            </td>
                          </tr>
                        )}
                        {filteredInv.map((v) => (
                          <tr
                            key={v.id}
                            className={
                              v.daysOnLot >= 60 && v.status === "Available"
                                ? "inv-row-aging"
                                : ""
                            }
                          >
                            <td>
                              <span className="inv-stock">{v.stockNumber}</span>
                            </td>
                            <td>
                              <div className="inv-vehicle-cell">
                                <strong>
                                  {v.year} {v.make} {v.model}
                                </strong>
                                <small>
                                  {v.trim} · {v.extColor}
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className="inv-condition-badge">
                                {v.condition}
                              </span>
                            </td>
                            <td>
                              <span
                                className="inv-status-dot"
                                style={{ background: statusColor[v.status] }}
                              />
                              {v.status}
                            </td>
                            <td>{v.mileage.toLocaleString()} mi</td>
                            <td>${v.msrp.toLocaleString()}</td>
                            <td>${v.internetPrice.toLocaleString()}</td>
                            <td>
                              <span
                                className={
                                  v.daysOnLot >= 60 ? "inv-aging-badge" : ""
                                }
                              >
                                {v.daysOnLot}d
                              </span>
                            </td>
                            <td className="inv-actions">
                              <button
                                type="button"
                                title="Edit"
                                onClick={() => openInvModal(v)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                title="Delete"
                                className="danger-btn"
                                onClick={() => deleteInvVehicle(v.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add/Edit Modal */}
                  {invModalOpen && (
                    <div
                      className="modal-backdrop"
                      onClick={() => setInvModalOpen(false)}
                    >
                      <div
                        className="modal-box wide-modal"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3>
                          {invEditTarget
                            ? "Edit Vehicle"
                            : "Add Vehicle to Inventory"}
                        </h3>
                        <div className="inv-form-grid">
                          {(
                            [
                              ["stockNumber", "Stock #"],
                              ["vin", "VIN"],
                              ["year", "Year"],
                              ["make", "Make"],
                              ["model", "Model"],
                              ["trim", "Trim"],
                              ["bodyClass", "Body Class"],
                              ["extColor", "Ext Color"],
                              ["intColor", "Int Color"],
                              ["mileage", "Mileage"],
                              ["msrp", "MSRP"],
                              ["internetPrice", "Internet Price"],
                              ["invoicePrice", "Invoice Price"],
                            ] as [keyof typeof invForm, string][]
                          ).map(([field, label]) => (
                            <div key={field} className="form-group">
                              <label>{label}</label>
                              <input
                                value={invForm[field] as string}
                                onChange={(e) =>
                                  setInvForm((f) => ({
                                    ...f,
                                    [field]: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          ))}
                          <div className="form-group">
                            <label>Condition</label>
                            <select
                              value={invForm.condition}
                              onChange={(e) =>
                                setInvForm((f) => ({
                                  ...f,
                                  condition: e.target
                                    .value as typeof f.condition,
                                }))
                              }
                            >
                              <option value="New">New</option>
                              <option value="Used">Used</option>
                              <option value="CPO">CPO</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Status</label>
                            <select
                              value={invForm.status}
                              onChange={(e) =>
                                setInvForm((f) => ({
                                  ...f,
                                  status: e.target.value as InventoryStatus,
                                }))
                              }
                            >
                              {(
                                [
                                  "Available",
                                  "In Transit",
                                  "Hold",
                                  "Sold",
                                  "Archived",
                                ] as InventoryStatus[]
                              ).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div
                            className="form-group"
                            style={{ gridColumn: "1/-1" }}
                          >
                            <label>Notes</label>
                            <textarea
                              value={invForm.notes}
                              onChange={(e) =>
                                setInvForm((f) => ({
                                  ...f,
                                  notes: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setInvModalOpen(false)}
                          >
                            Cancel
                          </button>
                          <button type="button" onClick={saveInvVehicle}>
                            {invEditTarget ? "Save Changes" : "Add Vehicle"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

          {/* ── REPORTS ────────────────────────────────────────────── */}
          {currentPage === "reports" &&
            (() => {
              const thisMonth = new Date().toISOString().slice(0, 7);
              const deliveredThisMonth = vehicleSales.filter(
                (s) =>
                  (s.stage === "Delivered" || s.stage === "Finance") &&
                  (s.createdAt ?? "").startsWith(thisMonth),
              );
              const totalFrontGross = deliveredThisMonth.reduce(
                (t, s) => t + (s.salePrice - (s.downPayment ?? 0)),
                0,
              );
              const totalBackGross = deliveredThisMonth.reduce(
                (t, s) => t + (s.backEndGross ?? 0),
                0,
              );
              const totalReserve = deliveredThisMonth.reduce(
                (t, s) => t + (s.dealerReserve ?? 0),
                0,
              );
              const totalUnits = deliveredThisMonth.length;

              // Per-salesperson breakdown using financeManagerName as proxy
              const spMap = new Map<
                string,
                { units: number; frontGross: number; backGross: number }
              >();
              vehicleSales
                .filter((s) => s.stage === "Delivered" || s.stage === "Finance")
                .forEach((s) => {
                  const name = s.financeManagerName || "Unassigned";
                  const cur = spMap.get(name) ?? {
                    units: 0,
                    frontGross: 0,
                    backGross: 0,
                  };
                  spMap.set(name, {
                    units: cur.units + 1,
                    frontGross: cur.frontGross + s.salePrice,
                    backGross: cur.backGross + (s.backEndGross ?? 0),
                  });
                });
              const spRows = Array.from(spMap.entries())
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.units - a.units);

              // Source breakdown
              const sourceMap = new Map<string, number>();
              customers.forEach((c) => {
                const src =
                  (c as Customer & { source?: string }).source || "Unknown";
                sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
              });
              const sourceRows = Array.from(sourceMap.entries()).sort(
                (a, b) => b[1] - a[1],
              );

              // MTD goal tracker
              const currentGoals = salesGoals.filter(
                (g) => g.month === thisMonth,
              );

              function exportDealsCSV() {
                const headers = [
                  "Customer",
                  "Vehicle",
                  "Sale Price",
                  "Stage",
                  "Lender",
                  "APR",
                  "Term",
                  "Back Gross",
                  "Reserve",
                  "Created",
                ];
                const rows = vehicleSales.map((s) => {
                  const cust = customers.find((c) => c.id === s.customerId);
                  return [
                    cust ? `${cust.firstName} ${cust.lastName}` : s.customerId,
                    `${s.year} ${s.make} ${s.model}`,
                    s.salePrice,
                    s.stage,
                    s.lender ?? "",
                    s.apr ?? "",
                    s.termMonths ?? "",
                    s.backEndGross ?? 0,
                    s.dealerReserve ?? 0,
                    s.createdAt ?? "",
                  ];
                });
                const csv = [headers, ...rows]
                  .map((r) => r.join(","))
                  .join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(
                  new Blob([csv], { type: "text/csv" }),
                );
                a.download = "deals.csv";
                a.click();
              }

              function exportCustomersCSV() {
                const headers = [
                  "ID",
                  "First",
                  "Last",
                  "Email",
                  "Phone",
                  "Source",
                  "Status",
                  "Created",
                ];
                const rows = customers.map((c) => [
                  c.id,
                  c.firstName,
                  c.lastName,
                  c.email ?? "",
                  c.phone,
                  (c as Customer & { source?: string }).source ?? "",
                  c.status,
                  c.createdAt,
                ]);
                const csv = [headers, ...rows]
                  .map((r) => r.join(","))
                  .join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(
                  new Blob([csv], { type: "text/csv" }),
                );
                a.download = "customers.csv";
                a.click();
              }

              return (
                <>
                  <header className="page-header">
                    <div>
                      <p className="eyebrow">Analytics</p>
                      <h1>Reports</h1>
                      <p className="page-subtitle">
                        Month-to-date performance &amp; exports
                      </p>
                    </div>
                    <div className="header-actions">
                      <button type="button" onClick={exportCustomersCSV}>
                        <Download size={14} /> Customers CSV
                      </button>
                      <button type="button" onClick={exportDealsCSV}>
                        <Download size={14} /> Deals CSV
                      </button>
                    </div>
                  </header>

                  {/* MTD KPIs */}
                  <div className="reports-kpi-row">
                    {[
                      ["Units MTD", totalUnits, "#6366f1"],
                      [
                        "Front Gross",
                        `$${totalFrontGross.toLocaleString()}`,
                        "#22c55e",
                      ],
                      [
                        "Back Gross",
                        `$${totalBackGross.toLocaleString()}`,
                        "#f59e0b",
                      ],
                      [
                        "Reserve",
                        `$${totalReserve.toLocaleString()}`,
                        "#0ea5e9",
                      ],
                      [
                        "Total Gross",
                        `$${(totalFrontGross + totalBackGross).toLocaleString()}`,
                        "#a855f7",
                      ],
                    ].map(([label, val, color]) => (
                      <div key={String(label)} className="reports-kpi-card">
                        <span
                          className="reports-kpi-val"
                          style={{ color: String(color) }}
                        >
                          {String(val)}
                        </span>
                        <span className="reports-kpi-label">
                          {String(label)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="reports-grid">
                    {/* Salesperson Scoreboard */}
                    <div className="reports-card">
                      <div className="reports-card-header">
                        <Target size={15} />
                        <h3>Salesperson Scoreboard</h3>
                      </div>
                      <table className="reports-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Units</th>
                            <th>Front Gross</th>
                            <th>Back Gross</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spRows.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                style={{
                                  textAlign: "center",
                                  color: "var(--text-muted)",
                                }}
                              >
                                No deals yet.
                              </td>
                            </tr>
                          )}
                          {spRows.map((row, i) => (
                            <tr key={row.name}>
                              <td>
                                <span className="sp-rank">#{i + 1}</span>{" "}
                                {row.name}
                              </td>
                              <td>
                                <strong>{row.units}</strong>
                              </td>
                              <td>${row.frontGross.toLocaleString()}</td>
                              <td>${row.backGross.toLocaleString()}</td>
                              <td>
                                <strong>
                                  $
                                  {(
                                    row.frontGross + row.backGross
                                  ).toLocaleString()}
                                </strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* MTD Goal Tracker */}
                    <div className="reports-card">
                      <div className="reports-card-header">
                        <BarChart2 size={15} />
                        <h3>MTD Goal Tracker — {thisMonth}</h3>
                      </div>
                      {currentGoals.length === 0 && (
                        <p className="muted" style={{ padding: "12px" }}>
                          No goals set for this month.
                        </p>
                      )}
                      {currentGoals.map((goal) => {
                        const spData = spMap.get(goal.salespersonName);
                        const unitPct = Math.min(
                          100,
                          Math.round(
                            ((spData?.units ?? 0) / goal.unitGoal) * 100,
                          ),
                        );
                        const grossPct = Math.min(
                          100,
                          Math.round(
                            (((spData?.frontGross ?? 0) +
                              (spData?.backGross ?? 0)) /
                              goal.grossGoal) *
                              100,
                          ),
                        );
                        return (
                          <div key={goal.id} className="goal-tracker-row">
                            <div className="goal-tracker-name">
                              {goal.salespersonName}
                            </div>
                            <div className="goal-bar-wrap">
                              <label>
                                Units: {spData?.units ?? 0} / {goal.unitGoal}
                              </label>
                              <div className="goal-bar">
                                <div
                                  className="goal-bar-fill"
                                  style={{
                                    width: `${unitPct}%`,
                                    background:
                                      unitPct >= 100 ? "#22c55e" : "#6366f1",
                                  }}
                                />
                              </div>
                            </div>
                            <div className="goal-bar-wrap">
                              <label>
                                Gross: $
                                {(
                                  (spData?.frontGross ?? 0) +
                                  (spData?.backGross ?? 0)
                                ).toLocaleString()}{" "}
                                / ${goal.grossGoal.toLocaleString()}
                              </label>
                              <div className="goal-bar">
                                <div
                                  className="goal-bar-fill"
                                  style={{
                                    width: `${grossPct}%`,
                                    background:
                                      grossPct >= 100 ? "#22c55e" : "#f59e0b",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ padding: "8px 12px" }}>
                        <button
                          type="button"
                          className="ghost-button"
                          style={{ fontSize: 12 }}
                          onClick={async () => {
                            const name = prompt("Salesperson name:");
                            const units = prompt("Unit goal:");
                            const gross = prompt("Gross goal ($):");
                            if (!name || !units) return;
                            const res = await apiFetch(
                              `${API_BASE}/api/sales-goals`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  salespersonName: name,
                                  unitGoal: Number(units),
                                  grossGoal: Number(gross) || 0,
                                }),
                              },
                            );
                            if (res.ok) {
                              const g = await res.json();
                              setSalesGoals((prev) => [...prev, g]);
                            }
                          }}
                        >
                          + Add Goal
                        </button>
                      </div>
                    </div>

                    {/* Lead Source Breakdown */}
                    <div className="reports-card">
                      <div className="reports-card-header">
                        <Package size={15} />
                        <h3>Lead Sources</h3>
                      </div>
                      <table className="reports-table">
                        <thead>
                          <tr>
                            <th>Source</th>
                            <th>Leads</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sourceRows.map(([src, cnt]) => (
                            <tr key={src}>
                              <td>{src}</td>
                              <td>{cnt}</td>
                              <td>
                                {customers.length > 0
                                  ? Math.round((cnt / customers.length) * 100)
                                  : 0}
                                %
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Audit Log */}
                    <div className="reports-card reports-card-full">
                      <div className="reports-card-header">
                        <Eye size={15} />
                        <h3>Audit Log</h3>
                      </div>
                      {auditLog.length === 0 && (
                        <p className="muted" style={{ padding: "12px" }}>
                          No audit entries yet.
                        </p>
                      )}
                      <div className="audit-log-list">
                        {auditLog.slice(0, 100).map((entry) => (
                          <div key={entry.id} className="audit-log-entry">
                            <span className="audit-log-user">
                              {entry.userName}
                            </span>
                            <span className="audit-log-action">
                              {entry.action}
                            </span>
                            <span className="audit-log-entity">
                              {entry.entity} #{entry.entityId}
                            </span>
                            <span className="audit-log-time">
                              {timeAgo(entry.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
        </section>
      </main>
    </>
  );
}

export default App;
