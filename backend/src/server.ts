import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

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

let contacts: Contact[] = [
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

let deals: Deal[] = [
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

let tasks: Task[] = [
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

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "crm-api" });
});

app.get("/api/summary", (_req, res) => {
  const pipelineValue = deals.reduce((total, deal) => total + deal.value, 0);
  const openTasks = tasks.filter((task) => !task.complete).length;

  res.json({
    contacts: contacts.length,
    deals: deals.length,
    pipelineValue,
    openTasks,
  });
});

app.get("/api/contacts", (_req, res) => {
  res.json(contacts);
});

app.post("/api/contacts", (req, res) => {
  const contact: Contact = {
    id: Date.now(),
    name: req.body.name,
    company: req.body.company,
    email: req.body.email,
    phone: req.body.phone,
    status: req.body.status || "Lead",
  };

  contacts = [contact, ...contacts];
  res.status(201).json(contact);
});

app.get("/api/deals", (_req, res) => {
  res.json(deals);
});

app.post("/api/deals", (req, res) => {
  const deal: Deal = {
    id: Date.now(),
    title: req.body.title,
    company: req.body.company,
    value: Number(req.body.value || 0),
    stage: req.body.stage || "Qualified",
  };

  deals = [deal, ...deals];
  res.status(201).json(deal);
});

app.get("/api/tasks", (_req, res) => {
  res.json(tasks);
});

app.patch("/api/tasks/:id/toggle", (req, res) => {
  const taskId = Number(req.params.id);

  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, complete: !task.complete } : task,
  );

  res.json(tasks.find((task) => task.id === taskId));
});

app.listen(port, () => {
  console.log(`CRM API running on port ${port}`);
});
