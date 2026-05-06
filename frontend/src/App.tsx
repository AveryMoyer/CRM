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
} from "lucide-react";
import "./styles/global.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "Lead" | "Appointment" | "Finance" | "Sold";
  interestedVehicle: string;
  source?: string;
  assignedTo?: string;
  nextFollowUp?: string;
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

type BootstrapData = {
  customers: Customer[];
  financeApplications: FinanceApplication[];
  creditApplications: CreditApplication[];
  tradeIns: TradeIn[];
  vehicleSales: VehicleSale[];
  activities: Activity[];
};

type ProfileTab = "overview" | "finance" | "credit" | "deals" | "activity";
type AppPage =
  | "dashboard"
  | "leads"
  | "customers"
  | "finance"
  | "pipeline"
  | "trades"
  | "vin"
  | "activities"
  | "desk";

const API_BASE = "http://localhost:4000";

// ── Seed data ─────────────────────────────────────────────────────────────────

const initialCustomers: Customer[] = [
  {
    id: 1,
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan@example.com",
    phone: "(555) 123-0148",
    status: "Appointment",
    interestedVehicle: "2024 Toyota Camry",
    source: "Cars.com",
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
  {
    id: 3,
    firstName: "Morgan",
    lastName: "Davis",
    email: "morgan@example.com",
    phone: "(555) 234-5678",
    status: "Lead",
    interestedVehicle: "2024 Honda CR-V",
    source: "Website Lead",
    assignedTo: "",
    nextFollowUp: "",
  },
  {
    id: 4,
    firstName: "Casey",
    lastName: "Johnson",
    email: "casey@example.com",
    phone: "(555) 345-6789",
    status: "Lead",
    interestedVehicle: "2023 Chevy Silverado",
    source: "AutoTrader",
    assignedTo: "",
    nextFollowUp: "",
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
  },
  {
    id: 6,
    firstName: "Alex",
    lastName: "Brown",
    email: "alex@example.com",
    phone: "(555) 567-8901",
    status: "Lead",
    interestedVehicle: "2024 Jeep Wrangler",
    source: "Cars.com",
    assignedTo: "",
    nextFollowUp: "",
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

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("crm-authenticated") === "true",
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [profileTab, setProfileTab] = useState<ProfileTab>("overview");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("All");
  const [customerSourceFilter, setCustomerSourceFilter] = useState("All");
  const [quickActivityNote, setQuickActivityNote] = useState("");
  const [quickActivityType, setQuickActivityType] =
    useState<Activity["type"]>("Note");

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
    status: "Lead" as Customer["status"],
    interestedVehicle: "",
    source: "",
    assignedTo: "",
    nextFollowUp: "",
  });
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
    year: "",
    make: "",
    model: "",
    mileage: "",
    payoff: "",
    estimatedValue: "",
  });
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
    const terms = [36, 48, 60, 72, 84];
    const downs = [0, 1000, 2000, 3000, 5000];
    const base = deskNumbers.financed + (parseFloat(desk.downPayment) || 0);
    const aprM = parseFloat(desk.apr) / 100 / 12;
    return terms.map((term) => ({
      term,
      payments: downs.map((down) => {
        const amt = base - down;
        if (amt <= 0 || aprM === 0) return 0;
        return (amt * aprM) / (1 - Math.pow(1 + aprM, -term));
      }),
    }));
  }, [deskNumbers.financed, desk.downPayment, desk.apr]);

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
    (c) => c.status === "Appointment",
  ).length;
  const soldCount = customers.filter((c) => c.status === "Sold").length;
  const totalLeads = customers.filter((c) => c.status === "Lead").length;
  const closingRatio = customers.length
    ? Math.round((soldCount / customers.length) * 100)
    : 0;

  const urgentLeads = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.status === "Lead" && !activities.some((a) => a.customerId === c.id),
      ),
    [customers, activities],
  );

  const internetLeads = useMemo(
    () =>
      customers
        .filter((c) => {
          const src = (c.source || "").toLowerCase();
          return (
            c.status === "Lead" ||
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
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const matchSearch =
        !q ||
        name.includes(q) ||
        c.phone.includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.interestedVehicle || "").toLowerCase().includes(q);
      const matchStatus =
        customerStatusFilter === "All" || c.status === customerStatusFilter;
      const matchSource =
        customerSourceFilter === "All" ||
        (c.source || "")
          .toLowerCase()
          .includes(customerSourceFilter.toLowerCase());
      return matchSearch && matchStatus && matchSource;
    });
  }, [customers, customerSearch, customerStatusFilter, customerSourceFilter]);

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
  const profileActivities = selectedCustomer
    ? activities
        .filter((a) => a.customerId === selectedCustomer.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    : [];

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    function syncRoute() {
      const hash = window.location.hash;
      const match = hash.match(/^#\/customers\/(\d+)/);
      if (match) {
        setSelectedCustomerId(Number(match[1]));
        return;
      }
      setSelectedCustomerId(null);
      const page = hash.replace("#/", "") as AppPage;
      const valid: AppPage[] = [
        "dashboard",
        "leads",
        "customers",
        "finance",
        "pipeline",
        "trades",
        "vin",
        "activities",
        "desk",
      ];
      setCurrentPage(valid.includes(page) ? page : "dashboard");
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
        setCustomers(d.customers);
        setFinanceApplications(d.financeApplications);
        setCreditApplications(d.creditApplications || []);
        setTradeIns(d.tradeIns);
        setVehicleSales(d.vehicleSales);
        setActivities(d.activities);
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
    const c = customers.find((c) => c.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "Unknown";
  }
  function statusClass(s: string) {
    return (
      (
        {
          Lead: "badge-lead",
          Appointment: "badge-appt",
          Finance: "badge-finance",
          Sold: "badge-sold",
        } as Record<string, string>
      )[s] ?? ""
    );
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
      if (authMode === "signup") {
        setAuthMessage("Account created. You can now log in.");
        setAuthMode("login");
        return;
      }
      const boot = await fetch(`${API_BASE}/api/bootstrap`);
      const bd: BootstrapData = await boot.json();
      setCustomers(bd.customers);
      setFinanceApplications(bd.financeApplications);
      setCreditApplications(bd.creditApplications || []);
      setTradeIns(bd.tradeIns);
      setVehicleSales(bd.vehicleSales);
      setActivities(bd.activities);
      localStorage.setItem("crm-authenticated", "true");
      setIsLoggedIn(true);
    } catch {
      setAuthError("Cannot connect to backend. Make sure it is running.");
    }
  }

  // ── Customer CRUD ─────────────────────────────────────────────────────────

  function resetCustomerForm() {
    setEditingCustomerId(null);
    setCustomerForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      status: "Lead",
      interestedVehicle: "",
      source: "",
      assignedTo: "",
      nextFollowUp: "",
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
    });
    window.scrollTo(0, 0);
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingCustomerId) {
      const res = await fetch(
        `${API_BASE}/api/customers/${editingCustomerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerForm),
        },
      );
      const updated = await res.json();
      setCustomers(
        customers.map((c) => (c.id === editingCustomerId ? updated : c)),
      );
      resetCustomerForm();
      setAppMessage("Customer updated.");
    } else {
      const res = await fetch(`${API_BASE}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      const created = await res.json();
      setCustomers([created, ...customers]);
      resetCustomerForm();
      setAppMessage("Customer added.");
    }
  }

  async function deleteCustomer(id: number) {
    await fetch(`${API_BASE}/api/customers/${id}`, { method: "DELETE" });
    setCustomers(customers.filter((c) => c.id !== id));
    setAppMessage("Customer removed.");
  }

  async function assignLead(customer: Customer, assignedTo: string) {
    const res = await fetch(`${API_BASE}/api/customers/${customer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...customer, assignedTo, status: "Appointment" }),
    });
    const updated = await res.json();
    setCustomers(customers.map((c) => (c.id === customer.id ? updated : c)));
    setAppMessage(`Lead assigned to ${assignedTo}.`);
  }

  // ── Finance ───────────────────────────────────────────────────────────────

  async function addFinanceApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch(`${API_BASE}/api/finance-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(financeForm),
    });
    const app = await res.json();
    setFinanceApplications([app, ...financeApplications]);
    setAppMessage("Finance application submitted.");
    setProfileTab("deals");
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
    const res = await fetch(
      `${API_BASE}/api/customers/${selectedCustomer.id}/credit-applications`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creditForm),
      },
    );
    const app = await res.json();
    setCreditApplications([app, ...creditApplications]);
    setProfileTab("deals");
    setAppMessage("Credit application saved.");
  }

  // ── Trade / Sales ─────────────────────────────────────────────────────────

  async function addTradeIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch(`${API_BASE}/api/trade-ins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tradeForm),
    });
    const trade = await res.json();
    setTradeIns([trade, ...tradeIns]);
    setAppMessage("Trade-in added.");
  }

  async function addVehicleSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch(`${API_BASE}/api/vehicle-sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleForm),
    });
    const sale = await res.json();
    setVehicleSales([sale, ...vehicleSales]);
    setAppMessage("Vehicle added to pipeline.");
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
    const res = await fetch(`${API_BASE}/api/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activityForm),
    });
    const act = await res.json();
    setActivities([act, ...activities]);
    setActivityForm({ ...activityForm, note: "" });
    setAppMessage("Activity logged.");
  }

  async function addQuickActivity() {
    if (!selectedCustomer || !quickActivityNote) return;
    const payload = {
      customerId: String(selectedCustomer.id),
      type: quickActivityType,
      note: quickActivityNote,
    };
    const res = await fetch(`${API_BASE}/api/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const act = await res.json();
    setActivities([act, ...activities]);
    setQuickActivityNote("");
    setAppMessage("Activity logged.");
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

  if (selectedCustomerId) {
    return (
      <main className="app-shell">
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
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                window.location.hash = "#/customers";
              }}
            >
              ← All Customers
            </button>
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
                    "activity",
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
                    {tab === "activity" &&
                      `Activity${profileActivities.length ? ` (${profileActivities.length})` : ""}`}
                  </button>
                ))}
              </div>

              {profileTab === "overview" && (
                <div className="overview-layout">
                  <div className="profile-grid">
                    <div className="profile-card">
                      <p className="card-label">Vehicle of Interest</p>
                      <strong>
                        {selectedCustomer.interestedVehicle || "Not specified"}
                      </strong>
                    </div>
                    <div className="profile-card">
                      <p className="card-label">Lead Source</p>
                      <strong>{selectedCustomer.source || "Walk-in"}</strong>
                    </div>
                    <div className="profile-card">
                      <p className="card-label">Assigned Rep</p>
                      <strong>
                        {selectedCustomer.assignedTo || "Unassigned"}
                      </strong>
                    </div>
                    <div className="profile-card">
                      <p className="card-label">Next Follow-Up</p>
                      <strong>
                        {selectedCustomer.nextFollowUp || "Not scheduled"}
                      </strong>
                    </div>
                    <div className="profile-card">
                      <p className="card-label">Finance Apps</p>
                      <strong>{profileFinance.length}</strong>
                    </div>
                    <div className="profile-card">
                      <p className="card-label">Trade-Ins</p>
                      <strong>{profileTrades.length}</strong>
                    </div>
                  </div>
                  <div className="quick-activity-box">
                    <p className="card-label">Log Activity</p>
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
                      {profileActivities.slice(0, 6).map((act) => (
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
                <form className="credit-form" onSubmit={addFinanceApplication}>
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
                      setFinanceForm({ ...financeForm, state: e.target.value })
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
                      setFinanceForm({ ...financeForm, lender: e.target.value })
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
                        status: e.target.value as FinanceApplication["status"],
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
                        setCreditForm({ ...creditForm, state: e.target.value })
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
                          status: e.target.value as CreditApplication["status"],
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
                          <span>Payoff: ${trade.payoff.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {profileTab === "activity" && (
                <div>
                  <div className="quick-act-row" style={{ marginBottom: 18 }}>
                    <select
                      value={quickActivityType}
                      onChange={(e) =>
                        setQuickActivityType(e.target.value as Activity["type"])
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
  ];

  return (
    <main className="app-shell">
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

        {/* ── DASHBOARD ──────────────────────────────────────── */}
        {currentPage === "dashboard" && (
          <>
            <header className="page-header">
              <div>
                <p className="eyebrow">AutoSuite CRM</p>
                <h1>Today's Overview</h1>
              </div>
              <div className="header-actions">
                <button type="button" onClick={() => navigate("leads")}>
                  + New Lead
                </button>
              </div>
            </header>

            <div className="kpi-grid">
              <div className="kpi-card kpi-blue">
                <span>Open Leads</span>
                <strong>{totalLeads}</strong>
                <small>{urgentLeads.length} uncontacted</small>
              </div>
              <div className="kpi-card kpi-yellow">
                <span>Appointments</span>
                <strong>{appointmentCount}</strong>
                <small>Active</small>
              </div>
              <div className="kpi-card kpi-green">
                <span>Finance Queue</span>
                <strong>{pendingFinance}</strong>
                <small>Pending approval</small>
              </div>
              <div className="kpi-card kpi-purple">
                <span>Units Sold</span>
                <strong>{soldCount}</strong>
                <small>Closing ratio {closingRatio}%</small>
              </div>
              <div className="kpi-card kpi-dark">
                <span>Pipeline Value</span>
                <strong>${pipelineValue.toLocaleString()}</strong>
                <small>All active deals</small>
              </div>
            </div>

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
                  {customers.filter((c) => c.status === "Appointment")
                    .length === 0 && (
                    <p className="empty-state">No appointments scheduled.</p>
                  )}
                  {customers
                    .filter((c) => c.status === "Appointment")
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
                          <button type="button" onClick={() => openProfile(c)}>
                            Open
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="my-day-col">
                  <p className="my-day-label appt">🟡 Appointments Today</p>
                  {customers.filter((c) => c.status === "Appointment")
                    .length === 0 ? (
                    <p className="empty-state">No appointments scheduled.</p>
                  ) : (
                    customers
                      .filter((c) => c.status === "Appointment")
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
                          <button type="button" onClick={() => openProfile(c)}>
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
                              {a.applicantName || getCustomerName(a.customerId)}
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
                  New leads from web forms, third-party providers, phone calls,
                  and walk-ins. Assign and work each lead before they go cold.
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
                  No incoming leads. Add customers with a web/internet source to
                  see them here.
                </p>
              )}
              {internetLeads.map((c) => (
                <div className="inbox-card" key={c.id}>
                  <div className="inbox-card-top">
                    <div className="inbox-name-row">
                      <strong>
                        {c.firstName} {c.lastName}
                      </strong>
                      <span className={`status-badge ${statusClass(c.status)}`}>
                        {c.status}
                      </span>
                      {!activities.some((a) => a.customerId === c.id) && (
                        <span className="badge-urgent">No contact yet</span>
                      )}
                    </div>
                    <span className="source-tag">
                      {c.source || "Unknown source"}
                    </span>
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
                <p className="page-subtitle">
                  Search by name, phone, email, or vehicle. Click any row to
                  open a full deal jacket. Capable of handling thousands of
                  records.
                </p>
              </div>
            </header>

            <article className="panel" style={{ marginBottom: 18 }}>
              <div className="panel-header">
                <p className="eyebrow">
                  {editingCustomerId
                    ? "Editing Customer"
                    : "Add New Customer / Lead"}
                </p>
                {editingCustomerId && (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={resetCustomerForm}
                  >
                    Cancel
                  </button>
                )}
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
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                />
                <input
                  placeholder="Email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
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
                  placeholder="Lead source (Cars.com, Walk-in, Referral...)"
                  value={customerForm.source}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, source: e.target.value })
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
                  <option>Lead</option>
                  <option>Appointment</option>
                  <option>Finance</option>
                  <option>Sold</option>
                </select>
                <button type="submit">
                  {editingCustomerId ? "Save Changes" : "Add Customer"}
                </button>
              </form>
            </article>

            <div className="search-bar-row">
              <input
                className="search-input"
                placeholder="🔍  Search name, phone, email, or vehicle..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              <select
                className="filter-select"
                value={customerStatusFilter}
                onChange={(e) => setCustomerStatusFilter(e.target.value)}
              >
                <option value="All">All statuses</option>
                <option>Lead</option>
                <option>Appointment</option>
                <option>Finance</option>
                <option>Sold</option>
              </select>
              <select
                className="filter-select"
                value={customerSourceFilter}
                onChange={(e) => setCustomerSourceFilter(e.target.value)}
              >
                <option value="All">All sources</option>
                <option>Cars.com</option>
                <option>AutoTrader</option>
                <option>Website Lead</option>
                <option>Walk-in</option>
                <option>Referral</option>
              </select>
              <span className="result-count">
                Showing {filteredCustomers.length} of {customers.length}
              </span>
            </div>

            <div className="customer-table">
              {filteredCustomers.length === 0 && (
                <p className="empty-state large">
                  No customers match your search or filters.
                </p>
              )}
              {filteredCustomers.map((c) => (
                <div className="cust-row" key={c.id}>
                  <div className="cust-main" onClick={() => openProfile(c)}>
                    <strong>
                      {c.firstName} {c.lastName}
                    </strong>
                    <span>{c.interestedVehicle || "No vehicle specified"}</span>
                    <small>
                      {c.source || "No source"} · Rep:{" "}
                      {c.assignedTo || "Unassigned"}
                    </small>
                  </div>
                  <span className="cust-contact">
                    {c.phone}
                    <br />
                    <small>{c.email || "No email"}</small>
                  </span>
                  <span className={`status-badge ${statusClass(c.status)}`}>
                    {c.status}
                  </span>
                  <div className="row-actions">
                    <button type="button" onClick={() => openProfile(c)}>
                      Deal Jacket
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => editCustomer(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteCustomer(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                  applications across every deal. Open a customer deal jacket to
                  submit a new one.
                </p>
              </div>
            </header>
            <div
              className="kpi-grid"
              style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 18 }}
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
                      {app.requestedVehicle || getCustomerName(app.customerId)}
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
                      {col.sales.length} deal{col.sales.length !== 1 ? "s" : ""}{" "}
                      · ${col.value.toLocaleString()}
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
                      setDeskCalc({ ...deskCalc, tradePayoff: e.target.value })
                    }
                  />
                </div>
                <div className="desk-input-group">
                  <label>Down Payment ($)</label>
                  <input
                    placeholder="e.g. 3000"
                    value={deskCalc.downPayment}
                    onChange={(e) =>
                      setDeskCalc({ ...deskCalc, downPayment: e.target.value })
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
                  onChange={(e) =>
                    setTradeForm({ ...tradeForm, mileage: e.target.value })
                  }
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
                <button type="submit">Add Trade</button>
              </form>
            </article>
            <div className="customer-table">
              {tradeIns.length === 0 && (
                <p className="empty-state large">No trade-ins recorded yet.</p>
              )}
              {tradeIns.map((t) => (
                <div className="cust-row" key={t.id}>
                  <div className="cust-main">
                    <strong>
                      {t.year} {t.make} {t.model}
                    </strong>
                    <span>{t.mileage.toLocaleString()} miles</span>
                  </div>
                  <span className="cust-contact">
                    {getCustomerName(t.customerId)}
                  </span>
                  <span>ACV: ${t.estimatedValue.toLocaleString()}</span>
                  <span>Payoff: ${t.payoff.toLocaleString()}</span>
                  <span
                    className={
                      t.estimatedValue - t.payoff >= 0
                        ? "kpi-green-text"
                        : "badge-danger"
                    }
                  >
                    Equity: ${(t.estimatedValue - t.payoff).toLocaleString()}
                  </span>
                </div>
              ))}
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
            <article className="panel">
              <form className="stack-form" onSubmit={lookupVin}>
                <input
                  placeholder="Enter 17-character VIN"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  maxLength={17}
                  style={{ fontFamily: "monospace", letterSpacing: 2 }}
                />
                <button type="submit" disabled={vinLoading}>
                  {vinLoading ? "Looking up..." : "Decode VIN"}
                </button>
              </form>
              {vinError && <p className="auth-error">{vinError}</p>}
              {vinResult && (
                <div className="vin-card">
                  {vinResult.warning && (
                    <p className="vin-warning">⚠ {vinResult.warning}</p>
                  )}
                  <strong className="vin-title">
                    {vinResult.year} {vinResult.make} {vinResult.model}
                    {vinResult.trim && vinResult.trim !== "—"
                      ? ` — ${vinResult.trim}`
                      : ""}
                  </strong>
                  <div className="vin-grid">
                    <div>
                      <span>VIN</span>
                      <b style={{ fontFamily: "monospace", letterSpacing: 1 }}>
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
                  })
                }
              >
                Clear Desk
              </button>
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
                        onChange={(e) =>
                          setDesk({ ...desk, customerId: e.target.value })
                        }
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
                      <label>Sales Tax Rate (%)</label>
                      <input
                        value={desk.taxRate}
                        onChange={(e) =>
                          setDesk({ ...desk, taxRate: e.target.value })
                        }
                      />
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
                          ? "– Trade Equity"
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

                {/* Payment Grid */}
                {deskNumbers.financed > 0 && (
                  <div className="payment-grid-wrap">
                    <p className="desk-section-title">Payment Grid</p>
                    <p className="payment-grid-note">
                      {desk.apr}% APR — payments at different terms and down
                      payments
                    </p>
                    <div className="payment-grid-scroll">
                      <table className="payment-grid-table">
                        <thead>
                          <tr>
                            <th>Term</th>
                            {[0, 1000, 2000, 3000, 5000].map((d) => (
                              <th key={d}>${d.toLocaleString()} down</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paymentGrid.map((row) => (
                            <tr
                              key={row.term}
                              className={
                                row.term === parseInt(desk.termMonths)
                                  ? "grid-row-active"
                                  : ""
                              }
                            >
                              <td>
                                <strong>{row.term} mo</strong>
                              </td>
                              {row.payments.map((pmt, i) => (
                                <td
                                  key={i}
                                  className={pmt > 0 ? "" : "grid-zero"}
                                >
                                  {pmt > 0 ? `$${pmt.toFixed(0)}` : "—"}
                                </td>
                              ))}
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
          <>
            <header className="page-header">
              <div>
                <p className="eyebrow">Activity Log</p>
                <h1>Calls, Texts, Emails & Notes</h1>
                <p className="page-subtitle">
                  All customer interactions across every rep and deal. Use a
                  customer's Deal Jacket to log activities tied to that specific
                  deal.
                </p>
              </div>
            </header>
            <article className="panel" style={{ marginBottom: 18 }}>
              <p className="eyebrow">Log Activity</p>
              <form className="contact-form" onSubmit={addActivity}>
                <select
                  value={activityForm.customerId}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      customerId: e.target.value,
                    })
                  }
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
                <select
                  value={activityForm.type}
                  onChange={(e) =>
                    setActivityForm({
                      ...activityForm,
                      type: e.target.value as Activity["type"],
                    })
                  }
                >
                  <option>Call</option>
                  <option>Text</option>
                  <option>Email</option>
                  <option>Appointment</option>
                  <option>Note</option>
                </select>
                <input
                  placeholder="Notes or outcome..."
                  value={activityForm.note}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, note: e.target.value })
                  }
                />
                <button type="submit">Log Activity</button>
              </form>
            </article>
            <div className="activity-timeline full-timeline">
              {activities.length === 0 && (
                <p className="empty-state large">No activities logged yet.</p>
              )}
              {activities.slice(0, 30).map((act) => (
                <div className="timeline-item" key={act.id}>
                  <span
                    className={`timeline-dot dot-${act.type.toLowerCase()}`}
                  />
                  <div>
                    <strong>
                      {act.type} — {getCustomerName(act.customerId)}
                    </strong>
                    <span>{act.note}</span>
                    <small>{new Date(act.createdAt).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
