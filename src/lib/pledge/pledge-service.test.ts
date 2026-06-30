import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createPledgeRecord, resolvePledgePdf } from "./pledge-service";
import type { CreatePledgeInput } from "./pledge-create-schema";

const validInput = (submissionId = randomUUID()): CreatePledgeInput => ({
  submissionId,
  pledgeDate: "2026-06-29",
  donorName: "홍길동",
  donorType: "alumni",
  donorTypeOther: "",
  birthOrBusinessNo: "",
  mobilePhone: "010-1234-5678",
  phone: "",
  email: "",
  postalCode: "",
  addressLine1: "서울특별시 중구 세종대로 110",
  addressLine2: "",
  donationAmount: 10000000,
  donationPurpose: "scholarship",
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
  privacyConsent: false,
  receiptConsent: false,
  signaturePng: "data:image/png;base64,abc",
});

const createTempDir = async (): Promise<string> => {
  const dir = join(tmpdir(), `pledge-service-${randomUUID()}`);
  await mkdir(dir, { recursive: true });
  return dir;
};

describe("pledge creation storage", () => {
  it("stores the generated PDF in local storage and resolves it by submission id", async () => {
    const storageRoot = await createTempDir();
    const input = validInput();

    try {
      const result = await createPledgeRecord(input, {
        storageRoot,
        renderPdf: async () => new Uint8Array([37, 80, 68, 70]),
      });

      expect(result).toMatchObject({
        id: input.submissionId,
        status: "saved",
        fileName: "20260629_홍길동_10000000.pdf",
        downloadUrl: `/api/pledges/${input.submissionId}/pdf`,
        duplicate: false,
      });

      const resolved = await resolvePledgePdf(input.submissionId, storageRoot);
      expect(resolved?.fileName).toBe("20260629_홍길동_10000000.pdf");
      await expect(readFile(resolved!.filePath)).resolves.toEqual(Buffer.from([37, 80, 68, 70]));
    } finally {
      await rm(storageRoot, { recursive: true, force: true });
    }
  });

  it("returns the existing local PDF for duplicate submission ids", async () => {
    const storageRoot = await createTempDir();
    const submissionId = randomUUID();
    const input = validInput(submissionId);

    try {
      const first = await createPledgeRecord(input, {
        storageRoot,
        renderPdf: async () => new Uint8Array([1]),
      });
      const second = await createPledgeRecord(input, {
        storageRoot,
        renderPdf: async () => new Uint8Array([2]),
      });

      expect(second).toEqual({ ...first, duplicate: true });
      const resolved = await resolvePledgePdf(submissionId, storageRoot);
      await expect(readFile(resolved!.filePath)).resolves.toEqual(Buffer.from([1]));
    } finally {
      await rm(storageRoot, { recursive: true, force: true });
    }
  });
});
