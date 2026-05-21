import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { loadAll, saveAll } from "./sqlite.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// ─── RBAC Role Hierarchy ─────────────────────────────────────────────────────
type CrmRole =
  | "SuperAdmin" // Platform owner — sees all dealerships
  | "DealerGroupAdmin" // Owns/manages multiple rooftops in a group
  | "DealerPrincipal" // Dealer owner — one rooftop, all departments
  | "GeneralManager" // GM — one rooftop, all departments
  | "SalesManager" // Sales dept only
  | "FinanceManager" // F&I dept only
  | "ServiceManager" // Service dept only
  | "Salesperson" // Only their own assigned leads
  | "ServiceAdvisor" // Only their assigned ROs
  | "Technician"; // View-only on assigned ROs

const ROLE_RANK: Record<CrmRole, number> = {
  SuperAdmin: 100,
  DealerGroupAdmin: 90,
  DealerPrincipal: 80,
  GeneralManager: 70,
  SalesManager: 60,
  FinanceManager: 60,
  ServiceManager: 60,
  Salesperson: 30,
  ServiceAdvisor: 30,
  Technician: 20,
};

function hasRank(role: CrmRole, minimum: CrmRole): boolean {
  return (ROLE_RANK[role] ?? 0) >= ROLE_RANK[minimum];
}

// ─── Tenant / Auth context attached to every request ─────────────────────────
declare global {
  namespace Express {
    interface Request {
      tenant: {
        dealershipId: number;
        role: CrmRole;
        userId: number;
        dealerGroupId?: number;
      };
    }
  }
}

// ─── Dealer Group (parent company owning multiple rooftops) ─────────────────
type DealerGroup = {
  id: number;
  name: string; // e.g. "AutoNation Southeast"
  contactEmail: string;
  contactPhone: string;
  plan: "starter" | "pro" | "enterprise";
  active: boolean;
  createdAt: string;
};

// ─── Dealership (one physical rooftop / location) ────────────────────────────
type Dealership = {
  id: number;
  dealerGroupId?: number; // null = independent dealer
  name: string; // e.g. "Ford of Hollywood"
  subdomain: string; // e.g. "fordofhollywood" → fordofhollywood.yourcrm.com
  customDomain?: string; // e.g. "crm.fordofhollywood.com"
  brand: string; // e.g. "Ford"
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  logoUrl: string;
  primaryColor: string; // hex, used for portal branding
  accentColor: string;
  dealerCode?: string; // DMS dealer code (Dealertrack, RouteOne, etc.)
  dmsProvider?: string; // "Dealertrack" | "RouteOne" | "CUDL" | "FEX DMS"
  leadRoutingZips?: string[]; // zip codes that auto-route leads here
  active: boolean;
  plan: "starter" | "pro" | "enterprise";
  createdAt: string;
};

type Customer = {
  id: number;
  dealershipId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status:
    | "New Lead"
    | "Contacted"
    | "Appt Set"
    | "Appt Show"
    | "Working"
    | "Sold"
    | "Lost";
  temperature?: "Hot" | "Warm" | "Cold";
  interestedVehicle: string;
  source: string;
  assignedTo: string;
  createdAt?: string;
  nextFollowUp: string;
  masterCustomerId?: number;
};

