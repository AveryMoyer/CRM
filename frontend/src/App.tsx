import { FormEvent, useEffect, useMemo, useState } from "react";
import "./styles/global.css";

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
  stage: "Working" | "Finance" | "Delivered";
};

type VinDecodedVehicle = {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  bodyClass: string;
  engine: string;
  manufacturer: string;
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

const API_BASE = "http://localhost:4000";

const initialCustomers: Customer[] = [
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

const initialFinanceApplications: FinanceApplication[] = [
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
];

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
  const [profileTab, setProfileTab] = useState<ProfileTab>("overview");
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
  const [vin, setVin] = useState("");
  const [vinResult, setVinResult] = useState<VinDecodedVehicle | null>(null);
  const [vinError, setVinError] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [activityForm, setActivityForm] = useState({
    customerId: "1",
    type: "Note" as Activity["type"],
    note: "",
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

  const pipelineValue = useMemo(
    () => vehicleSales.reduce((total, sale) => total + sale.salePrice, 0),
    [vehicleSales],
  );

  const pendingFinance = financeApplications.filter(
    (application) => application.status !== "Approved",
  ).length;
  const appointmentCount = customers.filter(
    (customer) => customer.status === "Appointment",
  ).length;
  const deliveredValue = vehicleSales
    .filter((sale) => sale.stage === "Delivered")
    .reduce((total, sale) => total + sale.salePrice, 0);
  const hotLeads = customers.filter((customer) =>
    ["Lead", "Appointment"].includes(customer.status),
  );
  const pipelineStages = (["Working", "Finance", "Delivered"] as const).map(
    (stage) => ({
      stage,
      sales: vehicleSales.filter((sale) => sale.stage === stage),
    }),
  );
  const workQueue = [
    {
      label: "Lead response",
      value: hotLeads.length,
      detail: "Fresh leads and appointments needing action",
    },
    {
      label: "F&I review",
      value: pendingFinance,
      detail: "Applications not approved yet",
    },
    {
      label: "Deliveries",
      value: vehicleSales.filter((sale) => sale.stage === "Delivered").length,
      detail: `$${deliveredValue.toLocaleString()} delivered gross pipeline`,
    },
  ];

  function getCustomerName(customerId: number) {
    const customer = customers.find((item) => item.id === customerId);
    return customer
      ? `${customer.firstName} ${customer.lastName}`
      : "Unknown customer";
  }

  const selectedCustomer = selectedCustomerId
    ? customers.find((customer) => customer.id === selectedCustomerId) || null
    : null;
  const profileFinance = selectedCustomer
    ? financeApplications.filter(
        (item) => item.customerId === selectedCustomer.id,
      )
    : [];
  const profileCreditApplications = selectedCustomer
    ? creditApplications.filter(
        (item) => item.customerId === selectedCustomer.id,
      )
    : [];
  const profileTrades = selectedCustomer
    ? tradeIns.filter((item) => item.customerId === selectedCustomer.id)
    : [];
  const profileSales = selectedCustomer
    ? vehicleSales.filter((item) => item.customerId === selectedCustomer.id)
    : [];
  const profileActivities = selectedCustomer
    ? activities.filter((item) => item.customerId === selectedCustomer.id)
    : [];

  useEffect(() => {
    function syncCustomerRoute() {
      const match = window.location.hash.match(/^#\/customers\/(\d+)/);
      setSelectedCustomerId(match ? Number(match[1]) : null);
    }

    syncCustomerRoute();
    window.addEventListener("hashchange", syncCustomerRoute);
    return () => window.removeEventListener("hashchange", syncCustomerRoute);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    async function loadBootstrapData() {
      try {
        const bootstrapResponse = await fetch(`${API_BASE}/api/bootstrap`);
        const bootstrapData = (await bootstrapResponse.json()) as BootstrapData;
        setCustomers(bootstrapData.customers);
        setFinanceApplications(bootstrapData.financeApplications);
        setCreditApplications(bootstrapData.creditApplications || []);
        setTradeIns(bootstrapData.tradeIns);
        setVehicleSales(bootstrapData.vehicleSales);
        setActivities(bootstrapData.activities);
      } catch {
        setAppMessage("Could not refresh CRM data from the backend.");
      }
    }

    loadBootstrapData();
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedCustomer) {
      prepareCustomerProfile(selectedCustomer);
      setFinanceForm((current) => ({
        ...current,
        customerId: String(selectedCustomer.id),
        applicantName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        requestedVehicle: selectedCustomer.interestedVehicle,
      }));
    }
  }, [selectedCustomerId, selectedCustomer?.id]);

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
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || "Unable to authenticate");
        return;
      }

      if (authMode === "forgot") {
        setAuthMessage(data.message || "Password updated. You can log in now.");
        setAuthMode("login");
        return;
      }

      const bootstrapResponse = await fetch(`${API_BASE}/api/bootstrap`);
      const bootstrapData = (await bootstrapResponse.json()) as BootstrapData;
      setCustomers(bootstrapData.customers);
      setFinanceApplications(bootstrapData.financeApplications);
      setCreditApplications(bootstrapData.creditApplications || []);
      setTradeIns(bootstrapData.tradeIns);
      setVehicleSales(bootstrapData.vehicleSales);
      setActivities(bootstrapData.activities);
      localStorage.setItem("crm-authenticated", "true");
      setIsLoggedIn(true);
    } catch {
      setAuthError(
        "Could not connect to the backend. Make sure it is running.",
      );
    }
  }

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

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !customerForm.firstName ||
      !customerForm.lastName ||
      !customerForm.phone
    ) {
      return;
    }

    if (editingCustomerId) {
      const response = await fetch(
        `${API_BASE}/api/customers/${editingCustomerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerForm),
        },
      );
      const updatedCustomer = await response.json();
      setCustomers(
        customers.map((customer) =>
          customer.id === editingCustomerId ? updatedCustomer : customer,
        ),
      );
      setAppMessage("Customer updated.");
      resetCustomerForm();
      return;
    }

    const response = await fetch(`${API_BASE}/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerForm),
    });
    const customer = await response.json();
    setCustomers([customer, ...customers]);
    setAppMessage("Customer added.");
    resetCustomerForm();
  }

  function editCustomer(customer: Customer) {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      interestedVehicle: customer.interestedVehicle,
      source: customer.source || "",
      assignedTo: customer.assignedTo || "",
      nextFollowUp: customer.nextFollowUp || "",
    });
  }

  async function deleteCustomer(customerId: number) {
    await fetch(`${API_BASE}/api/customers/${customerId}`, {
      method: "DELETE",
    });
    setCustomers(customers.filter((customer) => customer.id !== customerId));
    setFinanceApplications(
      financeApplications.filter(
        (application) => application.customerId !== customerId,
      ),
    );
    setTradeIns(
      tradeIns.filter((tradeIn) => tradeIn.customerId !== customerId),
    );
    setVehicleSales(
      vehicleSales.filter((sale) => sale.customerId !== customerId),
    );
    setActivities(
      activities.filter((activity) => activity.customerId !== customerId),
    );
    setAppMessage("Customer deleted.");
  }

  async function addFinanceApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${API_BASE}/api/finance-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(financeForm),
    });
    const application = await response.json();
    setFinanceApplications([application, ...financeApplications]);
    setAppMessage("Finance application added.");
  }

  async function addProfileFinanceApplication(
    event: FormEvent<HTMLFormElement>,
  ) {
    await addFinanceApplication(event);
    setProfileTab("deals");
  }

  async function addTradeIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${API_BASE}/api/trade-ins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tradeForm),
    });
    const tradeIn = await response.json();
    setTradeIns([tradeIn, ...tradeIns]);
    setAppMessage("Trade-in added.");
  }

  async function addVehicleSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${API_BASE}/api/vehicle-sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleForm),
    });
    const sale = await response.json();
    setVehicleSales([sale, ...vehicleSales]);
    setAppMessage("Vehicle deal added.");
  }

  async function lookupVin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVinError("");
    setVinResult(null);
    setVinLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/vin/${encodeURIComponent(vin)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        setVinError(data.message || "Unable to pull VIN details");
        return;
      }

      setVinResult(data);
      setSaleForm({
        ...saleForm,
        year: data.year || saleForm.year,
        make: data.make || saleForm.make,
        model: data.model || saleForm.model,
      });
      setTradeForm({
        ...tradeForm,
        year: data.year || tradeForm.year,
        make: data.make || tradeForm.make,
        model: data.model || tradeForm.model,
      });
    } catch {
      setVinError("Could not connect to the backend VIN API.");
    } finally {
      setVinLoading(false);
    }
  }

  async function updateFinanceStatus(
    applicationId: number,
    status: FinanceApplication["status"],
  ) {
    const response = await fetch(
      `${API_BASE}/api/finance-applications/${applicationId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    const application = await response.json();
    setFinanceApplications(
      financeApplications.map((item) =>
        item.id === applicationId ? application : item,
      ),
    );
    setAppMessage("Finance status updated.");
  }

  async function updateSaleStage(saleId: number, stage: VehicleSale["stage"]) {
    const response = await fetch(
      `${API_BASE}/api/vehicle-sales/${saleId}/stage`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      },
    );
    const sale = await response.json();
    setVehicleSales(
      vehicleSales.map((item) => (item.id === saleId ? sale : item)),
    );
    setAppMessage("Vehicle deal stage updated.");
  }

  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityForm.note) {
      return;
    }

    const response = await fetch(`${API_BASE}/api/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activityForm),
    });
    const activity = await response.json();
    setActivities([activity, ...activities]);
    setActivityForm({ ...activityForm, note: "" });
    setAppMessage("Activity added.");
  }

  function openCustomerProfile(customer: Customer) {
    const profileUrl = `${window.location.origin}${window.location.pathname}#/customers/${customer.id}`;
    window.open(profileUrl, "_blank", "noopener,noreferrer");
  }

  function prepareCustomerProfile(customer: Customer) {
    setCreditForm({
      applicantName: `${customer.firstName} ${customer.lastName}`,
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
      requestedVehicle: customer.interestedVehicle,
      consentToPullCredit: false,
      status: "Draft",
    });
  }

  async function addCreditApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer) {
      return;
    }

    const response = await fetch(
      `${API_BASE}/api/customers/${selectedCustomer.id}/credit-applications`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creditForm),
      },
    );
    const application = await response.json();
    setCreditApplications([application, ...creditApplications]);
    setFinanceApplications([
      {
        id: Date.now(),
        customerId: selectedCustomer.id,
        employmentStatus: application.employmentStatus,
        monthlyIncome: application.monthlyIncome,
        creditRange: "Pending bureau",
        downPayment: application.downPayment,
        status: application.status === "Submitted" ? "Submitted" : "New",
      },
      ...financeApplications,
    ]);
    setProfileTab("deals");
    setAppMessage("Credit application saved to customer profile.");
  }

  if (!isLoggedIn) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleAuth}>
          <div className="brand-mark">AP</div>
          <p className="eyebrow">Auto Retail CRM</p>
          <h1>
            {authMode === "signup"
              ? "Create account"
              : authMode === "forgot"
                ? "Reset password"
                : "Sales login"}
          </h1>
          {authMode === "signup" && (
            <input
              aria-label="Name"
              placeholder="Full name"
              value={loginForm.name}
              onChange={(event) =>
                setLoginForm({ ...loginForm, name: event.target.value })
              }
            />
          )}
          <input
            aria-label="Email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(event) =>
              setLoginForm({ ...loginForm, email: event.target.value })
            }
          />
          <input
            aria-label="Password"
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm({ ...loginForm, password: event.target.value })
            }
          />
          <small>
            {authMode === "forgot"
              ? "Enter your email and a new password to reset your login."
              : "Demo login: avery@example.com / password"}
          </small>
          {authError && <p className="auth-error">{authError}</p>}
          {authMessage && <p className="auth-success">{authMessage}</p>}
          <button type="submit">
            {authMode === "signup"
              ? "Sign Up"
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
              : "Need an account? Sign up"}
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

  if (selectedCustomerId) {
    return (
      <main className="app-shell">
        <aside className="sidebar">
          <div className="brand-mark">AP</div>
          <nav>
            <a href="#dashboard">Dashboard</a>
            <a className="active" href={`#/customers/${selectedCustomerId}`}>
              Customer Profile
            </a>
          </nav>
        </aside>
        <section className="workspace">
          <header className="topbar">
            <div>
              <p className="eyebrow">Customer Profile</p>
              <h1>
                {selectedCustomer
                  ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                  : "Customer not found"}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.hash = "dashboard";
              }}
            >
              Back to CRM
            </button>
          </header>
          {appMessage && <p className="app-message">{appMessage}</p>}
          {!selectedCustomer && (
            <article className="panel">
              <h2>This customer profile could not be found.</h2>
            </article>
          )}
          {selectedCustomer && (
            <article className="panel wide profile-panel">
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
                    {tab}
                  </button>
                ))}
              </div>
              {profileTab === "overview" && (
                <div className="profile-grid">
                  <div className="profile-card">
                    <strong>Contact</strong>
                    <span>{selectedCustomer.phone}</span>
                    <span>{selectedCustomer.email || "No email"}</span>
                  </div>
                  <div className="profile-card">
                    <strong>Deal Ownership</strong>
                    <span>{selectedCustomer.assignedTo || "Unassigned"}</span>
                    <span>{selectedCustomer.source || "Manual Entry"}</span>
                  </div>
                  <div className="profile-card">
                    <strong>Next Step</strong>
                    <span>{selectedCustomer.status}</span>
                    <span>
                      {selectedCustomer.nextFollowUp || "Not scheduled"}
                    </span>
                  </div>
                </div>
              )}
              {profileTab === "finance" && (
                <>
                  <form
                    className="credit-form"
                    onSubmit={addProfileFinanceApplication}
                  >
                    <input
                      placeholder="Applicant name"
                      value={financeForm.applicantName}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          applicantName: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Date of birth"
                      value={financeForm.dateOfBirth}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          dateOfBirth: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="SSN last 4"
                      value={financeForm.ssnLast4}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          ssnLast4: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Address"
                      value={financeForm.address}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          address: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="City"
                      value={financeForm.city}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          city: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="State"
                      value={financeForm.state}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          state: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="ZIP"
                      value={financeForm.zip}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          zip: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Employer"
                      value={financeForm.employerName}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          employerName: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Job title"
                      value={financeForm.jobTitle}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          jobTitle: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Time on job"
                      value={financeForm.timeOnJob}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          timeOnJob: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Monthly income"
                      value={financeForm.monthlyIncome}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          monthlyIncome: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Other income"
                      value={financeForm.otherIncome}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          otherIncome: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Credit range"
                      value={financeForm.creditRange}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          creditRange: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Down payment"
                      value={financeForm.downPayment}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          downPayment: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Requested vehicle"
                      value={financeForm.requestedVehicle}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          requestedVehicle: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Trade payoff"
                      value={financeForm.tradePayoff}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          tradePayoff: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Requested amount"
                      value={financeForm.requestedAmount}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          requestedAmount: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Term months"
                      value={financeForm.termMonths}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          termMonths: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Preferred lender"
                      value={financeForm.lender}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          lender: event.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Decision notes"
                      value={financeForm.decisionNotes}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          decisionNotes: event.target.value,
                        })
                      }
                    />
                    <select
                      value={financeForm.status}
                      onChange={(event) =>
                        setFinanceForm({
                          ...financeForm,
                          status: event.target
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
                        onChange={(event) =>
                          setFinanceForm({
                            ...financeForm,
                            consentToPullCredit: event.target.checked,
                          })
                        }
                      />
                      Customer authorized credit review
                    </label>
                    <button type="submit">Submit Finance Application</button>
                  </form>
                </>
              )}
              {profileTab === "credit" && (
                <div className="deal-list">
                  {profileCreditApplications.map((application) => (
                    <div className="deal-card" key={application.id}>
                      <strong>{application.applicantName}</strong>
                      <span>
                        {application.employerName || "No employer listed"}
                      </span>
                      <b>
                        ${application.monthlyIncome.toLocaleString()} monthly
                      </b>
                      <small>{application.status}</small>
                    </div>
                  ))}
                </div>
              )}
              {profileTab === "deals" && (
                <div className="deal-list">
                  {profileFinance.map((application) => (
                    <div className="deal-card" key={application.id}>
                      <strong>
                        {application.applicantName ||
                          getCustomerName(application.customerId)}
                      </strong>
                      <span>
                        {application.requestedVehicle ||
                          selectedCustomer.interestedVehicle}
                      </span>
                      <b>${application.downPayment.toLocaleString()} down</b>
                      <small>{application.status}</small>
                    </div>
                  ))}
                  <div className="profile-grid">
                    <div className="profile-card">
                      <strong>Trades</strong>
                      <span>{profileTrades.length}</span>
                    </div>
                    <div className="profile-card">
                      <strong>Sales</strong>
                      <span>{profileSales.length}</span>
                    </div>
                  </div>
                </div>
              )}
              {profileTab === "activity" && (
                <div className="deal-list">
                  {profileActivities.map((activity) => (
                    <div className="deal-card" key={activity.id}>
                      <strong>{activity.type}</strong>
                      <span>{activity.note}</span>
                      <small>
                        {new Date(activity.createdAt).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">AP</div>
        <nav>
          <a className="active" href="#dashboard">
            Dashboard
          </a>
          <a href="#customers">Customers</a>
          <a href="#finance">Finance</a>
          <a href="#trades">Trades</a>
          <a href="#sales">Sales</a>
          <a href="#vin">VIN Lookup</a>
          <a href="#activities">Activities</a>
          <a href="#customer-profile">Profiles</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AutoSuite CRM</p>
            <h1>Dealership revenue command center</h1>
            <p className="topbar-copy">
              Route leads, manage showroom activity, desk deals, submit F&I,
              decode VINs, and keep every customer deal jacket in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("crm-authenticated");
              setIsLoggedIn(false);
            }}
          >
            Log Out
          </button>
        </header>
        {appMessage && <p className="app-message">{appMessage}</p>}

        <section className="hero-panel">
          <div>
            <p className="eyebrow">Company Operating System</p>
            <h2>
              Built for sales, finance, and managers to work the same customer
              file.
            </h2>
            <p>
              Automotive CRMs win when they combine lead response, follow-up,
              desking, trade, VIN, and finance workflows. This dashboard now
              mirrors that day-to-day dealership flow.
            </p>
          </div>
          <div className="hero-actions">
            <a href="#customers">Work Leads</a>
            <a href="#finance">Review F&I</a>
            <a href="#vin">Decode VIN</a>
          </div>
        </section>

        <section id="dashboard" className="metric-grid">
          <article className="metric-card">
            <span>Customers</span>
            <strong>{customers.length}</strong>
          </article>
          <article className="metric-card">
            <span>Finance Pending</span>
            <strong>{pendingFinance}</strong>
          </article>
          <article className="metric-card">
            <span>Appointments</span>
            <strong>{appointmentCount}</strong>
          </article>
          <article className="metric-card">
            <span>Trade-Ins</span>
            <strong>{tradeIns.length}</strong>
          </article>
          <article className="metric-card">
            <span>Vehicle Pipeline</span>
            <strong>${pipelineValue.toLocaleString()}</strong>
          </article>
        </section>

        <section className="ops-grid">
          <article className="panel">
            <p className="eyebrow">Manager Work Queue</p>
            <h2>Store priorities</h2>
            <div className="queue-list">
              {workQueue.map((item) => (
                <div className="queue-item" key={item.label}>
                  <strong>{item.value}</strong>
                  <div>
                    <b>{item.label}</b>
                    <span>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="panel">
            <p className="eyebrow">Deal Pipeline</p>
            <h2>Desking to delivery</h2>
            <div className="pipeline-board">
              {pipelineStages.map((column) => (
                <div className="pipeline-column" key={column.stage}>
                  <strong>{column.stage}</strong>
                  {column.sales.map((sale) => (
                    <button
                      type="button"
                      key={sale.id}
                      onClick={() => {
                        const customer = customers.find(
                          (item) => item.id === sale.customerId,
                        );
                        if (customer) openCustomerProfile(customer);
                      }}
                    >
                      <span>
                        {sale.year} {sale.make} {sale.model}
                      </span>
                      <small>{getCustomerName(sale.customerId)}</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article id="customers" className="panel wide">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Customers</p>
                <h2>Add, edit, or delete buyers</h2>
              </div>
            </div>
            <form className="contact-form" onSubmit={saveCustomer}>
              <input
                placeholder="First name"
                value={customerForm.firstName}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    firstName: event.target.value,
                  })
                }
              />
              <input
                placeholder="Last name"
                value={customerForm.lastName}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    lastName: event.target.value,
                  })
                }
              />
              <input
                placeholder="Phone"
                value={customerForm.phone}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    phone: event.target.value,
                  })
                }
              />
              <input
                placeholder="Email"
                value={customerForm.email}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    email: event.target.value,
                  })
                }
              />
              <input
                placeholder="Vehicle wanted"
                value={customerForm.interestedVehicle}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    interestedVehicle: event.target.value,
                  })
                }
              />
              <input
                placeholder="Lead source"
                value={customerForm.source}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    source: event.target.value,
                  })
                }
              />
              <input
                placeholder="Assigned to"
                value={customerForm.assignedTo}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    assignedTo: event.target.value,
                  })
                }
              />
              <input
                placeholder="Next follow-up"
                value={customerForm.nextFollowUp}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    nextFollowUp: event.target.value,
                  })
                }
              />
              <select
                value={customerForm.status}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    status: event.target.value as Customer["status"],
                  })
                }
              >
                <option>Lead</option>
                <option>Appointment</option>
                <option>Finance</option>
                <option>Sold</option>
              </select>
              <button type="submit">
                {editingCustomerId ? "Save Customer" : "Add Customer"}
              </button>
              {editingCustomerId && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={resetCustomerForm}
                >
                  Cancel
                </button>
              )}
            </form>
            <div className="table">
              {customers.map((customer) => (
                <div className="table-row customer-row" key={customer.id}>
                  <div>
                    <strong>
                      {customer.firstName} {customer.lastName}
                    </strong>
                    <span>{customer.interestedVehicle}</span>
                    <small>
                      {customer.source || "Manual Entry"} - Follow-up:{" "}
                      {customer.nextFollowUp || "Not scheduled"}
                    </small>
                  </div>
                  <span>{customer.phone}</span>
                  <span>{customer.email || "No email"}</span>
                  <b>{customer.status}</b>
                  <div className="row-actions">
                    <button
                      type="button"
                      onClick={() => editCustomer(customer)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openCustomerProfile(customer)}
                    >
                      Open Profile
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteCustomer(customer.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article id="customer-profile" className="panel wide profile-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Customer Profile</p>
                <h2>
                  {selectedCustomer
                    ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                    : "Open a customer profile"}
                </h2>
              </div>
            </div>
            {!selectedCustomer && (
              <p>
                Select Open Profile from the customer list to view a full deal
                jacket.
              </p>
            )}
            {selectedCustomer && (
              <>
                <div className="profile-tabs">
                  {(
                    ["overview", "credit", "deals", "activity"] as ProfileTab[]
                  ).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={profileTab === tab ? "active" : ""}
                      onClick={() => setProfileTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {profileTab === "overview" && (
                  <div className="profile-grid">
                    <div className="profile-card">
                      <strong>Contact</strong>
                      <span>{selectedCustomer.phone}</span>
                      <span>{selectedCustomer.email || "No email"}</span>
                    </div>
                    <div className="profile-card">
                      <strong>Deal Ownership</strong>
                      <span>{selectedCustomer.assignedTo || "Unassigned"}</span>
                      <span>{selectedCustomer.source || "Manual Entry"}</span>
                    </div>
                    <div className="profile-card">
                      <strong>Next Step</strong>
                      <span>{selectedCustomer.status}</span>
                      <span>
                        {selectedCustomer.nextFollowUp || "Not scheduled"}
                      </span>
                    </div>
                  </div>
                )}
                {profileTab === "credit" && (
                  <>
                    <form
                      className="credit-form"
                      onSubmit={addCreditApplication}
                    >
                      <input
                        placeholder="Applicant name"
                        value={creditForm.applicantName}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            applicantName: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Date of birth"
                        value={creditForm.dateOfBirth}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            dateOfBirth: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="SSN last 4"
                        value={creditForm.ssnLast4}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            ssnLast4: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Address"
                        value={creditForm.address}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            address: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="City"
                        value={creditForm.city}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            city: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="State"
                        value={creditForm.state}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            state: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="ZIP"
                        value={creditForm.zip}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            zip: event.target.value,
                          })
                        }
                      />
                      <select
                        value={creditForm.residenceType}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            residenceType: event.target.value,
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
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            timeAtAddress: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Employer"
                        value={creditForm.employerName}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            employerName: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Job title"
                        value={creditForm.jobTitle}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            jobTitle: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Time on job"
                        value={creditForm.timeOnJob}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            timeOnJob: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Monthly income"
                        value={creditForm.monthlyIncome}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            monthlyIncome: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Other income"
                        value={creditForm.otherIncome}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            otherIncome: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Bank name"
                        value={creditForm.bankName}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            bankName: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Down payment"
                        value={creditForm.downPayment}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            downPayment: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Requested vehicle"
                        value={creditForm.requestedVehicle}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            requestedVehicle: event.target.value,
                          })
                        }
                      />
                      <select
                        value={creditForm.status}
                        onChange={(event) =>
                          setCreditForm({
                            ...creditForm,
                            status: event.target
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
                          onChange={(event) =>
                            setCreditForm({
                              ...creditForm,
                              consentToPullCredit: event.target.checked,
                            })
                          }
                        />
                        Customer authorized credit review
                      </label>
                      <button type="submit">Save Credit Application</button>
                    </form>
                    <div className="deal-list">
                      {profileCreditApplications.map((application) => (
                        <div className="deal-card" key={application.id}>
                          <strong>{application.applicantName}</strong>
                          <span>
                            {application.employerName || "No employer listed"}
                          </span>
                          <b>
                            ${application.monthlyIncome.toLocaleString()}{" "}
                            monthly
                          </b>
                          <small>{application.status}</small>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {profileTab === "deals" && (
                  <div className="profile-grid">
                    <div className="profile-card">
                      <strong>Finance Apps</strong>
                      <span>{profileFinance.length}</span>
                    </div>
                    <div className="profile-card">
                      <strong>Trades</strong>
                      <span>{profileTrades.length}</span>
                    </div>
                    <div className="profile-card">
                      <strong>Sales</strong>
                      <span>{profileSales.length}</span>
                    </div>
                  </div>
                )}
                {profileTab === "activity" && (
                  <div className="deal-list">
                    {profileActivities.map((activity) => (
                      <div className="deal-card" key={activity.id}>
                        <strong>{activity.type}</strong>
                        <span>{activity.note}</span>
                        <small>
                          {new Date(activity.createdAt).toLocaleString()}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </article>

          <article id="finance" className="panel">
            <p className="eyebrow">Finance Applications</p>
            <h2>Credit and approval tracking</h2>
            <form className="stack-form" onSubmit={addFinanceApplication}>
              <select
                value={financeForm.customerId}
                onChange={(event) =>
                  setFinanceForm({
                    ...financeForm,
                    customerId: event.target.value,
                  })
                }
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
              <input
                placeholder="Monthly income"
                value={financeForm.monthlyIncome}
                onChange={(event) =>
                  setFinanceForm({
                    ...financeForm,
                    monthlyIncome: event.target.value,
                  })
                }
              />
              <input
                placeholder="Down payment"
                value={financeForm.downPayment}
                onChange={(event) =>
                  setFinanceForm({
                    ...financeForm,
                    downPayment: event.target.value,
                  })
                }
              />
              <select
                value={financeForm.status}
                onChange={(event) =>
                  setFinanceForm({
                    ...financeForm,
                    status: event.target.value as FinanceApplication["status"],
                  })
                }
              >
                <option>New</option>
                <option>Submitted</option>
                <option>Approved</option>
                <option>Needs Review</option>
              </select>
              <button type="submit">Add Finance App</button>
            </form>
            <div className="deal-list">
              {financeApplications.map((application) => (
                <div className="deal-card" key={application.id}>
                  <strong>{getCustomerName(application.customerId)}</strong>
                  <span>
                    ${application.monthlyIncome.toLocaleString()} income
                  </span>
                  <b>${application.downPayment.toLocaleString()} down</b>
                  <select
                    value={application.status}
                    onChange={(event) =>
                      updateFinanceStatus(
                        application.id,
                        event.target.value as FinanceApplication["status"],
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
          </article>

          <article id="trades" className="panel">
            <p className="eyebrow">Trade-Ins</p>
            <h2>Vehicle appraisal info</h2>
            <form className="stack-form" onSubmit={addTradeIn}>
              <select
                value={tradeForm.customerId}
                onChange={(event) =>
                  setTradeForm({ ...tradeForm, customerId: event.target.value })
                }
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
              <input
                placeholder="Year"
                value={tradeForm.year}
                onChange={(event) =>
                  setTradeForm({ ...tradeForm, year: event.target.value })
                }
              />
              <input
                placeholder="Make"
                value={tradeForm.make}
                onChange={(event) =>
                  setTradeForm({ ...tradeForm, make: event.target.value })
                }
              />
              <input
                placeholder="Model"
                value={tradeForm.model}
                onChange={(event) =>
                  setTradeForm({ ...tradeForm, model: event.target.value })
                }
              />
              <input
                placeholder="Estimated value"
                value={tradeForm.estimatedValue}
                onChange={(event) =>
                  setTradeForm({
                    ...tradeForm,
                    estimatedValue: event.target.value,
                  })
                }
              />
              <button type="submit">Add Trade</button>
            </form>
            <div className="deal-list">
              {tradeIns.map((tradeIn) => (
                <div className="deal-card" key={tradeIn.id}>
                  <strong>
                    {tradeIn.year} {tradeIn.make} {tradeIn.model}
                  </strong>
                  <span>{getCustomerName(tradeIn.customerId)}</span>
                  <b>${tradeIn.estimatedValue.toLocaleString()}</b>
                  <small>{tradeIn.mileage.toLocaleString()} miles</small>
                </div>
              ))}
            </div>
          </article>

          <article id="sales" className="panel wide">
            <p className="eyebrow">Vehicle Being Sold</p>
            <h2>Working deals and deliveries</h2>
            <form className="contact-form" onSubmit={addVehicleSale}>
              <select
                value={saleForm.customerId}
                onChange={(event) =>
                  setSaleForm({ ...saleForm, customerId: event.target.value })
                }
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
              <input
                placeholder="Stock #"
                value={saleForm.stockNumber}
                onChange={(event) =>
                  setSaleForm({ ...saleForm, stockNumber: event.target.value })
                }
              />
              <input
                placeholder="Year"
                value={saleForm.year}
                onChange={(event) =>
                  setSaleForm({ ...saleForm, year: event.target.value })
                }
              />
              <input
                placeholder="Make"
                value={saleForm.make}
                onChange={(event) =>
                  setSaleForm({ ...saleForm, make: event.target.value })
                }
              />
              <input
                placeholder="Model"
                value={saleForm.model}
                onChange={(event) =>
                  setSaleForm({ ...saleForm, model: event.target.value })
                }
              />
              <input
                placeholder="Sale price"
                value={saleForm.salePrice}
                onChange={(event) =>
                  setSaleForm({ ...saleForm, salePrice: event.target.value })
                }
              />
              <select
                value={saleForm.stage}
                onChange={(event) =>
                  setSaleForm({
                    ...saleForm,
                    stage: event.target.value as VehicleSale["stage"],
                  })
                }
              >
                <option>Working</option>
                <option>Finance</option>
                <option>Delivered</option>
              </select>
              <button type="submit">Add Vehicle Sale</button>
            </form>
            <div className="table">
              {vehicleSales.map((sale) => (
                <div className="table-row" key={sale.id}>
                  <div>
                    <strong>
                      {sale.year} {sale.make} {sale.model}
                    </strong>
                    <span>
                      Stock #{sale.stockNumber} for{" "}
                      {getCustomerName(sale.customerId)}
                    </span>
                  </div>
                  <span>${sale.salePrice.toLocaleString()}</span>
                  <select
                    value={sale.stage}
                    onChange={(event) =>
                      updateSaleStage(
                        sale.id,
                        event.target.value as VehicleSale["stage"],
                      )
                    }
                  >
                    <option>Working</option>
                    <option>Finance</option>
                    <option>Delivered</option>
                  </select>
                </div>
              ))}
            </div>
          </article>

          <article id="vin" className="panel">
            <p className="eyebrow">VIN Decoder</p>
            <h2>Pull vehicle details by VIN</h2>
            <form className="stack-form" onSubmit={lookupVin}>
              <input
                placeholder="Enter VIN"
                value={vin}
                onChange={(event) => setVin(event.target.value.toUpperCase())}
              />
              <button type="submit" disabled={vinLoading}>
                {vinLoading ? "Looking Up..." : "Lookup VIN"}
              </button>
            </form>
            {vinError && <p className="auth-error">{vinError}</p>}
            {vinResult && (
              <div className="vin-card">
                <strong>
                  {vinResult.year} {vinResult.make} {vinResult.model}
                </strong>
                <span>VIN: {vinResult.vin}</span>
                <span>Trim: {vinResult.trim || "Not listed"}</span>
                <span>Body: {vinResult.bodyClass || "Not listed"}</span>
                <span>Engine: {vinResult.engine || "Not listed"}</span>
                <span>
                  Manufacturer: {vinResult.manufacturer || "Not listed"}
                </span>
              </div>
            )}
          </article>

          <article id="activities" className="panel">
            <p className="eyebrow">Activity Log</p>
            <h2>Calls, texts, appointments, and notes</h2>
            <form className="stack-form" onSubmit={addActivity}>
              <select
                value={activityForm.customerId}
                onChange={(event) =>
                  setActivityForm({
                    ...activityForm,
                    customerId: event.target.value,
                  })
                }
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
              <select
                value={activityForm.type}
                onChange={(event) =>
                  setActivityForm({
                    ...activityForm,
                    type: event.target.value as Activity["type"],
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
                placeholder="What happened?"
                value={activityForm.note}
                onChange={(event) =>
                  setActivityForm({ ...activityForm, note: event.target.value })
                }
              />
              <button type="submit">Add Activity</button>
            </form>
            <div className="deal-list">
              {activities.slice(0, 8).map((activity) => (
                <div className="deal-card" key={activity.id}>
                  <strong>
                    {activity.type} - {getCustomerName(activity.customerId)}
                  </strong>
                  <span>{activity.note}</span>
                  <small>{new Date(activity.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

export default App;
