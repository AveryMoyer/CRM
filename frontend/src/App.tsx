import { FormEvent, useMemo, useState } from "react";
import "./styles/global.css";

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customers, setCustomers] = useState(initialCustomers);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [financeApplications, setFinanceApplications] = useState(initialFinanceApplications);
  const [tradeIns, setTradeIns] = useState(initialTradeIns);
  const [vehicleSales, setVehicleSales] = useState(initialVehicleSales);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [customerForm, setCustomerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "Lead" as Customer["status"],
    interestedVehicle: "",
  });
  const [financeForm, setFinanceForm] = useState({
    customerId: "1",
    employmentStatus: "Full-time",
    monthlyIncome: "",
    creditRange: "680-719",
    downPayment: "",
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

  const pipelineValue = useMemo(
    () => vehicleSales.reduce((total, sale) => total + sale.salePrice, 0),
    [vehicleSales],
  );

  const pendingFinance = financeApplications.filter((application) => application.status !== "Approved").length;

  function getCustomerName(customerId: number) {
    const customer = customers.find((item) => item.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : "Unknown customer";
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginForm.email && loginForm.password) {
      setIsLoggedIn(true);
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
    });
  }

  function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerForm.firstName || !customerForm.lastName || !customerForm.phone) {
      return;
    }

    if (editingCustomerId) {
      setCustomers(
        customers.map((customer) =>
          customer.id === editingCustomerId ? { ...customer, ...customerForm } : customer,
        ),
      );
      resetCustomerForm();
      return;
    }

    const customer = { id: Date.now(), ...customerForm };
    setCustomers([customer, ...customers]);
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
    });
  }

  function deleteCustomer(customerId: number) {
    setCustomers(customers.filter((customer) => customer.id !== customerId));
    setFinanceApplications(financeApplications.filter((application) => application.customerId !== customerId));
    setTradeIns(tradeIns.filter((tradeIn) => tradeIn.customerId !== customerId));
    setVehicleSales(vehicleSales.filter((sale) => sale.customerId !== customerId));
  }

  function addFinanceApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFinanceApplications([
      {
        id: Date.now(),
        customerId: Number(financeForm.customerId),
        employmentStatus: financeForm.employmentStatus,
        monthlyIncome: Number(financeForm.monthlyIncome || 0),
        creditRange: financeForm.creditRange,
        downPayment: Number(financeForm.downPayment || 0),
        status: financeForm.status,
      },
      ...financeApplications,
    ]);
  }

  function addTradeIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTradeIns([
      {
        id: Date.now(),
        customerId: Number(tradeForm.customerId),
        year: tradeForm.year,
        make: tradeForm.make,
        model: tradeForm.model,
        mileage: Number(tradeForm.mileage || 0),
        payoff: Number(tradeForm.payoff || 0),
        estimatedValue: Number(tradeForm.estimatedValue || 0),
      },
      ...tradeIns,
    ]);
  }

  function addVehicleSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVehicleSales([
      {
        id: Date.now(),
        customerId: Number(saleForm.customerId),
        stockNumber: saleForm.stockNumber,
        year: saleForm.year,
        make: saleForm.make,
        model: saleForm.model,
        salePrice: Number(saleForm.salePrice || 0),
        stage: saleForm.stage,
      },
      ...vehicleSales,
    ]);
  }

  if (!isLoggedIn) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="brand-mark">AP</div>
          <p className="eyebrow">Auto Retail CRM</p>
          <h1>Sales login</h1>
          <input
            aria-label="Email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
          />
          <input
            aria-label="Password"
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
          />
          <button type="submit">Log In</button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">AP</div>
        <nav>
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#customers">Customers</a>
          <a href="#finance">Finance</a>
          <a href="#trades">Trades</a>
          <a href="#sales">Sales</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Avery Projects CRM</p>
            <h1>Auto sales command center</h1>
          </div>
          <button type="button" onClick={() => setIsLoggedIn(false)}>Log Out</button>
        </header>

        <section id="dashboard" className="metric-grid">
          <article className="metric-card"><span>Customers</span><strong>{customers.length}</strong></article>
          <article className="metric-card"><span>Finance Pending</span><strong>{pendingFinance}</strong></article>
          <article className="metric-card"><span>Trade-Ins</span><strong>{tradeIns.length}</strong></article>
          <article className="metric-card"><span>Vehicle Pipeline</span><strong>${pipelineValue.toLocaleString()}</strong></article>
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
              <input placeholder="First name" value={customerForm.firstName} onChange={(event) => setCustomerForm({ ...customerForm, firstName: event.target.value })} />
              <input placeholder="Last name" value={customerForm.lastName} onChange={(event) => setCustomerForm({ ...customerForm, lastName: event.target.value })} />
              <input placeholder="Phone" value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} />
              <input placeholder="Email" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} />
              <input placeholder="Vehicle wanted" value={customerForm.interestedVehicle} onChange={(event) => setCustomerForm({ ...customerForm, interestedVehicle: event.target.value })} />
              <select value={customerForm.status} onChange={(event) => setCustomerForm({ ...customerForm, status: event.target.value as Customer["status"] })}>
                <option>Lead</option>
                <option>Appointment</option>
                <option>Finance</option>
                <option>Sold</option>
              </select>
              <button type="submit">{editingCustomerId ? "Save Customer" : "Add Customer"}</button>
              {editingCustomerId && <button type="button" className="ghost-button" onClick={resetCustomerForm}>Cancel</button>}
            </form>
            <div className="table">
              {customers.map((customer) => (
                <div className="table-row customer-row" key={customer.id}>
                  <div><strong>{customer.firstName} {customer.lastName}</strong><span>{customer.interestedVehicle}</span></div>
                  <span>{customer.phone}</span>
                  <span>{customer.email || "No email"}</span>
                  <b>{customer.status}</b>
                  <div className="row-actions">
                    <button type="button" onClick={() => editCustomer(customer)}>Edit</button>
                    <button type="button" className="danger" onClick={() => deleteCustomer(customer.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article id="finance" className="panel">
            <p className="eyebrow">Finance Applications</p>
            <h2>Credit and approval tracking</h2>
            <form className="stack-form" onSubmit={addFinanceApplication}>
              <select value={financeForm.customerId} onChange={(event) => setFinanceForm({ ...financeForm, customerId: event.target.value })}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}</select>
              <input placeholder="Monthly income" value={financeForm.monthlyIncome} onChange={(event) => setFinanceForm({ ...financeForm, monthlyIncome: event.target.value })} />
              <input placeholder="Down payment" value={financeForm.downPayment} onChange={(event) => setFinanceForm({ ...financeForm, downPayment: event.target.value })} />
              <select value={financeForm.status} onChange={(event) => setFinanceForm({ ...financeForm, status: event.target.value as FinanceApplication["status"] })}><option>New</option><option>Submitted</option><option>Approved</option><option>Needs Review</option></select>
              <button type="submit">Add Finance App</button>
            </form>
            <div className="deal-list">{financeApplications.map((application) => <div className="deal-card" key={application.id}><strong>{getCustomerName(application.customerId)}</strong><span>${application.monthlyIncome.toLocaleString()} income</span><b>${application.downPayment.toLocaleString()} down</b><small>{application.status}</small></div>)}</div>
          </article>

          <article id="trades" className="panel">
            <p className="eyebrow">Trade-Ins</p>
            <h2>Vehicle appraisal info</h2>
            <form className="stack-form" onSubmit={addTradeIn}>
              <select value={tradeForm.customerId} onChange={(event) => setTradeForm({ ...tradeForm, customerId: event.target.value })}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}</select>
              <input placeholder="Year" value={tradeForm.year} onChange={(event) => setTradeForm({ ...tradeForm, year: event.target.value })} />
              <input placeholder="Make" value={tradeForm.make} onChange={(event) => setTradeForm({ ...tradeForm, make: event.target.value })} />
              <input placeholder="Model" value={tradeForm.model} onChange={(event) => setTradeForm({ ...tradeForm, model: event.target.value })} />
              <input placeholder="Estimated value" value={tradeForm.estimatedValue} onChange={(event) => setTradeForm({ ...tradeForm, estimatedValue: event.target.value })} />
              <button type="submit">Add Trade</button>
            </form>
            <div className="deal-list">{tradeIns.map((tradeIn) => <div className="deal-card" key={tradeIn.id}><strong>{tradeIn.year} {tradeIn.make} {tradeIn.model}</strong><span>{getCustomerName(tradeIn.customerId)}</span><b>${tradeIn.estimatedValue.toLocaleString()}</b><small>{tradeIn.mileage.toLocaleString()} miles</small></div>)}</div>
          </article>

          <article id="sales" className="panel wide">
            <p className="eyebrow">Vehicle Being Sold</p>
            <h2>Working deals and deliveries</h2>
            <form className="contact-form" onSubmit={addVehicleSale}>
              <select value={saleForm.customerId} onChange={(event) => setSaleForm({ ...saleForm, customerId: event.target.value })}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}</select>
              <input placeholder="Stock #" value={saleForm.stockNumber} onChange={(event) => setSaleForm({ ...saleForm, stockNumber: event.target.value })} />
              <input placeholder="Year" value={saleForm.year} onChange={(event) => setSaleForm({ ...saleForm, year: event.target.value })} />
              <input placeholder="Make" value={saleForm.make} onChange={(event) => setSaleForm({ ...saleForm, make: event.target.value })} />
              <input placeholder="Model" value={saleForm.model} onChange={(event) => setSaleForm({ ...saleForm, model: event.target.value })} />
              <input placeholder="Sale price" value={saleForm.salePrice} onChange={(event) => setSaleForm({ ...saleForm, salePrice: event.target.value })} />
              <select value={saleForm.stage} onChange={(event) => setSaleForm({ ...saleForm, stage: event.target.value as VehicleSale["stage"] })}><option>Working</option><option>Finance</option><option>Delivered</option></select>
              <button type="submit">Add Vehicle Sale</button>
            </form>
            <div className="table">{vehicleSales.map((sale) => <div className="table-row" key={sale.id}><div><strong>{sale.year} {sale.make} {sale.model}</strong><span>Stock #{sale.stockNumber} for {getCustomerName(sale.customerId)}</span></div><span>${sale.salePrice.toLocaleString()}</span><b>{sale.stage}</b></div>)}</div>
          </article>
        </section>
      </section>
    </main>
  );
}

export default App;