type FinanceApplication = {
  id: number;
  dealershipId: number;
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
  dealershipId: number;
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
  dealershipId: number;
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

type FiProduct = {
  id: number;
  dealershipId: number;
  category: FiProductCategory;
  name: string;
  providerName: string;
  termMonths?: number;
  mileageLimit?: number;
  dealerCost: number; // wholesale / pack cost
  retailPrice: number; // default selling price
  retailCap: number; // max legal / MSRP ceiling
  minProfit: number; // floor: retail cannot go below dealerCost + minProfit
  active: boolean;
};

type LenderTier = "Prime" | "Near-Prime" | "Subprime" | "Deep Subprime";

type Lender = {
  id: number;
  dealershipId: number;
  name: string;
  tier: LenderTier;
  minCreditScore?: number;
  maxLtv?: number; // max loan-to-value %
  maxTermMonths?: number;
  contactName?: string;
  contactPhone?: string;
  active: boolean;
};

type LenderDecisionStatus = "Pending" | "Approved" | "Countered" | "Declined";

type LenderSubmission = {
  id: number;
  vehicleSaleId: number;
  dealershipId: number;
  lenderId: number;
  lenderName: string;
  submittedAt: string;
  status: LenderDecisionStatus;
  // Approval details
  approvedRate?: number;
  approvedTerm?: number;
  approvedAmount?: number;
  maxLtv?: number;
  // Counter offer details
  counterConditions?: string;
  // Decline reason
  declineReason?: string;
  decidedAt?: string;
};

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

type FundingStatus =
  | "Pending Structure"
  | "Submitted to Lender"
  | "Approved"
  | "Stipulations Required"
  | "Funded"
  | "Unwound"
  | "Declined";

type VehicleSale = {
  id: number;
  dealershipId: number;
  customerId: number;
  stockNumber: string;
  year: string;
  make: string;
  model: string;
  salePrice: number;
  stage: "Working" | "Finance" | "Delivered" | "Lost";
  // Lender / deal structure
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
  // F&I products sold on this deal
  fiProducts?: FiProductSold[];
  // Stipulations checklist
  stips?: DealStip[];
  // Lender submissions for this deal
  lenderSubmissions?: LenderSubmission[];
  // Accepted lender submission id
  acceptedSubmissionId?: number;
  // Compliance
  ofacCleared?: boolean;
  redFlagsCleared?: boolean;
  truthInLendingPrinted?: boolean;
  eContractSent?: boolean;
  eContractSigned?: boolean;
  financeManagerId?: number;
  financeManagerName?: string;
  notes?: string;
  createdAt?: string;
};

type Activity = {
  id: number;
  dealershipId: number;
  customerId: number;
  type: "Call" | "Text" | "Email" | "Appointment" | "Note";
  note: string;
  createdAt: string;
};

type CrmTask = {
  id: number;
  dealershipId: number;
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
  dealershipId: number;
  customerId: number;
  channel: "Text" | "Email";
  direction: "Outbound" | "Inbound";
  subject?: string;
  body: string;
  template?: string;
  status: MessageStatus;
  // Carrier/provider reference IDs (populated by real transport)
  providerSid?: string; // Twilio MessageSid or SendGrid messageId
  fromNumber?: string; // for SMS
  toNumber?: string; // for SMS
  fromEmail?: string;
  toEmail?: string;
  errorMessage?: string;
  sequenceId?: number; // if sent as part of a drip sequence
  sequenceStepIndex?: number;
  createdAt: string;
  updatedAt?: string;
};

type EmailTemplate = {
  id: number;
  dealershipId: number;
  name: string;
  subject: string;
  body: string; // plain text; use {{firstName}}, {{vehicleMake}}, etc.
  channel: "Text" | "Email";
  createdAt: string;
};

type SequenceStep = {
  index: number; // 0-based order
  delayDays: number; // days after enrollment (0 = immediately)
  channel: "Text" | "Email";
  subject?: string; // email only
  body: string; // supports {{firstName}} tokens
};

type EmailSequence = {
  id: number;
  dealershipId: number;
  name: string; // e.g. "New Lead Follow-Up"
  triggerEvent: "lead_created" | "appointment_set" | "deal_lost" | "manual";
  steps: SequenceStep[];
  active: boolean;
  createdAt: string;
};

type EnrollmentStatus = "active" | "completed" | "paused" | "unsubscribed";

type SequenceEnrollment = {
  id: number;
  dealershipId: number;
  customerId: number;
  sequenceId: number;
  enrolledAt: string;
  currentStepIndex: number;
  status: EnrollmentStatus;
  completedAt?: string;
};

type User = {
  id: number;
  dealershipId: number; // primary rooftop
  dealerGroupId?: number; // if group admin, which group
  name: string;
  email: string;
  password: string;
  role: CrmRole;
  phone?: string;
  avatarUrl?: string;
  // Cross-store access: extra dealership IDs this user can access
  crossStoreAccess?: number[];
};

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
  dealershipId: number;
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

type Database = {
  dealerGroups: DealerGroup[];
  dealerships: Dealership[];
  users: User[];
  customers: Customer[];
  financeApplications: FinanceApplication[];
  creditApplications: CreditApplication[];
  tradeIns: TradeIn[];
  vehicleSales: VehicleSale[];
  fiProducts: FiProduct[];
  lenders: Lender[];
  activities: Activity[];
  tasks: CrmTask[];
  messages: Message[];
  emailTemplates: EmailTemplate[];
  emailSequences: EmailSequence[];
  sequenceEnrollments: SequenceEnrollment[];
  repairOrders: RepairOrder[];
  inventory: InventoryVehicle[];
  salesGoals: SalesGoal[];
  auditLog: AuditLogEntry[];
};

const DEFAULT_DEALERSHIP_ID = 1;
const DEFAULT_GROUP_ID = 1;

const defaultDatabase: Database = {
  dealerGroups: [
    {
      id: DEFAULT_GROUP_ID,
      name: "Demo Auto Group",
      contactEmail: "admin@demoautogroup.com",
      contactPhone: "(800) 555-0100",
      plan: "enterprise",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  dealerships: [
    {
      id: DEFAULT_DEALERSHIP_ID,
      dealerGroupId: DEFAULT_GROUP_ID,
      name: "Demo Ford",
      subdomain: "demoford",
      brand: "Ford",
      address: "1000 Main Street",
      city: "Houston",
      state: "TX",
      zip: "77001",
      phone: "(713) 555-0100",
      email: "info@demoford.example.com",
      logoUrl: "",
      primaryColor: "#003087",
      accentColor: "#FF6B00",
      dealerCode: "TX-FORD-001",
      dmsProvider: "Dealertrack",
      leadRoutingZips: ["77001", "77002", "77003"],
      active: true,
      plan: "enterprise",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      dealerGroupId: DEFAULT_GROUP_ID,
      name: "Demo Kia",
      subdomain: "demokia",
      brand: "Kia",
      address: "2000 Commerce Blvd",
      city: "Houston",
      state: "TX",
      zip: "77004",
      phone: "(713) 555-0200",
      email: "info@demokia.example.com",
      logoUrl: "",
      primaryColor: "#BB0000",
      accentColor: "#CCCCCC",
      dealerCode: "TX-KIA-001",
      dmsProvider: "RouteOne",
      leadRoutingZips: ["77004", "77005"],
      active: true,
      plan: "pro",
      createdAt: new Date().toISOString(),
    },
  ],
  users: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      dealerGroupId: DEFAULT_GROUP_ID,
      name: "Avery Moyer",
      email: "avery@example.com",
      password: "password",
      role: "SalesManager",
      phone: "(713) 555-0188",
      avatarUrl: "",
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      dealerGroupId: DEFAULT_GROUP_ID,
      name: "Group Admin",
      email: "groupadmin@example.com",
      password: "password",
      role: "DealerGroupAdmin",
      phone: "",
      avatarUrl: "",
    },
    {
      id: 3,
      dealershipId: 2,
      name: "Kia Manager",
      email: "manager@demokia.example.com",
      password: "password",
      role: "GeneralManager",
      phone: "",
      avatarUrl: "",
    },
  ],
  customers: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      firstName: "Jordan",
      lastName: "Lee",
      email: "jordan@example.com",
      phone: "(555) 123-0148",
      status: "Appt Show",
      temperature: "Hot",
      interestedVehicle: "2024 Toyota Camry",
      source: "Website Lead",
      assignedTo: "Avery",
      nextFollowUp: "Today",
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
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
    },
    {
      id: 9,
      dealershipId: DEFAULT_DEALERSHIP_ID,
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
    },
  ],
  financeApplications: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 2,
      employmentStatus: "Full-time",
      monthlyIncome: 6200,
      creditRange: "680-719",
      downPayment: 3500,
      status: "Submitted",
    },
  ],
  creditApplications: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 2,
      applicantName: "Taylor Smith",
      dateOfBirth: "1991-06-12",
      ssnLast4: "1234",
      driverLicenseNumber: "",
      driverLicenseState: "OH",
      driverLicenseExpiration: "",
      address: "100 Main Street",
      city: "Columbus",
      state: "OH",
      zip: "43004",
      residenceType: "Rent",
      timeAtAddress: "2 years",
      employerName: "Smith Logistics",
      employerAddress: "",
      jobTitle: "Operations Lead",
      employmentStatus: "Full-time",
      timeOnJob: "4 years",
      monthlyIncome: 6200,
      otherIncome: 0,
      bankName: "Local Credit Union",
      downPayment: 3500,
      requestedVehicle: "2023 Ford F-150",
      vehicleVin: "",
      vehicleMileage: "",
      insuranceProvider: "",
      insurancePolicyNumber: "",
      tradeTitleStatus: "Not Applicable",
      tradeRegistrationStatus: "Not Applicable",
      incomeDocsReceived: true,
      identityDocsReceived: true,
      residenceDocsReceived: false,
      insuranceDocsReceived: false,
      tradeDocsReceived: false,
      submissionPlatform: "Internal CRM",
      consentToPullCredit: true,
      status: "Submitted",
      submittedAt: new Date().toISOString(),
    },
  ],
  tradeIns: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
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
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 9,
      year: "2023",
      make: "Ford",
      model: "Bronco Raptor",
      mileage: 18400,
      payoff: 52000,
      estimatedValue: 68500,
      notes: "this is my thunder buddy",
    },
  ],
  vehicleSales: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 2,
      stockNumber: "A1024",
      year: "2023",
      make: "Ford",
      model: "F-150",
      salePrice: 38995,
      stage: "Finance" as const,
      lender: "Ford Motor Credit",
      apr: 6.9,
      termMonths: 72,
      downPayment: 3500,
      dealerReserve: 850,
      fundingStatus: "Submitted to Lender" as const,
      fiProducts: [
        {
          productId: 1,
          category: "GAP" as const,
          name: "GAP Plus Protection",
          retailPrice: 795,
          dealerCost: 295,
        },
        {
          productId: 2,
          category: "Extended Warranty" as const,
          name: "Ford Protect Gold",
          retailPrice: 2495,
          dealerCost: 1200,
          termMonths: 60,
        },
      ],
      stips: [
        {
          id: 1,
          label: "Proof of Income (2 pay stubs)",
          received: true,
          receivedAt: new Date().toISOString(),
        },
        {
          id: 2,
          label: "Driver's License Copy",
          received: true,
          receivedAt: new Date().toISOString(),
        },
        { id: 3, label: "Proof of Insurance", received: false },
        { id: 4, label: "Proof of Residence", received: false },
      ],
      ofacCleared: true,
      redFlagsCleared: true,
      truthInLendingPrinted: true,
      eContractSent: true,
      eContractSigned: false,
      financeManagerName: "Avery",
      createdAt: new Date().toISOString(),
    },
  ],
  fiProducts: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "GAP",
      name: "GAP Plus Protection",
      providerName: "Safe-Guard",
      dealerCost: 295,
      retailPrice: 795,
      retailCap: 995,
      minProfit: 300,
      active: true,
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "Extended Warranty",
      name: "Ford Protect Gold",
      providerName: "Ford Motor",
      termMonths: 60,
      mileageLimit: 100000,
      dealerCost: 1200,
      retailPrice: 2495,
      retailCap: 3500,
      minProfit: 500,
      active: true,
    },
    {
      id: 3,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "Extended Warranty",
      name: "Ford Protect Platinum",
      providerName: "Ford Motor",
      termMonths: 84,
      mileageLimit: 150000,
      dealerCost: 1800,
      retailPrice: 3495,
      retailCap: 4200,
      minProfit: 500,
      active: true,
    },
    {
      id: 4,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "Tire & Wheel",
      name: "Tire & Wheel Elite",
      providerName: "Zurich",
      termMonths: 60,
      dealerCost: 180,
      retailPrice: 595,
      retailCap: 795,
      minProfit: 200,
      active: true,
    },
    {
      id: 5,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "Prepaid Maintenance",
      name: "Prepaid Maintenance 3yr",
      providerName: "JM&A",
      termMonths: 36,
      dealerCost: 280,
      retailPrice: 799,
      retailCap: 1199,
      minProfit: 250,
      active: true,
    },
    {
      id: 6,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "Paint Protection",
      name: "Paint & Fabric Shield",
      providerName: "Xzilon",
      dealerCost: 120,
      retailPrice: 499,
      retailCap: 699,
      minProfit: 200,
      active: true,
    },
    {
      id: 7,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "Key Replacement",
      name: "Key Replacement Plus",
      providerName: "Fidelity",
      dealerCost: 45,
      retailPrice: 249,
      retailCap: 399,
      minProfit: 100,
      active: true,
    },
    {
      id: 8,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "Credit Life",
      name: "Credit Life Protection",
      providerName: "CUNA Mutual",
      dealerCost: 150,
      retailPrice: 599,
      retailCap: 999,
      minProfit: 200,
      active: true,
    },
    {
      id: 9,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      category: "Credit Disability",
      name: "Credit Disability Shield",
      providerName: "CUNA Mutual",
      dealerCost: 175,
      retailPrice: 699,
      retailCap: 1099,
      minProfit: 200,
      active: true,
    },
  ],
  lenders: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Ford Motor Credit",
      tier: "Prime",
      minCreditScore: 680,
      maxLtv: 125,
      maxTermMonths: 84,
      contactName: "Lisa Ford",
      contactPhone: "(800) 727-7000",
      active: true,
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Chase Auto Finance",
      tier: "Prime",
      minCreditScore: 660,
      maxLtv: 120,
      maxTermMonths: 72,
      contactName: "Tom Chase",
      contactPhone: "(800) 336-6675",
      active: true,
    },
    {
      id: 3,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Capital One Auto",
      tier: "Near-Prime",
      minCreditScore: 600,
      maxLtv: 130,
      maxTermMonths: 72,
      contactName: "Sara Capital",
      contactPhone: "(800) 946-0332",
      active: true,
    },
    {
      id: 4,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Ally Financial",
      tier: "Near-Prime",
      minCreditScore: 580,
      maxLtv: 130,
      maxTermMonths: 84,
      contactName: "Jake Ally",
      contactPhone: "(888) 925-2559",
      active: true,
    },
    {
      id: 5,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "TD Auto Finance",
      tier: "Near-Prime",
      minCreditScore: 600,
      maxLtv: 120,
      maxTermMonths: 72,
      contactName: "Ann TD",
      contactPhone: "(800) 200-1010",
      active: true,
    },
    {
      id: 6,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Westlake Financial",
      tier: "Subprime",
      minCreditScore: 520,
      maxLtv: 140,
      maxTermMonths: 72,
      contactName: "Ray Westlake",
      contactPhone: "(888) 893-7937",
      active: true,
    },
    {
      id: 7,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "DriveTime Financial",
      tier: "Subprime",
      minCreditScore: 480,
      maxLtv: 150,
      maxTermMonths: 60,
      contactName: "Mia Drive",
      contactPhone: "(800) 965-8043",
      active: true,
    },
    {
      id: 8,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "CAC (Credit Acceptance)",
      tier: "Deep Subprime",
      minCreditScore: 400,
      maxLtv: 160,
      maxTermMonths: 60,
      contactName: "Ron CAC",
      contactPhone: "(800) 634-1506",
      active: true,
    },
  ],
  activities: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 1,
      type: "Appointment",
      note: "Scheduled test drive for Camry.",
      createdAt: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 1,
      title: "Confirm Camry test drive",
      type: "Call",
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      assignedTo: "Avery",
      priority: "High",
      status: "Open",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 2,
      title: "Send F-150 payment options",
      type: "Email",
      dueAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      assignedTo: "Avery",
      priority: "Normal",
      status: "Open",
      createdAt: new Date().toISOString(),
    },
  ],
  messages: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 1,
      channel: "Text",
      direction: "Outbound",
      body: "Hi Jordan, confirming your Camry test drive today. Does 3 PM still work?",
      template: "Appointment Confirmation",
      status: "delivered" as MessageStatus,
      toNumber: "+15551230148",
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 1,
      channel: "Text",
      direction: "Inbound",
      body: "Yes 3 PM works! See you then.",
      status: "received" as MessageStatus,
      fromNumber: "+15551230148",
      createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    },
    {
      id: 3,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      customerId: 2,
      channel: "Email",
      direction: "Outbound",
      subject: "Your F-150 Payment Options",
      body: "Hi Marcus, I wanted to share a few payment scenarios on the F-150 we discussed. Call me anytime!",
      status: "sent" as MessageStatus,
      toEmail: "marcus.johnson@email.com",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
  ],
  emailTemplates: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Appointment Confirmation",
      subject: "Confirming your appointment",
      body: "Hi {{firstName}}, just confirming your appointment today. See you soon!",
      channel: "Text" as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "New Lead Welcome",
      subject: "Thanks for your interest!",
      body: "Hi {{firstName}}, thanks for reaching out about the {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}. I\u2019d love to set up a time for you to come in. When works best?",
      channel: "Text" as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Payment Options Email",
      subject: "Your payment options on the {{vehicleMake}} {{vehicleModel}}",
      body: "Hi {{firstName}},\n\nHere are a few payment scenarios based on our conversation:\n\n- ${{downPayment}} down / {{term}} months / {{apr}}% APR\n\nLet me know if you\u2019d like to adjust any of these. I\u2019m here to help!\n\n{{senderName}}",
      channel: "Email" as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Service Reminder",
      subject: "Time for your {{vehicleMake}} service!",
      body: "Hi {{firstName}}, your {{vehicleYear}} {{vehicleMake}} is due for its next service visit. Call us or book online to schedule your appointment.",
      channel: "Text" as const,
      createdAt: new Date().toISOString(),
    },
  ],
  emailSequences: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "New Lead Follow-Up",
      triggerEvent: "lead_created" as const,
      active: true,
      createdAt: new Date().toISOString(),
      steps: [
        {
          index: 0,
          delayDays: 0,
          channel: "Text" as const,
          body: "Hi {{firstName}}! Thanks for your interest in the {{vehicleMake}} {{vehicleModel}}. This is {{senderName}} at the dealership. When would you like to come in?",
        },
        {
          index: 1,
          delayDays: 1,
          channel: "Email" as const,
          subject: "Your {{vehicleMake}} {{vehicleModel}} — a few options",
          body: "Hi {{firstName}},\n\nI wanted to follow up and share some payment options for the {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}. Reply or call anytime.\n\n{{senderName}}",
        },
        {
          index: 2,
          delayDays: 3,
          channel: "Text" as const,
          body: "Hey {{firstName}}, still thinking about the {{vehicleMake}}? Happy to answer any questions!",
        },
        {
          index: 3,
          delayDays: 7,
          channel: "Email" as const,
          subject: "Last chance on the {{vehicleMake}} {{vehicleModel}}",
          body: "Hi {{firstName}},\n\nJust checking in one last time — the {{vehicleYear}} {{vehicleMake}} is still available. Let me know if I can help.\n\n{{senderName}}",
        },
      ],
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      name: "Lost Deal Re-Engagement",
      triggerEvent: "deal_lost" as const,
      active: true,
      createdAt: new Date().toISOString(),
      steps: [
        {
          index: 0,
          delayDays: 7,
          channel: "Text" as const,
          body: "Hi {{firstName}}, it\u2019s {{senderName}}. We have some new inventory that might be a better fit. Interested in taking a look?",
        },
        {
          index: 1,
          delayDays: 30,
          channel: "Email" as const,
          subject: "We miss you, {{firstName}}!",
          body: "Hi {{firstName}},\n\nIt\u2019s been a month since we last spoke. We have new arrivals and current incentives that might be worth a look.\n\n{{senderName}}",
        },
      ],
    },
  ],
  sequenceEnrollments: [],
  repairOrders: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
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
      dealershipId: DEFAULT_DEALERSHIP_ID,
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
      dealershipId: DEFAULT_DEALERSHIP_ID,
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
          description: "Cabin Air Filter Replacement",
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
      dealershipId: DEFAULT_DEALERSHIP_ID,
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
  ],
  inventory: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      stockNumber: "S10001",
      vin: "1FTFW1E50NFA00001",
      year: "2024",
      make: "Ford",
      model: "F-150",
      trim: "XLT",
      bodyClass: "Pickup",
      extColor: "Oxford White",
      intColor: "Medium Dark Slate",
      mileage: 12,
      msrp: 48500,
      internetPrice: 47200,
      invoicePrice: 44800,
      status: "Available",
      condition: "New",
      daysOnLot: 18,
      addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
      notes: "",
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      stockNumber: "S10002",
      vin: "4T1B11HK0MU000001",
      year: "2022",
      make: "Toyota",
      model: "Camry",
      trim: "SE",
      bodyClass: "Sedan",
      extColor: "Midnight Black",
      intColor: "Black",
      mileage: 34210,
      msrp: 28000,
      internetPrice: 24995,
      invoicePrice: 22100,
      status: "Available",
      condition: "Used",
      daysOnLot: 32,
      addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString(),
      notes: "One owner, clean Carfax.",
    },
    {
      id: 3,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      stockNumber: "S10003",
      vin: "1GCUYDED0NZ000001",
      year: "2023",
      make: "Chevrolet",
      model: "Silverado 1500",
      trim: "LT",
      bodyClass: "Pickup",
      extColor: "Summit White",
      intColor: "Jet Black",
      mileage: 8,
      msrp: 52000,
      internetPrice: 50500,
      invoicePrice: 47900,
      status: "Hold",
      condition: "New",
      daysOnLot: 5,
      addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      notes: "Customer deposit on hold.",
    },
  ],
  salesGoals: [
    {
      id: 1,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      salespersonName: "Alex Rivera",
      month: new Date().toISOString().slice(0, 7),
      unitGoal: 15,
      grossGoal: 45000,
    },
    {
      id: 2,
      dealershipId: DEFAULT_DEALERSHIP_ID,
      salespersonName: "Sam Johnson",
      month: new Date().toISOString().slice(0, 7),
      unitGoal: 12,
      grossGoal: 38000,
    },
  ],
  auditLog: [],
};

