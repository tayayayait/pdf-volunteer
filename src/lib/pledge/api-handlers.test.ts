import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { handlePledgeApiRequest } from "./api-handlers";
import type { CreatePledgeInput } from "./pledge-create-schema";

const onePixelPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const pledge: CreatePledgeInput = {
  submissionId: "00000000-0000-4000-8000-000000000001",
  pledgeDate: "2026-06-29",
  donorName: "홍길동",
  donorType: "individual",
  donorTypeOther: "",
  birthOrBusinessNo: "",
  mobilePhone: "010-1234-5678",
  phone: "",
  email: "",
  postalCode: "",
  addressLine1: "서울특별시 중구 세종대로 110",
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
  privacyConsent: false,
  receiptConsent: false,
  signaturePng: onePixelPng,
};

const contentTypeFor = (filePath: string): string => {
  if (extname(filePath) === ".json") return "application/json; charset=utf-8";
  if (extname(filePath) === ".pdf") return "application/pdf";
  if (extname(filePath) === ".ttf") return "font/ttf";
  return "application/octet-stream";
};

const startPublicAssetServer = async (): Promise<{ baseUrl: string; close: () => Promise<void> }> => {
  const publicRoot = resolve(process.cwd(), "public");
  const server: Server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      const filePath = resolve(publicRoot, `.${decodeURIComponent(pathname)}`);
      if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}\\`) && !filePath.startsWith(`${publicRoot}/`)) {
        response.writeHead(403).end();
        return;
      }

      response.writeHead(200, { "content-type": contentTypeFor(filePath) });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("ASSET_SERVER_PORT_MISSING");

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolveClose) => server.close(() => resolveClose())),
  };
};

describe("pledge API handlers", () => {
  it("returns a generated PDF directly without server-side storage", async () => {
    const assetServer = await startPublicAssetServer();

    try {
      const response = await handlePledgeApiRequest(
        new Request(`${assetServer.baseUrl}/api/pledges/pdf`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(pledge),
        }),
      );

      expect(response?.status).toBe(200);
      expect(response?.headers.get("content-type")).toBe("application/pdf");
      expect(response?.headers.get("content-disposition")).toContain(
        encodeURIComponent("20260629_홍길동_10000000.pdf"),
      );

      const bytes = new Uint8Array(await response!.arrayBuffer());
      expect(Buffer.from(bytes.subarray(0, 4)).toString()).toBe("%PDF");
    } finally {
      await assetServer.close();
    }
  });
});
