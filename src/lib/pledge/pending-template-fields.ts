import type { PledgeInput } from "./schema";

export const PENDING_TEMPLATE_FIELDS = [
  "birthOrBusinessNo",
  "email",
  "postalCode",
  "paymentType",
  "pledgeStartDate",
  "recurringMonths",
  "withdrawalDay",
  "bankName",
  "accountNumber",
  "accountHolder",
  "privacyConsent",
  "receiptConsent",
] as const;

export const PENDING_TEMPLATE_DEFAULTS = {
  birthOrBusinessNo: "",
  email: "",
  postalCode: "",
  paymentType: "one_time",
  pledgeStartDate: "",
  recurringMonths: undefined,
  withdrawalDay: "",
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  privacyConsent: false,
  receiptConsent: false,
} satisfies Partial<PledgeInput>;
