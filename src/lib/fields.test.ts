import { describe, expect, it } from "vitest";
import {
  validateCity,
  validateDeleteConfirmation,
  validateEmail,
  validateIndianMobile,
  validateMessage,
  validateOptionalBays,
  validateOptionalSlug,
  validateOrganisation,
  validateOtpCode,
  validatePersonName,
} from "./fields";

describe("public field validators", () => {
  it("accepts a real person name and rejects digits-only names", () => {
    expect(validatePersonName("Asha Rao")).toBeUndefined();
    expect(validatePersonName("123")).toBeTruthy();
    expect(validatePersonName("A")).toBeTruthy();
  });

  it("requires a complete email", () => {
    expect(validateEmail("asha@example.com")).toBeUndefined();
    expect(validateEmail("not-an-email")).toBeTruthy();
    expect(validateEmail("")).toBeTruthy();
  });

  it("accepts Indian mobiles and rejects landlines or short numbers", () => {
    expect(validateIndianMobile("9876543210")).toBeUndefined();
    expect(validateIndianMobile("+91 9876543210")).toBeUndefined();
    expect(validateIndianMobile("12345")).toBeTruthy();
    expect(validateIndianMobile("0876543210")).toBeTruthy();
  });

  it("accepts city and organisation text, not empty or symbol-only values", () => {
    expect(validateCity("Chennai")).toBeUndefined();
    expect(validateCity("")).toBeTruthy();
    expect(validateOrganisation("Lakeview Mall")).toBeUndefined();
    expect(validateOrganisation("***")).toBeTruthy();
  });

  it("requires a sentence-length message", () => {
    expect(validateMessage("Too short")).toBeTruthy();
    expect(validateMessage("We would like to host two chargers at the hotel.")).toBeUndefined();
  });

  it("allows optional bays and slugs only in the expected shape", () => {
    expect(validateOptionalBays("")).toBeUndefined();
    expect(validateOptionalBays("8")).toBeUndefined();
    expect(validateOptionalBays("4-12")).toBeUndefined();
    expect(validateOptionalBays("ten")).toBeTruthy();
    expect(validateOptionalSlug("omr-hub")).toBeUndefined();
    expect(validateOptionalSlug("Not A Slug")).toBeTruthy();
  });

  it("requires a 6-digit OTP and DELETE confirmation", () => {
    expect(validateOtpCode("123456")).toBeUndefined();
    expect(validateOtpCode("12")).toBeTruthy();
    expect(validateDeleteConfirmation("DELETE")).toBeUndefined();
    expect(validateDeleteConfirmation("delete")).toBeTruthy();
  });
});
