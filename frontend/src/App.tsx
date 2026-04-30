import { FormEvent, useMemo, useState } from "react";
import "./styles/global.css";

type Contact = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: "Lead" | "Customer" | "Prospect";
};

type Deal = {
  id: number;
  title: string;
  company: string;
  value: number;
  stage: "Qualified" | "Proposal" | "Negotiation" | "Won";
};

type Task = {
  id: number;
  title: string;
  owner: string;
  dueDate: string;
  complete: boolean;
};

const initialContacts: Contact[] = [
  {
    id: 1,
    name: "Jordan Lee",
    company: "Northstar Labs",
    email: "jordan@northstar.test",
    phone: "(555) 123-0148",
    status: "Lead",
  },
  {
    id: 2,
    name: "Taylor Smith",
    company: "BrightPath Co.",
    email: "taylor@brightpath.test",
    phone: "(555) 981-4432",
    status: "Customer",
  },
  {
    id: 3,
    name: "Morgan Chen",
    company: "Summit Retail",
    email: "morgan@summit.test",
    phone: "(555) 451-2210",
    status: "Prospect",
  },
];

const initialDeals: Deal[] = [
  {
    id: 1,
    title: "CRM onboarding",
    company: "Northstar Labs",
    value: 12000,
    stage: "Proposal",
  },
  {
    id: 2,
    title: "Annual support plan",
    company: "BrightPath Co.",
    value: 8400,
    stage: "Won",
  },
  {
    id: 3,
    title: "Sales automation setup",
    company: "Summit Retail",
    value: 15600,
    stage: "Negotiation",
  },
];

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Follow up with Jordan",
    owner: "Avery",
    dueDate: "Today",
    complete: false,
  },
  {
    id: 2,
    title: "Send proposal revision",
    owner: "Avery",
    dueDate: "Tomorrow",
    complete: false,
  },
  {
    id: 3,
    title: "Schedule onboarding call",
    owner: "Avery",
    dueDate: "Friday",
    complete: true,
  },
];

function App() {
  const [contacts, setContacts] = useState(initialContacts);
  const [deals] = useState(initialDeals);
  const [tasks, setTasks] = useState(initialTasks);
  const [contactForm, setContactForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
  });

  const pipelineValue = useMemo(
    () => deals.reduce((total, deal) => total + deal.value, 0),
    [deals],
  );

  const openTasks = tasks.filter((task) => !task.complete).length;

  function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contactForm.name || !contactForm.company || !contactForm.email) {
      return;
    }

    setContacts([
      {
        id: Date.now(),
        ...contactForm,
        status: "Lead",
      },
      ...contacts,
    ]);

    setContactForm({ name: "", company: "", email: "", phone: "" });
  }

  function toggleTask(taskId: number) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, complete: !task.complete } : task,
      ),
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
          <a href="#contacts">Contacts</a>
          <a href="#deals">Deals</a>
          <a href="#tasks">Tasks</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Avery Projects CRM</p>
            <h1>Customer command center</h1>
          </div>
          <button type="button">Export Report</button>
        </header>

        <section id="dashboard" className="metric-grid">
          <article className="metric-card">
            <span>Total Contacts</span>
            <strong>{contacts.length}</strong>
          </article>
          <article className="metric-card">
            <span>Active Deals</span>
            <strong>{deals.length}</strong>
          </article>
          <article className="metric-card">
            <span>Pipeline Value</span>
            <strong>${pipelineValue.toLocaleString()}</strong>
          </article>
          <article className="metric-card">
            <span>Open Tasks</span>
            <strong>{openTasks}</strong>
          </article>
        </section>

        <section className="content-grid">
          <article id="contacts" className="panel wide">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Contacts</p>
                <h2>People and accounts</h2>
              </div>
            </div>

            <form className="contact-form" onSubmit={addContact}>
              <input
                aria-label="Name"
                placeholder="Name"
                value={contactForm.name}
                onChange={(event) =>
                  setContactForm({ ...contactForm, name: event.target.value })
                }
              />
              <input
                aria-label="Company"
                placeholder="Company"
                value={contactForm.company}
                onChange={(event) =>
                  setContactForm({
                    ...contactForm,
                    company: event.target.value,
                  })
                }
              />
              <input
                aria-label="Email"
                placeholder="Email"
                value={contactForm.email}
                onChange={(event) =>
                  setContactForm({ ...contactForm, email: event.target.value })
                }
              />
              <input
                aria-label="Phone"
                placeholder="Phone"
                value={contactForm.phone}
                onChange={(event) =>
                  setContactForm({ ...contactForm, phone: event.target.value })
                }
              />
              <button type="submit">Add Contact</button>
            </form>

            <div className="table">
              {contacts.map((contact) => (
                <div className="table-row" key={contact.id}>
                  <div>
                    <strong>{contact.name}</strong>
                    <span>{contact.company}</span>
                  </div>
                  <span>{contact.email}</span>
                  <span>{contact.phone || "No phone"}</span>
                  <b>{contact.status}</b>
                </div>
              ))}
            </div>
          </article>

          <article id="deals" className="panel">
            <p className="eyebrow">Deals</p>
            <h2>Pipeline</h2>
            <div className="deal-list">
              {deals.map((deal) => (
                <div className="deal-card" key={deal.id}>
                  <div>
                    <strong>{deal.title}</strong>
                    <span>{deal.company}</span>
                  </div>
                  <b>${deal.value.toLocaleString()}</b>
                  <small>{deal.stage}</small>
                </div>
              ))}
            </div>
          </article>

          <article id="tasks" className="panel">
            <p className="eyebrow">Tasks</p>
            <h2>Follow-ups</h2>
            <div className="task-list">
              {tasks.map((task) => (
                <button
                  className={task.complete ? "task complete" : "task"}
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  type="button"
                >
                  <span>{task.title}</span>
                  <small>{task.dueDate}</small>
                </button>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

export default App;
