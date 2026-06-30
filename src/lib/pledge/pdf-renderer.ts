import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import {
  DONATION_PURPOSES,
  DONOR_TYPES,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  labelOf,
} from "./labels";
import { formatAmount, formatDateDot, formatDateKorean } from "./formatters";
import { loadPdfTemplateConfig, type PdfFieldBox, type PdfFieldMap } from "./pdf-template";
import type { PledgeInput } from "./schema";

type PdfFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

const INK = rgb(0.09, 0.13, 0.17);
const MIN_FONT_SIZE = 7;
const DEFAULT_FONT_SIZE = 9.5;

class PdfFieldOverflowError extends Error {
  code = "PDF_FIELD_OVERFLOW";

  constructor(fieldId: string) {
    super(`PDF 출력 영역을 초과한 항목이 있습니다: ${fieldId}`);
    this.name = "PdfFieldOverflowError";
  }
}

const loadPdfFonts = async (pdfDoc: PDFDocument): Promise<PdfFonts> => {
  pdfDoc.registerFontkit(fontkit);
  const fontDir = join(process.cwd(), "public", "fonts");
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(join(fontDir, "NanumGothic-Regular.ttf")),
    readFile(join(fontDir, "NanumGothic-Bold.ttf")),
  ]);

  const [regular, bold] = await Promise.all([
    pdfDoc.embedFont(regularBytes, { subset: false }),
    pdfDoc.embedFont(boldBytes, { subset: false }),
  ]);

  return { regular, bold };
};

const fitFontSize = (font: PDFFont, text: string, box: PdfFieldBox): number => {
  let size = box.fontSize ?? DEFAULT_FONT_SIZE;
  while (size > MIN_FONT_SIZE && font.widthOfTextAtSize(text, size) > box.width) {
    size -= 0.5;
  }
  if (font.widthOfTextAtSize(text, size) > box.width) {
    return 0;
  }
  return size;
};

const drawTextField = (
  page: PDFPage,
  box: PdfFieldBox | undefined,
  text: string,
  font: PDFFont,
  fieldId: string,
): void => {
  if (!box || !text) return;

  const size = fitFontSize(font, text, box);
  if (size === 0) throw new PdfFieldOverflowError(fieldId);

  const width = font.widthOfTextAtSize(text, size);
  const x =
    box.align === "right"
      ? box.x + box.width - width
      : box.align === "center"
        ? box.x + (box.width - width) / 2
        : box.x;

  page.drawText(text, {
    x,
    y: box.y + (box.height - size) / 2,
    size,
    font,
    color: INK,
    maxWidth: box.width,
  });
};

const drawSignature = async (
  pdfDoc: PDFDocument,
  page: PDFPage,
  box: PdfFieldBox | undefined,
  signaturePng: string,
): Promise<void> => {
  if (!box) return;
  const base64 = signaturePng.split(",")[1];
  const pngBytes = Buffer.from(base64, "base64");
  const image = await pdfDoc.embedPng(pngBytes);
  const scale = Math.min(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  page.drawImage(image, {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  });
};

const purposeLabel = (data: PledgeInput): string => {
  if (data.donationPurpose === "department" && data.departmentName) {
    return `지정 학과/부서 (${data.departmentName})`;
  }
  if (data.donationPurpose === "other" && data.purposeOther) {
    return `기타 (${data.purposeOther})`;
  }
  return labelOf(DONATION_PURPOSES, data.donationPurpose);
};

const donorTypeLabel = (data: PledgeInput): string => {
  if (data.donorType === "other" && data.donorTypeOther) {
    return `기타 (${data.donorTypeOther})`;
  }
  return labelOf(DONOR_TYPES, data.donorType);
};

const fieldValues = (data: PledgeInput): Record<string, string> => ({
  pledgeDate: formatDateKorean(data.pledgeDate),
  donorName: data.donorName,
  donorType: donorTypeLabel(data),
  contact: [data.mobilePhone, data.phone].filter(Boolean).join(" / "),
  birthOrBusinessNo: data.birthOrBusinessNo ?? "",
  mobilePhone: data.mobilePhone ?? "",
  phone: data.phone ?? "",
  email: data.email ?? "",
  address: [data.postalCode ? `(${data.postalCode})` : "", data.addressLine1, data.addressLine2]
    .filter(Boolean)
    .join(" "),
  donationAmount: `${formatAmount(data.donationAmount)}원`,
  donationPurpose: purposeLabel(data),
  paymentType: labelOf(PAYMENT_TYPES, data.paymentType),
  paymentMethod: labelOf(PAYMENT_METHODS, data.paymentMethod),
  pledgeStartDate: data.pledgeStartDate ? formatDateDot(data.pledgeStartDate) : "",
  recurringMonths: data.recurringMonths ? `${data.recurringMonths}개월` : "",
  withdrawalDay: data.withdrawalDay ? `${data.withdrawalDay}일` : "",
  bankName: data.bankName ?? "",
  accountNumber: data.accountNumber ?? "",
  accountHolder: data.accountHolder ?? "",
  privacyConsent: data.privacyConsent ? "✓" : "",
  receiptConsent: data.receiptConsent ? "✓" : "",
});

const drawFields = (
  pdfDoc: PDFDocument,
  fieldMap: PdfFieldMap,
  fonts: PdfFonts,
  data: PledgeInput,
): Promise<void> => {
  const values = fieldValues(data);
  const pageFor = (box: PdfFieldBox) => pdfDoc.getPage(box.page - 1);

  for (const [fieldId, value] of Object.entries(values)) {
    const box = fieldMap.fields[fieldId];
    if (!box) continue;
    drawTextField(pageFor(box), box, value, fonts.regular, fieldId);
  }

  const signatureBox = fieldMap.fields.signaturePng;
  return drawSignature(pdfDoc, pageFor(signatureBox), signatureBox, data.signaturePng);
};

export const renderPledgePdf = async (
  data: PledgeInput,
  templateDir?: string,
): Promise<Uint8Array> => {
  const { templatePath, fieldMap } = await loadPdfTemplateConfig(templateDir);
  const templateBytes = await readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const fonts = await loadPdfFonts(pdfDoc);
  await drawFields(pdfDoc, fieldMap, fonts, data);
  return pdfDoc.save();
};
