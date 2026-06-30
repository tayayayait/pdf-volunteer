import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  loadPdfTemplateConfig,
  validatePdfFieldMap,
  type PdfFieldMap,
} from "./pdf-template";

const box = { page: 1, x: 10, y: 10, width: 100, height: 20 };

const validMap: PdfFieldMap = {
  template: "pledge-template.pdf",
  pageSize: "A4",
  fields: {
    pledgeDate: box,
    donorName: box,
    donorType: box,
    contact: box,
    address: box,
    donationAmount: box,
    donationPurpose: box,
    paymentMethod: box,
    signaturePng: { page: 1, x: 10, y: 10, width: 100, height: 40, fit: "contain" },
  },
};

describe("PDF template configuration", () => {
  it("requires required fields in the field map", () => {
    const result = validatePdfFieldMap({ ...validMap, fields: { donorName: validMap.fields.donorName } });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("PDF_FIELD_MAP_INVALID");
  });

  it("loads the template and field map from the configured template directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pledge-template-"));
    await writeFile(join(dir, "pdf-field-map.json"), JSON.stringify(validMap), "utf8");
    await writeFile(join(dir, "pledge-template.pdf"), "%PDF-1.7\n%%EOF", "utf8");

    await expect(loadPdfTemplateConfig(dir)).resolves.toMatchObject({
      templatePath: join(dir, "pledge-template.pdf"),
      fieldMap: validMap,
    });
  });

  it("rejects a missing template file with a stable error code", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pledge-template-"));
    await writeFile(join(dir, "pdf-field-map.json"), JSON.stringify(validMap), "utf8");

    await expect(loadPdfTemplateConfig(dir)).rejects.toMatchObject({
      code: "PDF_TEMPLATE_NOT_FOUND",
    });
  });
});