function loadDatabase(): Database {
  const saved = loadAll() as Partial<Database>;

  // If SQLite had no data (fresh install), return seed defaults
  if (!Object.keys(saved).length) {
    return defaultDatabase;
  }

  const mergeSeedRecords = <T extends { id: number }>(
    savedRecords: T[] | undefined,
    seedRecords: T[],
  ) => {
    const savedList = savedRecords ?? [];
    const savedIds = new Set(savedList.map((record) => record.id));
    return [
      ...savedList,
      ...seedRecords.filter((record) => !savedIds.has(record.id)),
    ];
  };
  return {
    ...defaultDatabase,
    ...saved,
    dealerGroups: mergeSeedRecords(
      saved.dealerGroups,
      defaultDatabase.dealerGroups,
    ),
    dealerships: mergeSeedRecords(
      saved.dealerships,
      defaultDatabase.dealerships,
    ),
    customers: mergeSeedRecords(saved.customers, defaultDatabase.customers),
    tradeIns: mergeSeedRecords(saved.tradeIns, defaultDatabase.tradeIns),
    vehicleSales: mergeSeedRecords(
      saved.vehicleSales,
      defaultDatabase.vehicleSales,
    ),
    fiProducts: mergeSeedRecords(saved.fiProducts, defaultDatabase.fiProducts),
    lenders: mergeSeedRecords(saved.lenders, defaultDatabase.lenders),
    tasks: saved.tasks ?? defaultDatabase.tasks,
    messages: saved.messages ?? defaultDatabase.messages,
    emailTemplates: mergeSeedRecords(
      saved.emailTemplates,
      defaultDatabase.emailTemplates,
    ),
    emailSequences: mergeSeedRecords(
      saved.emailSequences,
      defaultDatabase.emailSequences,
    ),
    sequenceEnrollments:
      saved.sequenceEnrollments ?? defaultDatabase.sequenceEnrollments,
    repairOrders: saved.repairOrders ?? defaultDatabase.repairOrders,
    inventory: mergeSeedRecords(saved.inventory, defaultDatabase.inventory),
    salesGoals: saved.salesGoals ?? defaultDatabase.salesGoals,
    auditLog: saved.auditLog ?? defaultDatabase.auditLog,
  };
}

let db = loadDatabase();

function saveDatabase() {
  saveAll(db as unknown as Record<string, unknown>);
}

function addActivity(
  dealershipId: number,
  customerId: number,
  type: Activity["type"],
  note: string,
) {
  db.activities = [
    {
      id: Date.now(),
      dealershipId,
      customerId,
      type,
      note,
      createdAt: new Date().toISOString(),
    },
    ...db.activities,
  ];
}

// ─── Tenant Resolution Middleware ────────────────────────────────────────────
// Reads X-Dealership-Id header (set by frontend after login).
// Falls back to DEFAULT_DEALERSHIP_ID for local dev / single-tenant mode.
// In production, swap this for JWT verification.
function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const headerDealershipId = Number(req.headers["x-dealership-id"] || 0);
  const headerUserId = Number(req.headers["x-user-id"] || 1);
  const headerRole = (req.headers["x-user-role"] as CrmRole) || "Salesperson";
  const headerGroupId =
    Number(req.headers["x-dealer-group-id"] || 0) || undefined;

  // SuperAdmin can pass dealershipId 0 to operate across all rooftops
  const dealershipId = headerDealershipId || DEFAULT_DEALERSHIP_ID;

  req.tenant = {
    dealershipId,
    role: headerRole,
    userId: headerUserId,
    dealerGroupId: headerGroupId,
  };
  next();
}

// Helper: resolve visible dealership IDs for the calling user
function visibleDealershipIds(tenant: Request["tenant"]): number[] | null {
  if (tenant.role === "SuperAdmin") return null; // null = all
  if (tenant.role === "DealerGroupAdmin" && tenant.dealerGroupId) {
    return db.dealerships
      .filter((d) => d.dealerGroupId === tenant.dealerGroupId && d.active)
      .map((d) => d.id);
  }
  // For all other roles: primary rooftop + any crossStoreAccess grants
  const user = db.users.find((u) => u.id === tenant.userId);
  const extra = user?.crossStoreAccess ?? [];
  return [tenant.dealershipId, ...extra];
}

// Helper: check if a record belongs to tenant's visible scope
function inScope(
  tenant: Request["tenant"],
  recordDealershipId: number,
): boolean {
  const ids = visibleDealershipIds(tenant);
  if (ids === null) return true;
  return ids.includes(recordDealershipId);
}

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(tenantMiddleware);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auto-retail-crm-api" });
});

// ─── Dealership / Rooftop Management Routes ──────────────────────────────────

// List all dealer groups (SuperAdmin only)
app.get("/api/dealer-groups", (req, res) => {
  if (!hasRank(req.tenant.role, "DealerGroupAdmin")) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  if (req.tenant.role === "SuperAdmin") {
    res.json(db.dealerGroups);
    return;
  }
  res.json(db.dealerGroups.filter((g) => g.id === req.tenant.dealerGroupId));
});

app.post("/api/dealer-groups", (req, res) => {
  if (req.tenant.role !== "SuperAdmin") {
    res.status(403).json({ message: "SuperAdmin only" });
    return;
  }
  const group: DealerGroup = {
    id: Date.now(),
    name: String(req.body.name || "").trim(),
    contactEmail: String(req.body.contactEmail || "").trim(),
    contactPhone: String(req.body.contactPhone || "").trim(),
    plan: req.body.plan || "starter",
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.dealerGroups = [group, ...db.dealerGroups];
  saveDatabase();
  res.status(201).json(group);
});

// List dealerships visible to caller
app.get("/api/dealerships", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const result =
    ids === null
      ? db.dealerships
      : db.dealerships.filter((d) => ids.includes(d.id));
  res.json(result);
});

