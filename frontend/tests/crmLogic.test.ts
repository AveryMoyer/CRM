import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findDuplicateCustomers,
  findDuplicateIds,
  parseHashRoute,
} from "../src/crmLogic.ts";

describe("parseHashRoute", () => {
  it("routes customer profiles to customers page and preserves selected id", () => {
    assert.deepEqual(parseHashRoute("#/customers/9"), {
      page: "customers",
      selectedCustomerId: 9,
    });
  });

  it("routes valid pages without a selected customer", () => {
    assert.deepEqual(parseHashRoute("#/desk"), {
      page: "desk",
      selectedCustomerId: null,
    });
  });

  it("falls back invalid routes to dashboard", () => {
    assert.deepEqual(parseHashRoute("#/bad-route"), {
      page: "dashboard",
      selectedCustomerId: null,
    });
  });
});

describe("findDuplicateCustomers", () => {
  const customers = [
    {
      id: 1,
      firstName: "Ernesto",
      lastName: "Alverez",
      email: "ernesto.alverez@gmail.com",
      phone: "(713) 555-0294",
    },
    {
      id: 2,
      firstName: "Jordan",
      lastName: "Lee",
      email: "jordan@example.com",
      phone: "(555) 123-0148",
    },
  ];

  it("detects exact name, phone, and email duplicates", () => {
    const matches = findDuplicateCustomers(customers, {
      firstName: "Ernesto",
      lastName: "Alverez",
      email: "ERNESTO.ALVEREZ@gmail.com",
      phone: "7135550294",
    });

    assert.equal(matches.length, 1);
    assert.equal(matches[0].id, 1);
  });

  it("excludes the customer currently being edited", () => {
    const matches = findDuplicateCustomers(
      customers,
      {
        firstName: "Ernesto",
        lastName: "Alverez",
        email: "ernesto.alverez@gmail.com",
        phone: "7135550294",
      },
      1,
    );

    assert.equal(matches.length, 0);
  });
});

describe("findDuplicateIds", () => {
  it("returns repeated customer ids", () => {
    assert.deepEqual(findDuplicateIds([1, 2, 3, 2, 9, 9]), [2, 9]);
  });
});
