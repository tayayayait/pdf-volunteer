import { readFile } from "node:fs/promises";
import { z } from "zod";

import { createPledgeInputSchema } from "./pledge-create-schema";
import { createPledgePdf, createPledgeRecord, resolvePledgePdf } from "./pledge-service";

const NO_STORE_HEADERS = {
  "cache-control": "no-store, max-age=0",
  pragma: "no-cache",
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...NO_STORE_HEADERS,
    },
  });

const errorResponse = (code: string, message: string, status: number): Response =>
  jsonResponse({ error: { code, message } }, status);

const pdfResponse = (pdfBytes: Uint8Array, fileName: string): Response =>
  new Response(pdfBytes, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      ...NO_STORE_HEADERS,
    },
  });

const createPledgeApi = async (request: Request): Promise<Response> => {
  try {
    const input = createPledgeInputSchema.parse(await request.json());
    const result = await createPledgeRecord(input);
    return jsonResponse({
      id: result.id,
      status: result.status,
      fileName: result.fileName,
      downloadUrl: result.downloadUrl,
      duplicate: result.duplicate,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse("VALIDATION_FAILED", err.issues[0]?.message ?? "입력값이 올바르지 않습니다.", 400);
    }
    const code = err instanceof Error && "code" in err ? String(err.code) : "PLEDGE_CREATE_FAILED";
    const message = err instanceof Error ? err.message : "약정서 생성에 실패했습니다.";
    return errorResponse(code, message, 500);
  }
};

const createPledgePdfApi = async (request: Request): Promise<Response> => {
  try {
    const input = createPledgeInputSchema.parse(await request.json());
    const result = await createPledgePdf(input, { assetBaseUrl: request.url });
    return pdfResponse(result.pdfBytes, result.fileName);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse("VALIDATION_FAILED", err.issues[0]?.message ?? "?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.", 400);
    }
    const code = err instanceof Error && "code" in err ? String(err.code) : "PLEDGE_PDF_FAILED";
    const message = err instanceof Error ? err.message : "PDF ?앹꽦???ㅽ뙣?덉뒿?덈떎.";
    return errorResponse(code, message, 500);
  }
};

const downloadPledgePdfApi = async (pledgeId: string): Promise<Response> => {
  const parsedId = z.string().uuid().safeParse(pledgeId);
  if (!parsedId.success) {
    return errorResponse("PDF_NOT_FOUND", "파일을 찾을 수 없습니다.", 404);
  }

  const pdf = await resolvePledgePdf(parsedId.data);
  if (!pdf) {
    return errorResponse("PDF_NOT_FOUND", "파일을 찾을 수 없습니다.", 404);
  }

  const fileName = encodeURIComponent(pdf.fileName);
  return new Response(await readFile(pdf.filePath), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename*=UTF-8''${fileName}`,
      ...NO_STORE_HEADERS,
    },
  });
};

export const handlePledgeApiRequest = async (request: Request): Promise<Response | null> => {
  const url = new URL(request.url);

  if (url.pathname === "/api/pledges" && request.method === "POST") {
    return createPledgeApi(request);
  }

  if (url.pathname === "/api/pledges/pdf" && request.method === "POST") {
    return createPledgePdfApi(request);
  }

  const pdfMatch = url.pathname.match(/^\/api\/pledges\/([0-9a-f-]+)\/pdf$/i);
  if (pdfMatch && request.method === "GET") {
    return downloadPledgePdfApi(pdfMatch[1]);
  }

  if (url.pathname.startsWith("/api/")) {
    return errorResponse("NOT_FOUND", "요청한 API를 찾을 수 없습니다.", 404);
  }

  return null;
};
