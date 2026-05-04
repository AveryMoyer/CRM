# AutoSuite CRM

AutoSuite CRM is a full-stack dealership CRM prototype built for automotive sales, finance, and management workflows.

It includes a React + TypeScript frontend and an Express + TypeScript backend with JSON persistence for demo data.

## Current Capabilities

- Customer lead management with add, edit, delete, ownership, source, status, and follow-up tracking
- Customer profile pages at URLs like `#/customers/2` that can open in a separate browser tab or window
- Dealership dashboard with manager work queue, lead response metrics, F&I review count, appointments, trade-ins, and sales pipeline value
- Desking-style deal pipeline grouped by Working, Finance, and Delivered
- Full finance application workflow tied to a specific customer
- Credit application/deal-jacket history inside each customer profile
- Trade-in capture and vehicle sale tracking
- Activity log for calls, texts, emails, appointments, and notes
- VIN decoder using the NHTSA VIN API
- Signup, login, and forgot-password demo flows

## Project Structure

```text
CRM/
├── frontend/       # React + TypeScript + Vite app
├── backend/        # Node.js + Express + TypeScript API
└── backend/data/   # Local JSON data store, ignored by git
```

## Run Locally

Install dependencies in both apps:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Start the backend:

```bash
npm run dev --prefix backend
```

Start the frontend:

```bash
npm run dev --prefix frontend
```

Default demo login:

- Email: `avery@example.com`
- Password: `password`

## Build

```bash
npm run build --prefix backend
npm run build --prefix frontend
```

## Next Production Steps

- Replace JSON persistence with PostgreSQL or another production database
- Add secure password hashing and real sessions/JWT authentication
- Add company accounts, stores, roles, and permissions for managers, finance, and salespeople
- Add inventory integration, lender submission workflow, document upload, and automated follow-up campaigns
