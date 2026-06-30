import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

export type PdfFieldAlign = "left" | "center" | "right";

export type PdfFieldBox = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  align?: PdfFieldAlign;
  fit?: "contain";
};

export type PdfFieldMap = {
  template: string;
  pageSize: "A4";
  fields: Record<string, PdfFieldBox>;
};

export type PdfTemplateConfig = {
  templatePath: string;
  fieldMap: PdfFieldMap;
};

export type PdfTemplateErrorCode =
  | "PDF_TEMPLATE_NOT_FOUND"
  | "PDF_FIELD_MAP_NOT_FOUND"
  | "PDF_FIELD_MAP_INVALID";

export class PdfTemplateError extends Error {
  code: PdfTemplateErrorCode;

  constructor(code: PdfTemplateErrorCode, message: string) {
    super(message);
    this.name = "PdfTemplateError";
    this.code = code;
  }
}

const REQUIRED_FIELDS = [
  "pledgeDate",
  "donorName",
  "donorType",
  "contact",
  "address",
  "donationAmount",
  "donationPurpose",
  "paymentMethod",
  "signaturePng",
] as const;

export const getDefaultPdfTemplateDir = (): string =>
  process.env.PLEDGE_TEMPLATE_DIR ?? join(process.cwd(), "storage", "templates", "pledge");

const isFinitePositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isValidFieldBox = (box: unknown): box is PdfFieldBox => {
  if (!box || typeof box !== "object") return false;
  const candidate = box as PdfFieldBox;
  return (
    Number.isInteger(candidate.page) &&
    candidate.page > 0 &&
    typeof candidate.x === "number" &&
    Number.isFinite(candidate.x) &&
    typeof candidate.y === "number" &&
    Number.isFinite(candidate.y) &&
    isFinitePositiveNumber(candidate.width) &&
    isFinitePositiveNumber(candidate.height)
  );
};

export const validatePdfFieldMap = (
  fieldMap: unknown,
): { ok: true; value: PdfFieldMap } | { ok: false; code: "PDF_FIELD_MAP_INVALID"; message: string } => {
  if (!fieldMap || typeof fieldMap !== "object") {
    return { ok: false, code: "PDF_FIELD_MAP_INVALID", message: "PDF 좌표표 형식이 올바르지 않습니다." };
  }

  const candidate = fieldMap as PdfFieldMap;
  if (!candidate.template || candidate.pageSize !== "A4" || !candidate.fields) {
    return { ok: false, code: "PDF_FIELD_MAP_INVALID", message: "PDF 좌표표 필수 속성이 없습니다." };
  }

  const missing = REQUIRED_FIELDS.filter((field) => !candidate.fields[field]);
  if (missing.length > 0) {
    return {
      ok: false,
      code: "PDF_FIELD_MAP_INVALID",
      message: `PDF 좌표표 필수 필드가 없습니다: ${missing.join(", ")}`,
    };
  }

  const invalid = Object.entries(candidate.fields).find(([, box]) => !isValidFieldBox(box));
  if (invalid) {
    return {
      ok: false,
      code: "PDF_FIELD_MAP_INVALID",
      message: `PDF 좌표표 필드 형식이 올바르지 않습니다: ${invalid[0]}`,
    };
  }

  return { ok: true, value: candidate };
};

export const loadPdfTemplateConfig = async (
  templateDir = getDefaultPdfTemplateDir(),
): Promise<PdfTemplateConfig> => {
  const mapPath = join(templateDir, "pdf-field-map.json");
  let rawMap: string;
  try {
    rawMap = await readFile(mapPath, "utf8");
  } catch {
    throw new PdfTemplateError(
      "PDF_FIELD_MAP_NOT_FOUND",
      "PDF 좌표표를 찾을 수 없습니다. 운영 담당자에게 문의하세요.",
    );
  }

  const parsed = JSON.parse(rawMap) as unknown;
  const validation = validatePdfFieldMap(parsed);
  if (!validation.ok) {
    throw new PdfTemplateError(validation.code, validation.message);
  }

  const templatePath = join(templateDir, validation.value.template);
  try {
    await access(templatePath, constants.R_OK);
  } catch {
    throw new PdfTemplateError(
      "PDF_TEMPLATE_NOT_FOUND",
      "PDF 템플릿을 찾을 수 없습니다. 운영 담당자에게 문의하세요.",
    );
  }

  return { templatePath, fieldMap: validation.value };
};
