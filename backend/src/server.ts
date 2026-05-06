import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import helmet from "helmet";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const dataFile = join(process.cwd(), "data", "crm-data.json");

type Customer = {
  id: number;
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
};

type VehicleSale = {
  id: number;
  customerId: number;
  stockNumber: string;
  year: string;
  make: string;
  model: string;
  salePrice: number;
  stage: "Working" | "Finance" | "Delivered";
};

type Activity = {
  id: number;
  customerId: number;
  type: "Call" | "Text" | "Email" | "Appointment" | "Note";
  note: string;
  createdAt: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
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

type Database = {
  users: User[];
  customers: Customer[];
  financeApplications: FinanceApplication[];
  creditApplications: CreditApplication[];
  tradeIns: TradeIn[];
  vehicleSales: VehicleSale[];
  activities: Activity[];
  repairOrders: RepairOrder[];
};

const defaultDatabase: Database = {
  users: [
    {
      id: 1,
      name: "Avery Moyer",
      email: "avery@example.com",
      password: "password",
      role: "Sales Manager",
    },
  ],
  customers: [
    {
      id: 1,
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
  ],
  financeApplications: [
    {
      id: 1,
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
      customerId: 2,
      applicantName: "Taylor Smith",
      dateOfBirth: "1991-06-12",
      ssnLast4: "1234",
      address: "100 Main Street",
      city: "Columbus",
      state: "OH",
      zip: "43004",
      residenceType: "Rent",
      timeAtAddress: "2 years",
      employerName: "Smith Logistics",
      jobTitle: "Operations Lead",
      employmentStatus: "Full-time",
      timeOnJob: "4 years",
      monthlyIncome: 6200,
      otherIncome: 0,
      bankName: "Local Credit Union",
      downPayment: 3500,
      requestedVehicle: "2023 Ford F-150",
      consentToPullCredit: true,
      status: "Submitted",
      submittedAt: new Date().toISOString(),
    },
  ],
  tradeIns: [
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
  ],
  vehicleSales: [
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
  ],
  activities: [
    {
      id: 1,
      customerId: 1,
      type: "Appointment",
      note: "Scheduled test drive for Camry.",
      createdAt: new Date().toISOString(),
    },
  ],
  repairOrders: [
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
};

function loadDatabase(): Database {
  if (!existsSync(dataFile)) {
    return defaultDatabase;
  }
  const saved = JSON.parse(readFileSync(dataFile, "utf8"));
  return {
    ...defaultDatabase,
    ...saved,
    repairOrders: saved.repairOrders ?? defaultDatabase.repairOrders,
  };
}

let db = loadDatabase();

function saveDatabase() {
  mkdirSync(dirname(dataFile), { recursive: true });
  writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

function addActivity(customerId: number, type: Activity["type"], note: string) {
  db.activities = [
    {
      id: Date.now(),
      customerId,
      type,
      note,
      createdAt: new Date().toISOString(),
    },
    ...db.activities,
  ];
}

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auto-retail-crm-api" });
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

  const user: User = {
    id: Date.now(),
    name,
    email,
    password,
    role: "Sales Consultant",
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
    },
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

  res.json({
    token: `demo-token-${user.id}`,
    user: { id: user.id, name: user.name, role: user.role, email: user.email },
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

app.get("/api/bootstrap", (_req, res) => {
  res.json(db);
});

app.get("/api/summary", (_req, res) => {
  const pipelineValue = db.vehicleSales.reduce(
    (total, sale) => total + sale.salePrice,
    0,
  );
  const deliveredValue = db.vehicleSales
    .filter((sale) => sale.stage === "Delivered")
    .reduce((total, sale) => total + sale.salePrice, 0);
  const financePending = db.financeApplications.filter(
    (application) => application.status !== "Approved",
  ).length;
  const appointmentCount = db.customers.filter(
    (customer) =>
      customer.status === "Appt Set" || customer.status === "Appt Show",
  ).length;

  const openROs = db.repairOrders.filter((ro) => ro.status !== "Closed").length;
  const readyROs = db.repairOrders.filter((ro) => ro.status === "Ready").length;

  res.json({
    customers: db.customers.length,
    financeApplications: db.financeApplications.length,
    tradeIns: db.tradeIns.length,
    vehicleSales: db.vehicleSales.length,
    pipelineValue,
    deliveredValue,
    financePending,
    appointmentCount,
    openROs,
    readyROs,
  });
});

app.get("/api/customers", (_req, res) => res.json(db.customers));

app.post("/api/customers", (req, res) => {
  const customer: Customer = {
    id: Date.now(),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email || "",
    phone: req.body.phone,
    status: req.body.status || "Lead",
    interestedVehicle: req.body.interestedVehicle || "",
    source: req.body.source || "Manual Entry",
    assignedTo: req.body.assignedTo || "Avery",
    nextFollowUp: req.body.nextFollowUp || "Not scheduled",
  };

  db.customers = [customer, ...db.customers];
  addActivity(customer.id, "Note", "Customer record created.");
  saveDatabase();
  res.status(201).json(customer);
});

app.put("/api/customers/:id", (req, res) => {
  const customerId = Number(req.params.id);
  db.customers = db.customers.map((customer) =>
    customer.id === customerId
      ? { ...customer, ...req.body, id: customerId }
      : customer,
  );
  addActivity(customerId, "Note", "Customer record updated.");
  saveDatabase();
  res.json(db.customers.find((customer) => customer.id === customerId));
});

app.delete("/api/customers/:id", (req, res) => {
  const customerId = Number(req.params.id);
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

app.get("/api/finance-applications", (_req, res) =>
  res.json(db.financeApplications),
);

app.post("/api/finance-applications", (req, res) => {
  const application: FinanceApplication = {
    id: Date.now(),
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

  const creditApplication: CreditApplication = {
    id: Date.now(),
    customerId,
    applicantName:
      req.body.applicantName || `${customer.firstName} ${customer.lastName}`,
    dateOfBirth: req.body.dateOfBirth || "",
    ssnLast4: req.body.ssnLast4 || "",
    address: req.body.address || "",
    city: req.body.city || "",
    state: req.body.state || "",
    zip: req.body.zip || "",
    residenceType: req.body.residenceType || "",
    timeAtAddress: req.body.timeAtAddress || "",
    employerName: req.body.employerName || "",
    jobTitle: req.body.jobTitle || "",
    employmentStatus: req.body.employmentStatus || "",
    timeOnJob: req.body.timeOnJob || "",
    monthlyIncome: Number(req.body.monthlyIncome || 0),
    otherIncome: Number(req.body.otherIncome || 0),
    bankName: req.body.bankName || "",
    downPayment: Number(req.body.downPayment || 0),
    requestedVehicle: req.body.requestedVehicle || customer.interestedVehicle,
    consentToPullCredit: Boolean(req.body.consentToPullCredit),
    status: req.body.status || "Draft",
    submittedAt: new Date().toISOString(),
  };

  db.creditApplications = [creditApplication, ...db.creditApplications];
  db.financeApplications = [
    {
      id: Date.now() + 1,
      customerId,
      employmentStatus: creditApplication.employmentStatus,
      monthlyIncome: creditApplication.monthlyIncome,
      creditRange: "Pending bureau",
      downPayment: creditApplication.downPayment,
      status: creditApplication.status === "Submitted" ? "Submitted" : "New",
    },
    ...db.financeApplications,
  ];
  addActivity(customerId, "Note", "Full credit application added to profile.");
  saveDatabase();

  res.status(201).json(creditApplication);
});

app.get("/api/trade-ins", (_req, res) => res.json(db.tradeIns));

app.post("/api/trade-ins", (req, res) => {
  const tradeIn: TradeIn = {
    id: Date.now(),
    customerId: Number(req.body.customerId),
    year: req.body.year,
    make: req.body.make,
    model: req.body.model,
    mileage: Number(req.body.mileage || 0),
    payoff: Number(req.body.payoff || 0),
    estimatedValue: Number(req.body.estimatedValue || 0),
  };

  db.tradeIns = [tradeIn, ...db.tradeIns];
  addActivity(
    tradeIn.customerId,
    "Note",
    `Trade-in added: ${tradeIn.year} ${tradeIn.make} ${tradeIn.model}.`,
  );
  saveDatabase();
  res.status(201).json(tradeIn);
});

app.get("/api/vehicle-sales", (_req, res) => res.json(db.vehicleSales));

app.post("/api/vehicle-sales", (req, res) => {
  const sale: VehicleSale = {
    id: Date.now(),
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
      sale.customerId,
      "Note",
      `Vehicle sale stage changed to ${sale.stage}.`,
    );
  saveDatabase();
  res.json(sale);
});

app.get("/api/repair-orders", (_req, res) => res.json(db.repairOrders));

app.post("/api/repair-orders", (req, res) => {
  const ro: RepairOrder = {
    id: Date.now(),
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
    addActivity(ro.customerId, "Note", `Service RO ${ro.roNumber} opened.`);
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
      ro.customerId,
      "Note",
      `Service RO ${ro.roNumber} → ${newStatus}.`,
    );
  saveDatabase();
  res.json(ro);
});

app.get("/api/activities", (_req, res) => res.json(db.activities));

app.post("/api/activities", (req, res) => {
  const activity: Activity = {
    id: Date.now(),
    customerId: Number(req.body.customerId),
    type: req.body.type || "Note",
    note: req.body.note,
    createdAt: new Date().toISOString(),
  };

  db.activities = [activity, ...db.activities];
  saveDatabase();
  res.status(201).json(activity);
});

app.listen(port, () => {
  console.log(`Auto Retail CRM API running on port ${port}`);
});