// Get single dealership
app.get("/api/dealerships/:id", (req, res) => {
  const id = Number(req.params.id);
  const dealership = db.dealerships.find((d) => d.id === id);
  if (!dealership) {
    res.status(404).json({ message: "Dealership not found" });
    return;
  }
  if (!inScope(req.tenant, dealership.id)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  res.json(dealership);
});

// Create new dealership/rooftop (SuperAdmin or DealerGroupAdmin)
app.post("/api/dealerships", (req, res) => {
  if (!hasRank(req.tenant.role, "DealerGroupAdmin")) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  const subdomain = String(req.body.subdomain || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-");
  if (db.dealerships.some((d) => d.subdomain === subdomain)) {
    res.status(409).json({ message: "Subdomain already in use" });
    return;
  }
  const dealership: Dealership = {
    id: Date.now(),
    dealerGroupId: req.body.dealerGroupId
      ? Number(req.body.dealerGroupId)
      : req.tenant.dealerGroupId,
    name: String(req.body.name || "").trim(),
    subdomain,
    customDomain: req.body.customDomain || undefined,
    brand: String(req.body.brand || "").trim(),
    address: String(req.body.address || "").trim(),
    city: String(req.body.city || "").trim(),
    state: String(req.body.state || "").trim(),
    zip: String(req.body.zip || "").trim(),
    phone: String(req.body.phone || "").trim(),
    email: String(req.body.email || "").trim(),
    logoUrl: req.body.logoUrl || "",
    primaryColor: req.body.primaryColor || "#1a1a2e",
    accentColor: req.body.accentColor || "#e94560",
    dealerCode: req.body.dealerCode || undefined,
    dmsProvider: req.body.dmsProvider || undefined,
    leadRoutingZips: req.body.leadRoutingZips || [],
    active: true,
    plan: req.body.plan || "starter",
    createdAt: new Date().toISOString(),
  };
  db.dealerships = [dealership, ...db.dealerships];
  saveDatabase();
  res.status(201).json(dealership);
});

// Update dealership branding/settings
app.put("/api/dealerships/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.dealerships.find((d) => d.id === id);
  if (!existing) {
    res.status(404).json({ message: "Dealership not found" });
    return;
  }
  if (
    !inScope(req.tenant, existing.id) ||
    !hasRank(req.tenant.role, "GeneralManager")
  ) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  const updated: Dealership = {
    ...existing,
    ...req.body,
    id: existing.id,
    createdAt: existing.createdAt,
  };
  db.dealerships = db.dealerships.map((d) => (d.id === id ? updated : d));
  saveDatabase();
  res.json(updated);
});

// Resolve subdomain → dealership (called by frontend on load)
app.get("/api/resolve-tenant", (req, res) => {
  const subdomain = String(req.query.subdomain || "")
    .toLowerCase()
    .trim();
  const domain = String(req.query.domain || "")
    .toLowerCase()
    .trim();
  let dealership: Dealership | undefined;
  if (subdomain)
    dealership = db.dealerships.find(
      (d) => d.subdomain === subdomain && d.active,
    );
  if (!dealership && domain)
    dealership = db.dealerships.find(
      (d) => d.customDomain === domain && d.active,
    );
  if (!dealership) {
    res.status(404).json({ message: "Dealership not found" });
    return;
  }
  res.json({
    id: dealership.id,
    name: dealership.name,
    brand: dealership.brand,
    logoUrl: dealership.logoUrl,
    primaryColor: dealership.primaryColor,
    accentColor: dealership.accentColor,
    plan: dealership.plan,
  });
});

// Lead routing: given a zip code, which dealership should get this lead?
app.get("/api/route-lead", (req, res) => {
  const zip = String(req.query.zip || "").trim();
  const brand = String(req.query.brand || "")
    .toLowerCase()
    .trim();
  if (!zip) {
    res.status(400).json({ message: "zip is required" });
    return;
  }
  let match = db.dealerships.find(
    (d) =>
      d.active &&
      d.leadRoutingZips?.includes(zip) &&
      (!brand || d.brand.toLowerCase() === brand),
  );
  if (!match && brand)
    match = db.dealerships.find(
      (d) => d.active && d.brand.toLowerCase() === brand,
    );
  if (!match) {
    res.status(404).json({ message: "No matching dealership for this lead" });
    return;
  }
  res.json({ dealershipId: match.id, dealershipName: match.name });
});

app.get("/api/vin/:vin", async (req, res) => {
  const vin = String(req.params.vin || "")
    .trim()
    .toUpperCase();

  if (!vin || vin.length < 11 || vin.length > 17) {
    res
      .status(400)
      .json({ message: "Enter a valid VIN between 11 and 17 characters" });
    return;
  }

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
    );
    const data = await response.json();
    const result = data.Results?.[0];

    if (!result) {
      res.status(404).json({ message: "VIN details were not found" });
      return;
    }

    // NHTSA returns ErrorCode "0" for a clean decode; anything else means partial or invalid
    const errorCode = String(result.ErrorCode || "");
    if (!result.Make && !result.Model) {
      res.status(404).json({
        message: "VIN not recognized — check the number and try again",
      });
      return;
    }

    // Build a readable engine string from displacement, cylinders, and fuel type
    const liters = result.DisplacementL
      ? `${parseFloat(result.DisplacementL).toFixed(1)}L`
      : "";
    const cylinders = result.EngineCylinders
      ? `${result.EngineCylinders}-cyl`
      : "";
    const fuel = result.FuelTypePrimary || "";
    const engineStr =
      [liters, cylinders, fuel].filter(Boolean).join(" ") ||
      result.EngineModel ||
      result.EngineConfiguration ||
      "—";

    const vehicle: VinDecodedVehicle = {
      vin,
      year: result.ModelYear || "—",
      make: result.Make || "—",
      model: result.Model || "—",
      trim: result.Trim || "—",
      bodyClass: result.BodyClass || "—",
      engine: engineStr,
      driveType: result.DriveType || "—",
      transmission: result.TransmissionStyle || "—",
      doors: result.Doors || "—",
      fuelType: result.FuelTypePrimary || "—",
      manufacturer: result.Manufacturer || result.ManuFacturerName || "—",
      country: result.PlantCountry || "—",
    };

    // Warn on partial decode but still return what we have
    if (errorCode && errorCode !== "0") {
      (vehicle as VinDecodedVehicle & { warning?: string }).warning =
        "Partial decode — some fields may be missing";
    }

    res.json(vehicle);
  } catch {
    res
      .status(502)
      .json({ message: "VIN lookup service is unavailable right now" });
  }
});

app.get("/api/book-value", async (req, res) => {
  const year = String(req.query.year || "").trim();
  const make = String(req.query.make || "").trim();
  const model = String(req.query.model || "").trim();
  const mileage = parseInt(String(req.query.mileage || "0")) || 0;

  if (!year || !make || !model) {
    res.status(400).json({ message: "year, make, and model are required" });
    return;
  }

  const mcKey = process.env.MARKETCHECK_API_KEY;

  if (mcKey) {
    try {
      const params = new URLSearchParams({
        api_key: mcKey,
        year,
        make,
        model,
        car_type: "used",
      });
      const mcRes = await fetch(
        `https://mc-api.marketcheck.com/v2/stats/car?${params}`,
      );
      if (mcRes.ok) {
        const mc = (await mcRes.json()) as {
          mean?: number;
          median?: number;
          price_stats?: { mean?: number; median?: number; std_dev?: number };
        };
        const median = mc.price_stats?.median ?? mc.median ?? mc.mean ?? 0;
        const stdDev = mc.price_stats?.std_dev ?? 0;
        if (median > 0) {
          // Mileage adjustment: $110 per 1k miles above/below 12k*age average
          const currentYear = new Date().getFullYear();
          const age = Math.max(0, currentYear - parseInt(year));
          const expectedMiles = age * 12000;
          const mileAdj =
            mileage > 0 ? ((expectedMiles - mileage) / 1000) * 110 : 0;
          const adjusted = Math.max(800, median + mileAdj);
          res.json({
            source: "marketcheck",
            low: Math.round((adjusted - stdDev * 0.5) / 100) * 100,
            avg: Math.round(adjusted / 100) * 100,
            high: Math.round((adjusted + stdDev * 0.5) / 100) * 100,
            listings: (mc as Record<string, unknown>).count ?? null,
          });
          return;
        }
      }
    } catch {
      /* fall through to estimation */
    }
  }

  // ── Estimation fallback (mirrors frontend estimateBookValue logic) ──────────
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - parseInt(year));
  const makeU = make.toUpperCase();
  const modelU = model.toUpperCase();

  const isHalfTon = [
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
  const isHeavy = [
    "F-250",
    "F-350",
    "SILVERADO HD",
    "SIERRA HD",
    "RAM 2500",
    "RAM 3500",
  ].some((t) => modelU.includes(t));
  const isFullSUV = [
    "TAHOE",
    "SUBURBAN",
    "YUKON",
    "EXPEDITION",
    "NAVIGATOR",
    "ARMADA",
    "SEQUOIA",
  ].some((t) => modelU.includes(t));
  const isMidSUV = [
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
  const isCompSUV = [
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
    "CX-5",
    "CX-50",
  ].some((t) => modelU.includes(t));
  const isUltra = [
    "PORSCHE",
    "BENTLEY",
    "ROLLS-ROYCE",
    "FERRARI",
    "LAMBORGHINI",
  ].includes(makeU);
  const isLuxSUV =
    !isUltra &&
    [
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
      "MDX",
      "QX60",
      "RANGE ROVER",
      "DISCOVERY",
      "XC60",
      "XC90",
      "CAYENNE",
    ].some((t) => modelU.includes(t));
  const isLuxCar =
    !isUltra &&
    !isLuxSUV &&
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
      "JAGUAR",
    ].includes(makeU);
  const tierA = ["TOYOTA", "HONDA", "SUBARU", "LEXUS"];
  const tierC = [
    "CHRYSLER",
    "DODGE",
    "FIAT",
    "MITSUBISHI",
    "LINCOLN",
    "BUICK",
    "CADILLAC",
    "LAND ROVER",
    "JAGUAR",
    "VOLVO",
  ];

  let base = isUltra
    ? 130000
    : isLuxSUV
      ? 82000
      : isLuxCar
        ? 62000
        : isHeavy
          ? 72000
          : isHalfTon
            ? 60000
            : isFullSUV
              ? 68000
              : isMidSUV
                ? 52000
                : isCompSUV
                  ? 38000
                  : [
                        "FORD",
                        "CHEVROLET",
                        "DODGE",
                        "CHRYSLER",
                        "JEEP",
                        "BUICK",
                        "GMC",
                      ].includes(makeU)
                    ? 32000
                    : ["TOYOTA", "HONDA", "SUBARU"].includes(makeU)
                      ? 33000
                      : [
                            "KIA",
                            "HYUNDAI",
                            "MAZDA",
                            "NISSAN",
                            "VOLKSWAGEN",
                          ].includes(makeU)
                        ? 29000
                        : 30000;

  const retA = [1, 0.85, 0.75, 0.65, 0.57, 0.5, 0.44, 0.39, 0.35, 0.31, 0.28];
  const retB = [1, 0.8, 0.68, 0.58, 0.49, 0.42, 0.36, 0.31, 0.27, 0.24, 0.21];
  const retC = [1, 0.74, 0.61, 0.51, 0.43, 0.36, 0.3, 0.26, 0.22, 0.19, 0.17];
  const tbl =
    isHalfTon || isHeavy
      ? retA
      : tierA.includes(makeU)
        ? retA
        : tierC.includes(makeU)
          ? retC
          : retB;
  const ret =
    tbl[Math.min(age, 10)] ??
    Math.max(0.1, (tbl[10] ?? 0.18) - (age - 10) * 0.015);
  let avg = base * ret;

  if (mileage > 0) {
    const expMiles = Math.max(1000, age * 12000);
    const perK = avg > 40000 ? 140 : avg > 20000 ? 110 : 75;
    avg -= ((mileage - expMiles) / 1000) * perK;
  }
  avg = Math.max(800, avg);

  res.json({
    source: "estimate",
    low: Math.round((avg * 0.87) / 100) * 100,
    avg: Math.round(avg / 100) * 100,
    high: Math.round((avg * 1.13) / 100) * 100,
    note: "Depreciation estimate — set MARKETCHECK_API_KEY for live market data",
  });
});

