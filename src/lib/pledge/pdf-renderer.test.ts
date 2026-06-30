import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { renderPledgePdf } from "./pdf-renderer";
import type { PdfFieldMap } from "./pdf-template";
import type { PledgeInput } from "./schema";

const onePixelPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const box = { page: 1, x: 30, y: 700, width: 120, height: 18 };

const fieldMap: PdfFieldMap = {
  template: "pledge-template.pdf",
  pageSize: "A4",
  fields: {
    pledgeDate: box,
    donorName: { ...box, y: 670 },
    donorType: { ...box, y: 640 },
    contact: { ...box, y: 610 },
    address: { ...box, y: 520, width: 300 },
    donationAmount: { ...box, y: 490, align: "right" },
    donationPurpose: { ...box, y: 460 },
    paymentMethod: { ...box, y: 400 },
    signaturePng: { page: 1, x: 350, y: 100, width: 120, height: 45, fit: "contain" },
  },
};

const pledge: PledgeInput = {
  pledgeDate: "2026-06-29",
  donorName: "홍길동",
  donorType: "individual",
  donorTypeOther: "",
  birthOrBusinessNo: "",
  mobilePhone: "010-1234-5678",
  phone: "",
  email: "",
  postalCode: "12345",
  addressLine1: "서울특별시 중구 세종대로",
  addressLine2: "101호",
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
  signaturePng: onePixelPng,
};

describe("server PDF renderer", () => {
  it("overlays pledge data and signature on the configured template", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pledge-render-"));
    const template = await PDFDocument.create();
    template.addPage([595.28, 841.89]);
    await writeFile(join(dir, "pledge-template.pdf"), await template.save());
    await writeFile(join(dir, "pdf-field-map.json"), JSON.stringify(fieldMap), "utf8");

    const bytes = await renderPledgePdf(pledge, dir);
    const pdf = await PDFDocument.load(bytes);

    expect(pdf.getPageCount()).toBe(1);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
  });
});
