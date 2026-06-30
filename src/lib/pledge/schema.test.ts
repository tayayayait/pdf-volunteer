import { describe, expect, it } from "vitest";

import { pledgeSchema } from "./schema";

const validPledge = {
  pledgeDate: "2026-06-29",
  donorName: "홍길동",
  donorType: "individual",
  donorTypeOther: "",
  birthOrBusinessNo: "",
  mobilePhone: "010-1234-5678",
  phone: "",
  email: "",
  postalCode: "",
  addressLine1: "서울특별시 중구 세종대로",
  addressLine2: "",
  donationAmount: 10000000,
  donationPurpose: "general",
  departmentName: "",
  purposeOther: "",
  paymentType: "one_time",
  paymentMethod: "bank_transfer",
  pledgeStartDate: "",
  recurringMonths: undefined,
  withdrawalDay: "",
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  privacyConsent: true,
  receiptConsent: false,
  signaturePng: "data:image/png;base64,abc",
};

describe("pledge input schema", () => {
  it("accepts the required phase 2-1 fields while pending template fields stay blank", () => {
    const result = pledgeSchema.safeParse({
      pledgeDate: "2026-06-29",
      donorName: "홍길동",
      donorType: "individual",
      mobilePhone: "010-1234-5678",
      phone: "",
      addressLine1: "서울특별시 중구 세종대로 110",
      addressLine2: "",
      donationAmount: 10000000,
      donationPurpose: "general",
      paymentMethod: "bank_transfer",
      signaturePng: "data:image/png;base64,abc",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      birthOrBusinessNo: "",
      email: "",
      postalCode: "",
      paymentType: "one_time",
      pledgeStartDate: "",
      withdrawalDay: "",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      privacyConsent: false,
      receiptConsent: false,
    });
  });

  it("requires at least one phone number", () => {
    const result = pledgeSchema.safeParse({ ...validPledge, mobilePhone: "", phone: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("휴대전화 또는 전화를 1개 이상 입력하세요.");
  });

  it("requires recurring payment schedule fields", () => {
    const result = pledgeSchema.safeParse({
      ...validPledge,
      paymentType: "recurring",
      pledgeStartDate: "",
      recurringMonths: undefined,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("pledgeStartDate");
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("recurringMonths");
  });
});