app.post("/api/signup", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    res.status(400).json({ message: "Name, email, and password are required" });
    return;
  }

  if (db.users.some((user) => user.email === email)) {
    res
      .status(409)
      .json({ message: "An account with this email already exists" });
    return;
  }

  const dealershipId = req.body.dealershipId
    ? Number(req.body.dealershipId)
    : DEFAULT_DEALERSHIP_ID;
  const user: User = {
    id: Date.now(),
    dealershipId,
    name,
    email,
    password,
    role: "Salesperson",
    phone: "",
    avatarUrl: "",
  };
  db.users = [user, ...db.users];
  saveDatabase();

  res.status(201).json({
    token: `demo-token-${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      dealershipId: user.dealershipId,
      dealerGroupId: user.dealerGroupId,
    },
    dealership: db.dealerships.find((d) => d.id === user.dealershipId),
  });
});

app.post("/api/login", (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const user = db.users.find(
    (item) => item.email === email && item.password === password,
  );

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const dealership = db.dealerships.find((d) => d.id === user.dealershipId);
  res.json({
    token: `demo-token-${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      dealershipId: user.dealershipId,
      dealerGroupId: user.dealerGroupId,
    },
    dealership: dealership
      ? {
          id: dealership.id,
          name: dealership.name,
          brand: dealership.brand,
          logoUrl: dealership.logoUrl,
          primaryColor: dealership.primaryColor,
          accentColor: dealership.accentColor,
        }
      : null,
  });
});

app.put("/api/users/:id/profile", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.users.find((user) => user.id === id);
  if (!existing) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const email = String(req.body.email || existing.email)
    .trim()
    .toLowerCase();
  if (db.users.some((user) => user.id !== id && user.email === email)) {
    res.status(409).json({ message: "That email is already in use" });
    return;
  }

  const updated: User = {
    ...existing,
    name: String(req.body.name || existing.name).trim(),
    email,
    role: (req.body.role || existing.role) as CrmRole,
    phone: String(req.body.phone || "").trim(),
    avatarUrl: String(req.body.avatarUrl || "").trim(),
  };
  db.users = db.users.map((user) => (user.id === id ? updated : user));
  saveDatabase();

  res.json({
    id: updated.id,
    name: updated.name,
    role: updated.role,
    email: updated.email,
    phone: updated.phone,
    avatarUrl: updated.avatarUrl,
  });
});

app.post("/api/forgot-password", (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const user = db.users.find((item) => item.email === email);

  if (!email || !password) {
    res.status(400).json({ message: "Email and new password are required" });
    return;
  }

  if (!user) {
    res.status(404).json({ message: "No account was found with that email" });
    return;
  }

  db.users = db.users.map((item) =>
    item.email === email ? { ...item, password } : item,
  );
  saveDatabase();

  res.json({ message: "Password updated. You can log in now." });
});

app.get("/api/bootstrap", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  if (ids === null) {
    res.json(db);
    return;
  }
  res.json({
    ...db,
    customers: db.customers.filter((r) => ids.includes(r.dealershipId)),
    financeApplications: db.financeApplications.filter((r) =>
      ids.includes(r.dealershipId),
    ),
    creditApplications: db.creditApplications.filter((r) =>
      ids.includes(r.dealershipId),
    ),
    tradeIns: db.tradeIns.filter((r) => ids.includes(r.dealershipId)),
    vehicleSales: db.vehicleSales.filter((r) => ids.includes(r.dealershipId)),
    activities: db.activities.filter((r) => ids.includes(r.dealershipId)),
    tasks: db.tasks.filter((r) => ids.includes(r.dealershipId)),
    messages: db.messages.filter((r) => ids.includes(r.dealershipId)),
    repairOrders: db.repairOrders.filter((r) => ids.includes(r.dealershipId)),
    users: db.users.filter((u) => ids.includes(u.dealershipId)),
    fiProducts: db.fiProducts.filter((p) => ids.includes(p.dealershipId)),
    lenders: db.lenders.filter((l) => ids.includes(l.dealershipId)),
    emailTemplates: db.emailTemplates.filter((t) =>
      ids.includes(t.dealershipId),
    ),
    emailSequences: db.emailSequences.filter((s) =>
      ids.includes(s.dealershipId),
    ),
    sequenceEnrollments: db.sequenceEnrollments.filter((e) =>
      ids.includes(e.dealershipId),
    ),
    inventory: db.inventory.filter((v) => ids.includes(v.dealershipId)),
    salesGoals: db.salesGoals.filter((g) => ids.includes(g.dealershipId)),
    auditLog: db.auditLog
      .filter((a) => ids.includes(a.dealershipId))
      .slice(-200),
  });
});

// ── Inventory CRUD ────────────────────────────────────────────────────────
app.get("/api/inventory", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const list =
    ids === null
      ? db.inventory
      : db.inventory.filter((v) => ids.includes(v.dealershipId));
  res.json(list);
});

app.post("/api/inventory", (req, res) => {
  const did = req.tenant?.dealershipId ?? DEFAULT_DEALERSHIP_ID;
  const now = new Date().toISOString();
  const vehicle: InventoryVehicle = {
    id: Date.now(),
    dealershipId: did,
    stockNumber: req.body.stockNumber || `S${Date.now().toString().slice(-5)}`,
    vin: req.body.vin || "",
    year: req.body.year || "",
    make: req.body.make || "",
    model: req.body.model || "",
    trim: req.body.trim || "",
    bodyClass: req.body.bodyClass || "",
    extColor: req.body.extColor || "",
    intColor: req.body.intColor || "",
    mileage: Number(req.body.mileage) || 0,
    msrp: Number(req.body.msrp) || 0,
    internetPrice: Number(req.body.internetPrice) || 0,
    invoicePrice: Number(req.body.invoicePrice) || 0,
    status: req.body.status || "Available",
    condition: req.body.condition || "Used",
    daysOnLot: 0,
    addedAt: now,
    notes: req.body.notes || "",
    imageUrl: req.body.imageUrl,
  };
  db.inventory.push(vehicle);
  saveDatabase();
  res.status(201).json(vehicle);
});

app.patch("/api/inventory/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = db.inventory.findIndex((v) => v.id === id);
  if (idx === -1) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  db.inventory[idx] = { ...db.inventory[idx], ...req.body, id };
  saveDatabase();
  res.json(db.inventory[idx]);
});

app.delete("/api/inventory/:id", (req, res) => {
  const id = Number(req.params.id);
  db.inventory = db.inventory.filter((v) => v.id !== id);
  saveDatabase();
  res.json({ ok: true });
});

// ── Sales Goals CRUD ──────────────────────────────────────────────────────
app.get("/api/sales-goals", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const list =
    ids === null
      ? db.salesGoals
      : db.salesGoals.filter((g) => ids.includes(g.dealershipId));
  res.json(list);
});

app.post("/api/sales-goals", (req, res) => {
  const did = req.tenant?.dealershipId ?? DEFAULT_DEALERSHIP_ID;
  const goal: SalesGoal = {
    id: Date.now(),
    dealershipId: did,
    salespersonName: req.body.salespersonName || "",
    month: req.body.month || new Date().toISOString().slice(0, 7),
    unitGoal: Number(req.body.unitGoal) || 0,
    grossGoal: Number(req.body.grossGoal) || 0,
  };
  db.salesGoals.push(goal);
  saveDatabase();
  res.status(201).json(goal);
});

app.patch("/api/sales-goals/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = db.salesGoals.findIndex((g) => g.id === id);
  if (idx === -1) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  db.salesGoals[idx] = { ...db.salesGoals[idx], ...req.body, id };
  saveDatabase();
  res.json(db.salesGoals[idx]);
});

app.delete("/api/sales-goals/:id", (req, res) => {
  const id = Number(req.params.id);
  db.salesGoals = db.salesGoals.filter((g) => g.id !== id);
  saveDatabase();
  res.json({ ok: true });
});

// ── Audit Log ─────────────────────────────────────────────────────────────
app.get("/api/audit-log", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const list =
    ids === null
      ? db.auditLog
      : db.auditLog.filter((a) => ids.includes(a.dealershipId));
  res.json(list.slice(-500).reverse());
});

app.get("/api/summary", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const filter = <T extends { dealershipId: number }>(arr: T[]) =>
    ids === null ? arr : arr.filter((r) => ids.includes(r.dealershipId));

  const sales = filter(db.vehicleSales);
  const pipelineValue = sales.reduce(
    (total, sale) => total + sale.salePrice,
    0,
  );
  const deliveredValue = sales
    .filter((sale) => sale.stage === "Delivered")
    .reduce((total, sale) => total + sale.salePrice, 0);
  const financePending = filter(db.financeApplications).filter(
    (application) => application.status !== "Approved",
  ).length;
  const appointmentCount = filter(db.customers).filter(
    (customer) =>
      customer.status === "Appt Set" || customer.status === "Appt Show",
  ).length;
  const ros = filter(db.repairOrders);
  const openROs = ros.filter((ro) => ro.status !== "Closed").length;
  const readyROs = ros.filter((ro) => ro.status === "Ready").length;

  res.json({
    customers: filter(db.customers).length,
    financeApplications: filter(db.financeApplications).length,
    tradeIns: filter(db.tradeIns).length,
    vehicleSales: sales.length,
    pipelineValue,
    deliveredValue,
    financePending,
    appointmentCount,
    openROs,
    readyROs,
  });
});

app.get("/api/customers", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const results =
    ids === null
      ? db.customers
      : db.customers.filter((c) => ids.includes(c.dealershipId));
  // Salesperson sees only their assigned leads
  if (req.tenant.role === "Salesperson") {
    const user = db.users.find((u) => u.id === req.tenant.userId);
    res.json(results.filter((c) => c.assignedTo === user?.name));
    return;
  }
  res.json(results);
});

app.post("/api/customers", (req, res) => {
  const customer: Customer = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email || "",
    phone: req.body.phone,
    status: req.body.status || "New Lead",
    interestedVehicle: req.body.interestedVehicle || "",
    source: req.body.source || "Manual Entry",
    assignedTo: req.body.assignedTo || "",
    nextFollowUp: req.body.nextFollowUp || "Not scheduled",
  };

  db.customers = [customer, ...db.customers];
  addActivity(
    customer.dealershipId,
    customer.id,
    "Note",
    "Customer record created.",
  );
  saveDatabase();
  res.status(201).json(customer);
});

