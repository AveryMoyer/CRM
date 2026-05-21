export type AppPageName =
  | "dashboard"
  | "leads"
  | "customers"
  | "appointments"
  | "fi-manager"
  | "pipeline"
  | "trades"
  | "vin"
  | "activities"
  | "desk"
  | "service"
  | "comms"
  | "inventory"
  | "reports"
  | "equity"
  | "ups";

export type CustomerIdentity = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
};

export type CustomerFormIdentity = {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
};

export type ParsedRoute =
  | { page: "customers"; selectedCustomerId: number }
  | { page: AppPageName; selectedCustomerId: null };

export const VALID_APP_PAGES: AppPageName[] = [
  "dashboard",
  "leads",
  "customers",
  "appointments",
  "fi-manager",
  "pipeline",
  "trades",
  "vin",
  "activities",
  "desk",
  "service",
  "comms",
  "inventory",
  "reports",
  "equity",
  "ups",
];

export function parseHashRoute(hash: string): ParsedRoute {
  const customerMatch = hash.match(/^#\/customers\/(\d+)\/?$/);
  if (customerMatch) {
    return { page: "customers", selectedCustomerId: Number(customerMatch[1]) };
  }

  const page = hash.replace(/^#\/?/, "") as AppPageName;
  return {
    page: VALID_APP_PAGES.includes(page) ? page : "dashboard",
    selectedCustomerId: null,
  };
}

export function findDuplicateCustomers<T extends CustomerIdentity>(
  customers: T[],
  form: CustomerFormIdentity,
  editingCustomerId?: number | null,
): T[] {
  const fullName = `${form.firstName} ${form.lastName}`.toLowerCase().trim();
  const phone = form.phone.replace(/\D/g, "");
  const email = (form.email || "").toLowerCase().trim();

  return customers.filter((customer) => {
    if (editingCustomerId && customer.id === editingCustomerId) return false;
    const nameHit =
      fullName.length > 2 &&
      `${customer.firstName} ${customer.lastName}`.toLowerCase() === fullName;
    const existingPhone = customer.phone.replace(/\D/g, "");
    const phoneHit =
      phone.length >= 7 &&
      (existingPhone.includes(phone) || phone.includes(existingPhone));
    const emailHit =
      email.length > 3 && (customer.email || "").toLowerCase() === email;
    return nameHit || phoneHit || emailHit;
  });
}

export function findDuplicateIds(ids: number[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  ids.forEach((id) => {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });
  return [...duplicates];
}
