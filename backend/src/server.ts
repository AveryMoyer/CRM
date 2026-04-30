import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "Lead" | "Appointment" | "Finance" | "Sold";
  interestedVehicle: string;
};

type FinanceApplication = {
  id: number;
  customerId: number;
  employmentStatus: string;
  monthlyIncome: number;
  creditRange: string;
  downPayment: number;
  status: "New" | "Submitted" | "Approved" | "Needs Review";
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

let customers: Customer[] = [
  {
    id: 1,
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan@example.com",
    phone: "(555) 123-0148",
    status: "Appointment",
    interestedVehicle: "2024 Toyota Camry",
  },
  {
    id: 2,
    firstName: "Taylor",
    lastName: "Smith",
    email: "taylor@example.com",
    phone: "(555) 981-4432",
    status: "Finance",
    interestedVehicle: "2023 Ford F-150",
  },
];

let financeApplications: FinanceApplication[] = [
  {
    id: 1,
    customerId: 2,
    employmentStatus: "Full-time",
    monthlyIncome: 6200,
    creditRange: "680-719",
    downPayment: 3500,
    status: "Submitted",
  },
];

let tradeIns: TradeIn[] = [
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
];

let vehicleSales: VehicleSale[] = [
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
];

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auto-retail-crm-api" });
});

app.post("/api/login", (req, res) => {
  const email = String(req.body.email || "");
  const password = String(req.body.password || "");

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  res.json({
    token: "demo-token",
    user: { name: "Avery Moyer", role: "Sales Manager", email },
  });
});

app.get("/api/summary", (_req, res) => {
  const pipelineValue = vehicleSales.reduce((total, sale) => total + sale.salePrice, 0);
  const financePending = financeApplications.filter((application) => application.status !== "Approved").length;

  res.json({
    customers: customers.length,
    financeApplications: financeApplications.length,
    tradeIns: tradeIns.length,
    vehicleSales: vehicleSales.length,
    pipelineValue,
    financePending,
  });
});

app.get("/api/customers", (_req, res) => {
  res.json(customers);
});

app.post("/api/customers", (req, res) => {
  const customer: Customer = {
    id: Date.now(),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    status: req.body.status || "Lead",
    interestedVehicle: req.body.interestedVehicle || "",
  };

  customers = [customer, ...customers];
  res.status(201).json(customer);
});

app.put("/api/customers/:id", (req, res) => {
  const customerId = Number(req.params.id);
  customers = customers.map((customer) =>
    customer.id === customerId ? { ...customer, ...req.body, id: customerId } : customer,
  );
  res.json(customers.find((customer) => customer.id === customerId));
});

app.delete("/api/customers/:id", (req, res) => {
  const customerId = Number(req.params.id);
  customers = customers.filter((customer) => customer.id !== customerId);
  financeApplications = financeApplications.filter((application) => application.customerId !== customerId);
  tradeIns = tradeIns.filter((tradeIn) => tradeIn.customerId !== customerId);
  vehicleSales = vehicleSales.filter((sale) => sale.customerId !== customerId);
  res.status(204).send();
});

app.get("/api/finance-applications", (_req, res) => {
  res.json(financeApplications);
});

app.post("/api/finance-applications", (req, res) => {
  const application: FinanceApplication = {
    id: Date.now(),
    customerId: Number(req.body.customerId),
    employmentStatus: req.body.employmentStatus,
    monthlyIncome: Number(req.body.monthlyIncome || 0),
    creditRange: req.body.creditRange,
    downPayment: Number(req.body.downPayment || 0),
    status: req.body.status || "New",
  };

  financeApplications = [application, ...financeApplications];
  res.status(201).json(application);
});

app.get("/api/trade-ins", (_req, res) => {
  res.json(tradeIns);
});

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

  tradeIns = [tradeIn, ...tradeIns];
  res.status(201).json(tradeIn);
});

app.get("/api/vehicle-sales", (_req, res) => {
  res.json(vehicleSales);
});

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

  vehicleSales = [sale, ...vehicleSales];
  res.status(201).json(sale);
});

app.listen(port, () => {
  console.log(`Auto Retail CRM API running on port ${port}`);
});