app.put("/api/customers/:id", (req, res) => {
  const customerId = Number(req.params.id);
  const existing = db.customers.find((c) => c.id === customerId);
  if (!existing || !inScope(req.tenant, existing.dealershipId)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  db.customers = db.customers.map((customer) =>
    customer.id === customerId
      ? {
          ...customer,
          ...req.body,
          id: customerId,
          dealershipId: existing.dealershipId,
        }
      : customer,
  );
  addActivity(
    existing.dealershipId,
    customerId,
    "Note",
    "Customer record updated.",
  );
  saveDatabase();
  res.json(db.customers.find((customer) => customer.id === customerId));
});

app.delete("/api/customers/:id", (req, res) => {
  const customerId = Number(req.params.id);
  const existing = db.customers.find((c) => c.id === customerId);
  if (
    !existing ||
    !inScope(req.tenant, existing.dealershipId) ||
    !hasRank(req.tenant.role, "SalesManager")
  ) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  db.customers = db.customers.filter((customer) => customer.id !== customerId);
  db.financeApplications = db.financeApplications.filter(
    (application) => application.customerId !== customerId,
  );
  db.tradeIns = db.tradeIns.filter(
    (tradeIn) => tradeIn.customerId !== customerId,
  );
  db.vehicleSales = db.vehicleSales.filter(
    (sale) => sale.customerId !== customerId,
  );
  db.activities = db.activities.filter(
    (activity) => activity.customerId !== customerId,
  );
  saveDatabase();
  res.status(204).send();
});

app.get("/api/finance-applications", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const results =
    ids === null
      ? db.financeApplications
      : db.financeApplications.filter((r) => ids.includes(r.dealershipId));
  res.json(results);
});

app.post("/api/finance-applications", (req, res) => {
  const application: FinanceApplication = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    customerId: Number(req.body.customerId),
    applicantName: req.body.applicantName || "",
    dateOfBirth: req.body.dateOfBirth || "",
    ssnLast4: req.body.ssnLast4 || "",
    address: req.body.address || "",
    city: req.body.city || "",
    state: req.body.state || "",
    zip: req.body.zip || "",
    employerName: req.body.employerName || "",
    jobTitle: req.body.jobTitle || "",
    employmentStatus: req.body.employmentStatus || "Full-time",
    timeOnJob: req.body.timeOnJob || "",
    monthlyIncome: Number(req.body.monthlyIncome || 0),
    otherIncome: Number(req.body.otherIncome || 0),
    creditRange: req.body.creditRange || "Unknown",
    downPayment: Number(req.body.downPayment || 0),
    requestedVehicle: req.body.requestedVehicle || "",
    tradePayoff: Number(req.body.tradePayoff || 0),
    requestedAmount: Number(req.body.requestedAmount || 0),
    termMonths: Number(req.body.termMonths || 0),
    lender: req.body.lender || "",
    decisionNotes: req.body.decisionNotes || "",
    consentToPullCredit: Boolean(req.body.consentToPullCredit),
    status: req.body.status || "New",
  };

  db.financeApplications = [application, ...db.financeApplications];
  addActivity(
    application.dealershipId,
    application.customerId,
    "Note",
    `Finance application ${application.status.toLowerCase()}.`,
  );
  saveDatabase();
  res.status(201).json(application);
});

app.patch("/api/finance-applications/:id/status", (req, res) => {
  const applicationId = Number(req.params.id);
  db.financeApplications = db.financeApplications.map((application) =>
    application.id === applicationId
      ? { ...application, status: req.body.status }
      : application,
  );
  const application = db.financeApplications.find(
    (item) => item.id === applicationId,
  );
  if (application)
    addActivity(
      application.dealershipId,
      application.customerId,
      "Note",
      `Finance status changed to ${application.status}.`,
    );
  saveDatabase();
  res.json(application);
});

app.get("/api/customers/:id/profile", (req, res) => {
  const customerId = Number(req.params.id);
  const customer = db.customers.find((item) => item.id === customerId);

  if (!customer) {
    res.status(404).json({ message: "Customer was not found" });
    return;
  }

  res.json({
    customer,
    financeApplications: db.financeApplications.filter(
      (item) => item.customerId === customerId,
    ),
    creditApplications: db.creditApplications.filter(
      (item) => item.customerId === customerId,
    ),
    tradeIns: db.tradeIns.filter((item) => item.customerId === customerId),
    vehicleSales: db.vehicleSales.filter(
      (item) => item.customerId === customerId,
    ),
    activities: db.activities.filter((item) => item.customerId === customerId),
    repairOrders: db.repairOrders.filter(
      (item) => item.customerId === customerId,
    ),
  });
});

app.post("/api/customers/:id/credit-applications", (req, res) => {
  const customerId = Number(req.params.id);
  const customer = db.customers.find((item) => item.id === customerId);

  if (!customer) {
    res.status(404).json({ message: "Customer was not found" });
    return;
  }
  if (!inScope(req.tenant, customer.dealershipId)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const creditApplication: CreditApplication = {
    id: Date.now(),
    dealershipId: customer.dealershipId,
    customerId,
    applicantName:
      req.body.applicantName || `${customer.firstName} ${customer.lastName}`,
    dateOfBirth: req.body.dateOfBirth || "",
    ssnLast4: req.body.ssnLast4 || "",
    driverLicenseNumber: req.body.driverLicenseNumber || "",
    driverLicenseState: req.body.driverLicenseState || "",
    driverLicenseExpiration: req.body.driverLicenseExpiration || "",
    address: req.body.address || "",
    city: req.body.city || "",
    state: req.body.state || "",
    zip: req.body.zip || "",
    residenceType: req.body.residenceType || "",
    timeAtAddress: req.body.timeAtAddress || "",
    employerName: req.body.employerName || "",
    employerAddress: req.body.employerAddress || "",
    jobTitle: req.body.jobTitle || "",
    employmentStatus: req.body.employmentStatus || "",
    timeOnJob: req.body.timeOnJob || "",
    monthlyIncome: Number(req.body.monthlyIncome || 0),
    otherIncome: Number(req.body.otherIncome || 0),
    bankName: req.body.bankName || "",
    downPayment: Number(req.body.downPayment || 0),
    requestedVehicle: req.body.requestedVehicle || customer.interestedVehicle,
    vehicleVin: req.body.vehicleVin || "",
    vehicleMileage: req.body.vehicleMileage || "",
    insuranceProvider: req.body.insuranceProvider || "",
    insurancePolicyNumber: req.body.insurancePolicyNumber || "",
    tradeTitleStatus: req.body.tradeTitleStatus || "Not Applicable",
    tradeRegistrationStatus:
      req.body.tradeRegistrationStatus || "Not Applicable",
    incomeDocsReceived: Boolean(req.body.incomeDocsReceived),
    identityDocsReceived: Boolean(req.body.identityDocsReceived),
    residenceDocsReceived: Boolean(req.body.residenceDocsReceived),
    insuranceDocsReceived: Boolean(req.body.insuranceDocsReceived),
    tradeDocsReceived: Boolean(req.body.tradeDocsReceived),
    submissionPlatform: req.body.submissionPlatform || "Internal CRM",
    consentToPullCredit: Boolean(req.body.consentToPullCredit),
    status: req.body.status || "Draft",
    submittedAt: new Date().toISOString(),
  };

  db.creditApplications = [creditApplication, ...db.creditApplications];
  db.financeApplications = [
    {
      id: Date.now() + 1,
      dealershipId: customer.dealershipId,
      customerId,
      employmentStatus: creditApplication.employmentStatus,
      monthlyIncome: creditApplication.monthlyIncome,
      creditRange: "Pending bureau",
      downPayment: creditApplication.downPayment,
      status: creditApplication.status === "Submitted" ? "Submitted" : "New",
    },
    ...db.financeApplications,
  ];
  addActivity(
    customer.dealershipId,
    customerId,
    "Note",
    "Full credit application added to profile.",
  );
  saveDatabase();

  res.status(201).json(creditApplication);
});

app.get("/api/trade-ins", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  res.json(
    ids === null
      ? db.tradeIns
      : db.tradeIns.filter((r) => ids.includes(r.dealershipId)),
  );
});

app.post("/api/trade-ins", (req, res) => {
  const tradeIn: TradeIn = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    customerId: Number(req.body.customerId),
    year: req.body.year,
    make: req.body.make,
    model: req.body.model,
    mileage: Number(req.body.mileage || 0),
    payoff: Number(req.body.payoff || 0),
    estimatedValue: Number(req.body.estimatedValue || 0),
    notes: req.body.notes || undefined,
  };

  db.tradeIns = [tradeIn, ...db.tradeIns];
  addActivity(
    tradeIn.dealershipId,
    tradeIn.customerId,
    "Note",
    `Trade-in added: ${tradeIn.year} ${tradeIn.make} ${tradeIn.model}.`,
  );
  saveDatabase();
  res.status(201).json(tradeIn);
});

app.get("/api/vehicle-sales", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  res.json(
    ids === null
      ? db.vehicleSales
      : db.vehicleSales.filter((r) => ids.includes(r.dealershipId)),
  );
});

app.post("/api/vehicle-sales", (req, res) => {
  const sale: VehicleSale = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    customerId: Number(req.body.customerId),
    stockNumber: req.body.stockNumber,
    year: req.body.year,
    make: req.body.make,
    model: req.body.model,
    salePrice: Number(req.body.salePrice || 0),
    stage: req.body.stage || "Working",
  };

  db.vehicleSales = [sale, ...db.vehicleSales];
  addActivity(
    sale.dealershipId,
    sale.customerId,
    "Appointment",
    `Vehicle deal added: ${sale.year} ${sale.make} ${sale.model}.`,
  );
  saveDatabase();
  res.status(201).json(sale);
});

app.patch("/api/vehicle-sales/:id/stage", (req, res) => {
  const saleId = Number(req.params.id);
  db.vehicleSales = db.vehicleSales.map((sale) =>
    sale.id === saleId ? { ...sale, stage: req.body.stage } : sale,
  );
  const sale = db.vehicleSales.find((item) => item.id === saleId);
  if (sale)
    addActivity(
      sale.dealershipId,
      sale.customerId,
      "Note",
      `Vehicle sale stage changed to ${sale.stage}.`,
    );
  saveDatabase();
  res.json(sale);
});

app.get("/api/repair-orders", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  res.json(
    ids === null
      ? db.repairOrders
      : db.repairOrders.filter((r) => ids.includes(r.dealershipId)),
  );
});

app.post("/api/repair-orders", (req, res) => {
  const ro: RepairOrder = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    roNumber: `RO-${String(Date.now()).slice(-6)}`,
    customerId: req.body.customerId ? Number(req.body.customerId) : undefined,
    customerName: req.body.customerName || "Walk-in",
    customerPhone: req.body.customerPhone || "",
    vehicleYear: req.body.vehicleYear || "",
    vehicleMake: req.body.vehicleMake || "",
    vehicleModel: req.body.vehicleModel || "",
    vehicleMileageIn: Number(req.body.vehicleMileageIn || 0),
    vehicleVin: req.body.vehicleVin || "",
    advisor: req.body.advisor || "",
    technician: req.body.technician || "",
    status: "Check-In",
    promisedTime: req.body.promisedTime || "",
    lines: req.body.lines || [],
    laborTotal: Number(req.body.laborTotal || 0),
    partsTotal: Number(req.body.partsTotal || 0),
    total: Number(req.body.total || 0),
    notes: req.body.notes || "",
    createdAt: new Date().toISOString(),
  };
  db.repairOrders = [ro, ...db.repairOrders];
  if (ro.customerId)
    addActivity(
      ro.dealershipId,
      ro.customerId,
      "Note",
      `Service RO ${ro.roNumber} opened.`,
    );
  saveDatabase();
  res.status(201).json(ro);
});

