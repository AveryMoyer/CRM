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
  status: "Lead" | "Appointment" | "Finance" | "Sold";
  interestedVehicle: string;
  source: string;
  assignedTo: string;
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
      status: "Appointment",
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
      status: "Finance",
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
};

function loadDatabase(): Database {
  if (!existsSync(dataFile)) {
    return defaultDatabase;
  }

  return { ...defaultDatabase, ...JSON.parse(readFileSync(dataFile, "utf8")) };
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
      res
        .status(404)
        .json({
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
    (customer) => customer.status === "Appointment",
  ).length;

  res.json({
    customers: db.customers.length,
    financeApplications: db.financeApplications.length,
    tradeIns: db.tradeIns.length,
    vehicleSales: db.vehicleSales.length,
    pipelineValue,
    deliveredValue,
    financePending,
    appointmentCount,
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
