import { describe, expect, it } from "vitest";
import { validateEnquiry } from "./enquiry";

const validContact = {
  kind: "contact",
  reason: "general_enquiry",
  name: "Asha Rao",
  email: "asha@example.com",
  phone: "9876543210",
  message: "I would like to know when the finder will be public.",
  consent: true,
};

describe("validateEnquiry", () => {
  it("accepts a complete contact enquiry", () => {
    const result = validateEnquiry(validContact);
    expect(result.ok).toBe(true);
  });

  it("accepts a contact enquiry without a phone number", () => {
    const result = validateEnquiry({ ...validContact, phone: "" });
    expect(result.ok).toBe(true);
  });

  it("rejects a filled honeypot without sending semantics", () => {
    const result = validateEnquiry({ ...validContact, website: "https://spam.example" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.formError).toMatch(/could not send/i);
    }
  });

  it("requires privacy consent", () => {
    const result = validateEnquiry({ ...validContact, consent: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.consent).toBeTruthy();
    }
  });

  it("requires organisation and city for host leads", () => {
    const result = validateEnquiry({
      kind: "host",
      name: "Ravi",
      email: "ravi@example.com",
      phone: "+91 9876543210",
      message: "We have parking at a hotel and want to discuss chargers.",
      consent: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.organisation).toBeTruthy();
      expect(result.errors.city).toBeTruthy();
    }
  });

  it("rejects an invalid email", () => {
    const result = validateEnquiry({ ...validContact, email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toBeTruthy();
    }
  });

  it("rejects a name without letters", () => {
    const result = validateEnquiry({ ...validContact, name: "12345" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeTruthy();
    }
  });

  it("rejects an invented bay count that is not a number", () => {
    const result = validateEnquiry({
      kind: "host",
      reason: "host_enquiry",
      name: "Ravi Kumar",
      email: "ravi@example.com",
      phone: "9876543210",
      organisation: "Lakeview Hotel",
      city: "Chennai",
      vehicleOrBays: "ten",
      message: "We have parking at a hotel and want to discuss chargers.",
      consent: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.vehicleOrBays).toBeTruthy();
    }
  });
});