app.put("/api/repair-orders/:id", (req, res) => {
  const roId = Number(req.params.id);
  db.repairOrders = db.repairOrders.map((ro) =>
    ro.id === roId ? { ...ro, ...req.body, id: roId } : ro,
  );
  saveDatabase();
  res.json(db.repairOrders.find((ro) => ro.id === roId));
});

app.patch("/api/repair-orders/:id/status", (req, res) => {
  const roId = Number(req.params.id);
  const newStatus = req.body.status as RoStatus;
  db.repairOrders = db.repairOrders.map((ro) =>
    ro.id === roId
      ? {
          ...ro,
          status: newStatus,
          closedAt:
            newStatus === "Closed" ? new Date().toISOString() : ro.closedAt,
        }
      : ro,
  );
  const ro = db.repairOrders.find((r) => r.id === roId);
  if (ro?.customerId)
    addActivity(
      ro.dealershipId,
      ro.customerId,
      "Note",
      `Service RO ${ro.roNumber} → ${newStatus}.`,
    );
  saveDatabase();
  res.json(ro);
});

app.get("/api/activities", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  res.json(
    ids === null
      ? db.activities
      : db.activities.filter((r) => ids.includes(r.dealershipId)),
  );
});

app.post("/api/activities", (req, res) => {
  const activity: Activity = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    customerId: Number(req.body.customerId),
    type: req.body.type || "Note",
    note: req.body.note,
    createdAt: new Date().toISOString(),
  };

  db.activities = [activity, ...db.activities];
  saveDatabase();
  res.status(201).json(activity);
});

app.post("/api/tasks", (req, res) => {
  const task: CrmTask = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    customerId: Number(req.body.customerId),
    title: String(req.body.title || "Follow up"),
    type: req.body.type || "Follow-Up",
    dueAt: req.body.dueAt || new Date().toISOString(),
    assignedTo: String(req.body.assignedTo || ""),
    priority: req.body.priority || "Normal",
    status: "Open",
    createdAt: new Date().toISOString(),
  };
  db.tasks = [task, ...db.tasks];
  addActivity(
    task.dealershipId,
    task.customerId,
    "Note",
    `Task created: ${task.title}`,
  );
  saveDatabase();
  res.status(201).json(task);
});

app.patch("/api/tasks/:id/complete", (req, res) => {
  const taskId = Number(req.params.id);
  db.tasks = db.tasks.map((task) =>
    task.id === taskId
      ? { ...task, status: "Complete", completedAt: new Date().toISOString() }
      : task,
  );
  const task = db.tasks.find((item) => item.id === taskId);
  if (task) {
    addActivity(
      task.dealershipId,
      task.customerId,
      "Note",
      `Task completed: ${task.title}`,
    );
  }
  saveDatabase();
  res.json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const taskId = Number(req.params.id);
  db.tasks = db.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...req.body,
          customerId: Number(req.body.customerId ?? task.customerId),
        }
      : task,
  );
  const task = db.tasks.find((item) => item.id === taskId);
  if (task) {
    addActivity(
      task.dealershipId,
      task.customerId,
      "Note",
      `Task updated: ${task.title}`,
    );
  }
  saveDatabase();
  res.json(task);
});

app.post("/api/messages", (req, res) => {
  const message: Message = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    customerId: Number(req.body.customerId),
    channel: req.body.channel || "Text",
    direction: "Outbound",
    subject: req.body.subject || "",
    body: String(req.body.body || ""),
    template: req.body.template || "",
    status: "queued" as MessageStatus,
    toNumber: req.body.toNumber,
    toEmail: req.body.toEmail,
    fromEmail: req.body.fromEmail,
    sequenceId: req.body.sequenceId,
    sequenceStepIndex: req.body.sequenceStepIndex,
    createdAt: new Date().toISOString(),
  };
  db.messages = [message, ...db.messages];
  addActivity(
    message.dealershipId,
    message.customerId,
    message.channel,
    `${message.channel} sent${message.template ? ` (${message.template})` : ""}: ${message.body}`,
  );
  saveDatabase();
  res.status(201).json(message);
});

// ─── Communication Hub ────────────────────────────────────────────────────────

// GET thread for a customer
app.get("/api/messages", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const customerId = req.query.customerId ? Number(req.query.customerId) : null;
  let results =
    ids === null
      ? db.messages
      : db.messages.filter((m) => ids.includes(m.dealershipId));
  if (customerId) results = results.filter((m) => m.customerId === customerId);
  res.json(
    results.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  );
});

// PATCH message status (used by real webhook callbacks from Twilio/SendGrid)
app.patch("/api/messages/:id/status", (req, res) => {
  const id = Number(req.params.id);
  db.messages = db.messages.map((m) =>
    m.id === id
      ? {
          ...m,
          status: req.body.status as MessageStatus,
          providerSid: req.body.providerSid,
          updatedAt: new Date().toISOString(),
        }
      : m,
  );
  const msg = db.messages.find((m) => m.id === id);
  saveDatabase();
  res.json(msg ?? { error: "not found" });
});

// Simulate inbound SMS (in production this is a Twilio webhook POST /webhooks/sms)
app.post("/api/messages/simulate-inbound", (req, res) => {
  const { customerId, body, fromNumber } = req.body;
  const msg: Message = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    customerId: Number(customerId),
    channel: "Text",
    direction: "Inbound",
    body: String(body || ""),
    status: "received",
    fromNumber: String(fromNumber || ""),
    createdAt: new Date().toISOString(),
  };
  db.messages = [...db.messages, msg];
  saveDatabase();
  res.status(201).json(msg);
});

// ── Email / SMS Templates ─────────────────────────────────────────────────────
app.get("/api/email-templates", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  res.json(
    ids === null
      ? db.emailTemplates
      : db.emailTemplates.filter((t) => ids.includes(t.dealershipId)),
  );
});

app.post("/api/email-templates", (req, res) => {
  const tmpl: EmailTemplate = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    name: String(req.body.name || ""),
    subject: String(req.body.subject || ""),
    body: String(req.body.body || ""),
    channel: req.body.channel || "Text",
    createdAt: new Date().toISOString(),
  };
  db.emailTemplates = [tmpl, ...db.emailTemplates];
  saveDatabase();
  res.status(201).json(tmpl);
});

app.patch("/api/email-templates/:id", (req, res) => {
  const id = Number(req.params.id);
  db.emailTemplates = db.emailTemplates.map((t) =>
    t.id === id ? { ...t, ...req.body, id } : t,
  );
  res.json(db.emailTemplates.find((t) => t.id === id));
});

app.delete("/api/email-templates/:id", (req, res) => {
  db.emailTemplates = db.emailTemplates.filter(
    (t) => t.id !== Number(req.params.id),
  );
  saveDatabase();
  res.json({ ok: true });
});

// ── Sequences ─────────────────────────────────────────────────────────────────
app.get("/api/email-sequences", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  res.json(
    ids === null
      ? db.emailSequences
      : db.emailSequences.filter((s) => ids.includes(s.dealershipId)),
  );
});

app.post("/api/email-sequences", (req, res) => {
  const seq: EmailSequence = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    name: String(req.body.name || ""),
    triggerEvent: req.body.triggerEvent || "manual",
    steps: req.body.steps ?? [],
    active: req.body.active ?? true,
    createdAt: new Date().toISOString(),
  };
  db.emailSequences = [seq, ...db.emailSequences];
  saveDatabase();
  res.status(201).json(seq);
});

app.patch("/api/email-sequences/:id", (req, res) => {
  const id = Number(req.params.id);
  db.emailSequences = db.emailSequences.map((s) =>
    s.id === id ? { ...s, ...req.body, id } : s,
  );
  saveDatabase();
  res.json(db.emailSequences.find((s) => s.id === id));
});

// ── Sequence Enrollments ──────────────────────────────────────────────────────
app.get("/api/sequence-enrollments", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const customerId = req.query.customerId ? Number(req.query.customerId) : null;
  let results =
    ids === null
      ? db.sequenceEnrollments
      : db.sequenceEnrollments.filter((e) => ids.includes(e.dealershipId));
  if (customerId) results = results.filter((e) => e.customerId === customerId);
  res.json(results);
});

app.post("/api/sequence-enrollments", (req, res) => {
  const { customerId, sequenceId } = req.body;
  // Prevent duplicate active enrollment in same sequence
  const existing = db.sequenceEnrollments.find(
    (e) =>
      e.customerId === Number(customerId) &&
      e.sequenceId === Number(sequenceId) &&
      e.status === "active",
  );
  if (existing) {
    res.status(409).json({ message: "Already enrolled" });
    return;
  }
  const enrollment: SequenceEnrollment = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    customerId: Number(customerId),
    sequenceId: Number(sequenceId),
    enrolledAt: new Date().toISOString(),
    currentStepIndex: 0,
    status: "active",
  };
  db.sequenceEnrollments = [enrollment, ...db.sequenceEnrollments];
  saveDatabase();
  res.status(201).json(enrollment);
});

app.patch("/api/sequence-enrollments/:id/pause", (req, res) => {
  db.sequenceEnrollments = db.sequenceEnrollments.map((e) =>
    e.id === Number(req.params.id)
      ? { ...e, status: "paused" as EnrollmentStatus }
      : e,
  );
  saveDatabase();
  res.json({ ok: true });
});

app.patch("/api/sequence-enrollments/:id/unsubscribe", (req, res) => {
  db.sequenceEnrollments = db.sequenceEnrollments.map((e) =>
    e.id === Number(req.params.id)
      ? { ...e, status: "unsubscribed" as EnrollmentStatus }
      : e,
  );
  saveDatabase();
  res.json({ ok: true });
});

// ─── F&I Routes ───────────────────────────────────────────────────────────────

// Update deal structure (lender, rate, term, reserve, F&I products, compliance)
app.patch("/api/vehicle-sales/:id/deal", (req, res) => {
  const saleId = Number(req.params.id);
  const sale = db.vehicleSales.find((s) => s.id === saleId);
  if (!sale) {
    res.status(404).json({ message: "Deal not found" });
    return;
  }
  if (!inScope(req.tenant, sale.dealershipId)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const updated: VehicleSale = {
    ...sale,
    lender: req.body.lender ?? sale.lender,
    lenderContactName: req.body.lenderContactName ?? sale.lenderContactName,
    lenderPhone: req.body.lenderPhone ?? sale.lenderPhone,
    apr: req.body.apr !== undefined ? Number(req.body.apr) : sale.apr,
    termMonths:
      req.body.termMonths !== undefined
        ? Number(req.body.termMonths)
        : sale.termMonths,
    downPayment:
      req.body.downPayment !== undefined
        ? Number(req.body.downPayment)
        : sale.downPayment,
    tradeAllowance:
      req.body.tradeAllowance !== undefined
        ? Number(req.body.tradeAllowance)
        : sale.tradeAllowance,
    tradePayoff:
      req.body.tradePayoff !== undefined
        ? Number(req.body.tradePayoff)
        : sale.tradePayoff,
    dealerReserve:
      req.body.dealerReserve !== undefined
        ? Number(req.body.dealerReserve)
        : sale.dealerReserve,
    backEndGross:
      req.body.backEndGross !== undefined
        ? Number(req.body.backEndGross)
        : sale.backEndGross,
    fundingStatus: req.body.fundingStatus ?? sale.fundingStatus,
    fundingDate: req.body.fundingDate ?? sale.fundingDate,
    fiProducts: req.body.fiProducts ?? sale.fiProducts,
    ofacCleared:
      req.body.ofacCleared !== undefined
        ? Boolean(req.body.ofacCleared)
        : sale.ofacCleared,
    redFlagsCleared:
      req.body.redFlagsCleared !== undefined
        ? Boolean(req.body.redFlagsCleared)
        : sale.redFlagsCleared,
    truthInLendingPrinted:
      req.body.truthInLendingPrinted !== undefined
        ? Boolean(req.body.truthInLendingPrinted)
        : sale.truthInLendingPrinted,
    eContractSent:
      req.body.eContractSent !== undefined
        ? Boolean(req.body.eContractSent)
        : sale.eContractSent,
    eContractSigned:
      req.body.eContractSigned !== undefined
        ? Boolean(req.body.eContractSigned)
        : sale.eContractSigned,
    financeManagerId: req.body.financeManagerId ?? sale.financeManagerId,
    financeManagerName: req.body.financeManagerName ?? sale.financeManagerName,
    notes: req.body.notes ?? sale.notes,
  };

  db.vehicleSales = db.vehicleSales.map((s) => (s.id === saleId ? updated : s));

  // Auto-advance to Funded stage
  if (updated.fundingStatus === "Funded" && updated.stage !== "Delivered") {
    db.vehicleSales = db.vehicleSales.map((s) =>
      s.id === saleId
        ? {
            ...s,
            stage: "Delivered",
            fundingDate: s.fundingDate ?? new Date().toISOString(),
          }
        : s,
    );
  }

  addActivity(
    sale.dealershipId,
    sale.customerId,
    "Note",
    `Deal updated — Lender: ${updated.lender ?? "TBD"}, Status: ${updated.fundingStatus ?? "Pending"}`,
  );
  saveDatabase();
  res.json(db.vehicleSales.find((s) => s.id === saleId));
});

// Update stipulations on a deal
app.patch("/api/vehicle-sales/:id/stips", (req, res) => {
  const saleId = Number(req.params.id);
  const sale = db.vehicleSales.find((s) => s.id === saleId);
  if (!sale) {
    res.status(404).json({ message: "Deal not found" });
    return;
  }
  if (!inScope(req.tenant, sale.dealershipId)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  const stips: DealStip[] = req.body.stips ?? sale.stips ?? [];
  db.vehicleSales = db.vehicleSales.map((s) =>
    s.id === saleId ? { ...s, stips } : s,
  );
  saveDatabase();
  res.json(db.vehicleSales.find((s) => s.id === saleId));
});

// Funding dashboard — all active deals in the F&I queue
app.get("/api/funding-dashboard", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const activeSales = (
    ids === null
      ? db.vehicleSales
      : db.vehicleSales.filter((s) => ids.includes(s.dealershipId))
  ).filter((s) => s.stage !== "Working");

  const totalReserve = activeSales.reduce(
    (sum, s) => sum + (s.dealerReserve ?? 0),
    0,
  );
  const totalBackEnd = activeSales.reduce(
    (sum, s) => sum + (s.backEndGross ?? 0),
    0,
  );
  const totalFiRevenue = activeSales.reduce(
    (sum, s) =>
      sum + (s.fiProducts ?? []).reduce((ps, p) => ps + p.retailPrice, 0),
    0,
  );

  const byStatus = activeSales.reduce<Record<string, number>>((acc, s) => {
    const key = s.fundingStatus ?? "Pending Structure";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const pendingStips = activeSales.filter((s) =>
    (s.stips ?? []).some((st) => !st.received),
  );

  res.json({
    totalDeals: activeSales.length,
    totalReserve,
    totalBackEnd,
    totalFiRevenue,
    byStatus,
    pendingStipsCount: pendingStips.length,
    deals: activeSales.map((s) => {
      const customer = db.customers.find((c) => c.id === s.customerId);
      return {
        ...s,
        customerName: customer
          ? `${customer.firstName} ${customer.lastName}`
          : "Unknown",
        pendingStips: (s.stips ?? []).filter((st) => !st.received).length,
        fiRevenue: (s.fiProducts ?? []).reduce(
          (sum, p) => sum + p.retailPrice,
          0,
        ),
        fiGross: (s.fiProducts ?? []).reduce(
          (sum, p) => sum + (p.retailPrice - p.dealerCost),
          0,
        ),
      };
    }),
  });
});

// F&I Product catalog
app.get("/api/fi-products", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const results = (
    ids === null
      ? db.fiProducts
      : db.fiProducts.filter((p) => ids.includes(p.dealershipId))
  ).filter((p) => p.active);
  res.json(results);
});

app.post("/api/fi-products", (req, res) => {
  if (!hasRank(req.tenant.role, "FinanceManager")) {
    res.status(403).json({ message: "Finance Manager or above required" });
    return;
  }
  const product: FiProduct = {
    id: Date.now(),
    dealershipId: req.tenant.dealershipId,
    category: req.body.category,
    name: String(req.body.name || "").trim(),
    providerName: String(req.body.providerName || "").trim(),
    termMonths: req.body.termMonths ? Number(req.body.termMonths) : undefined,
    mileageLimit: req.body.mileageLimit
      ? Number(req.body.mileageLimit)
      : undefined,
    dealerCost: Number(req.body.dealerCost || 0),
    retailPrice: Number(req.body.retailPrice || 0),
    retailCap: Number(req.body.retailCap || req.body.retailPrice || 0),
    minProfit: Number(req.body.minProfit || 0),
    active: true,
  };
  db.fiProducts = [product, ...db.fiProducts];
  saveDatabase();
  res.status(201).json(product);
});

app.patch("/api/fi-products/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.fiProducts.find((p) => p.id === id);
  if (!existing) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  if (
    !inScope(req.tenant, existing.dealershipId) ||
    !hasRank(req.tenant.role, "FinanceManager")
  ) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  const updated: FiProduct = {
    ...existing,
    ...req.body,
    id: existing.id,
    dealershipId: existing.dealershipId,
  };
  db.fiProducts = db.fiProducts.map((p) => (p.id === id ? updated : p));
  saveDatabase();
  res.json(updated);
});

// ── Lenders ──────────────────────────────────────────────────────────────────
app.get("/api/lenders", (req, res) => {
  const ids = visibleDealershipIds(req.tenant);
  const results = (
    ids === null
      ? db.lenders
      : db.lenders.filter((l) => ids.includes(l.dealershipId))
  ).filter((l) => l.active);
  res.json(results);
});

// ── Submit deal to lenders (shotgun) ─────────────────────────────────────────
app.post("/api/vehicle-sales/:id/submit-lenders", (req, res) => {
  const id = Number(req.params.id);
  const sale = db.vehicleSales.find((s) => s.id === id);
  if (!sale) {
    res.status(404).json({ message: "Deal not found" });
    return;
  }
  if (
    !inScope(req.tenant, sale.dealershipId) ||
    !hasRank(req.tenant.role, "FinanceManager")
  ) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  const lenderIds: number[] = Array.isArray(req.body.lenderIds)
    ? req.body.lenderIds
    : [];
  if (!lenderIds.length) {
    res.status(400).json({ message: "No lenders selected" });
    return;
  }

  const existingIds = new Set(
    (sale.lenderSubmissions ?? []).map((s) => s.lenderId),
  );
  const newSubs: LenderSubmission[] = lenderIds
    .filter((lid) => !existingIds.has(lid))
    .map((lid) => {
      const lender = db.lenders.find((l) => l.id === lid);
      return {
        id: Date.now() + lid,
        vehicleSaleId: id,
        dealershipId: sale.dealershipId,
        lenderId: lid,
        lenderName: lender?.name ?? `Lender ${lid}`,
        submittedAt: new Date().toISOString(),
        status: "Pending" as LenderDecisionStatus,
      };
    });

  const updated: VehicleSale = {
    ...sale,
    fundingStatus: "Submitted to Lender",
    lenderSubmissions: [...(sale.lenderSubmissions ?? []), ...newSubs],
  };
  db.vehicleSales = db.vehicleSales.map((s) => (s.id === id ? updated : s));
  saveDatabase();

  // Simulate async lender responses (in production this would be a webhook)
  setTimeout(() => {
    const current = db.vehicleSales.find((s) => s.id === id);
    if (!current) return;
    const simulatedSubs = (current.lenderSubmissions ?? []).map((sub) => {
      if (sub.status !== "Pending") return sub;
      const lender = db.lenders.find((l) => l.id === sub.lenderId);
      const rand = Math.random();
      if (rand < 0.55) {
        return {
          ...sub,
          status: "Approved" as LenderDecisionStatus,
          approvedRate: parseFloat(
            (
              (lender?.tier === "Prime"
                ? 5
                : lender?.tier === "Near-Prime"
                  ? 8
                  : 12) +
              Math.random() * 2
            ).toFixed(2),
          ),
          approvedTerm: lender?.maxTermMonths ?? 72,
          approvedAmount: sale.salePrice * 1.1,
          maxLtv: lender?.maxLtv,
          decidedAt: new Date().toISOString(),
        };
      } else if (rand < 0.75) {
        return {
          ...sub,
          status: "Countered" as LenderDecisionStatus,
          counterConditions:
            "Requires $1,500 additional down payment or shorter term of 60 months.",
          decidedAt: new Date().toISOString(),
        };
      } else {
        return {
          ...sub,
          status: "Declined" as LenderDecisionStatus,
          declineReason: "Debt-to-income ratio exceeds guideline.",
          decidedAt: new Date().toISOString(),
        };
      }
    });
    db.vehicleSales = db.vehicleSales.map((s) =>
      s.id === id ? { ...s, lenderSubmissions: simulatedSubs } : s,
    );
    saveDatabase();
  }, 3000);

  res.json(updated);
});

// ── Accept a lender decision & import terms ───────────────────────────────────
app.post("/api/vehicle-sales/:id/accept-submission", (req, res) => {
  const id = Number(req.params.id);
  const sale = db.vehicleSales.find((s) => s.id === id);
  if (!sale) {
    res.status(404).json({ message: "Deal not found" });
    return;
  }
  if (
    !inScope(req.tenant, sale.dealershipId) ||
    !hasRank(req.tenant.role, "FinanceManager")
  ) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  const submissionId = Number(req.body.submissionId);
  const sub = (sale.lenderSubmissions ?? []).find((s) => s.id === submissionId);
  if (!sub || sub.status !== "Approved") {
    res.status(400).json({ message: "Submission not found or not approved" });
    return;
  }
  const updated: VehicleSale = {
    ...sale,
    lender: sub.lenderName,
    apr: sub.approvedRate,
    termMonths: sub.approvedTerm,
    fundingStatus: "Approved",
    acceptedSubmissionId: submissionId,
  };
  db.vehicleSales = db.vehicleSales.map((s) => (s.id === id ? updated : s));
  saveDatabase();
  res.json(updated);
});

app.listen(port, () => {
  console.log(`Auto Retail CRM API running on port ${port}`);
});
