import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const root = process.cwd();
const outputDir = join(root, "storage", "templates", "pledge");
const fontDir = join(root, "public", "fonts");
const templatePath = join(outputDir, "pledge-template.pdf");
const mapPath = join(outputDir, "pdf-field-map.json");

const A4_W = 595.28;
const A4_H = 841.89;
const marginX = 42;
const contentW = A4_W - marginX * 2;

const navy = rgb(0.082, 0.196, 0.29);
const forest = rgb(0.09, 0.42, 0.36);
const gold = rgb(0.72, 0.47, 0.12);
const ink = rgb(0.09, 0.13, 0.17);
const muted = rgb(0.42, 0.47, 0.52);
const line = rgb(0.79, 0.83, 0.88);
const paper = rgb(1, 0.992, 0.973);
const fieldFill = rgb(1, 1, 1);
const softFill = rgb(0.973, 0.984, 0.98);

const readFont = async (name) => {
  const fs = await import("node:fs/promises");
  return fs.readFile(join(fontDir, name));
};

const drawText = (page, text, x, y, size, font, color = ink, options = {}) => {
  page.drawText(text, { x, y, size, font, color, ...options });
};

const label = (page, text, x, y, font) => {
  drawText(page, text, x, y, 8.2, font, muted);
};

const fieldBox = (page, text, x, y, width, height, font, options = {}) => {
  label(page, text, x, y + height + 5, font);
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: line,
    borderWidth: 0.75,
    color: fieldFill,
  });
  return {
    page: 1,
    x: x + 9,
    y: y + 5,
    width: width - 18,
    height: height - 10,
    ...options,
  };
};

const section = (page, title, y, font) => {
  page.drawRectangle({ x: marginX, y: y - 2, width: 4, height: 17, color: forest });
  drawText(page, title, marginX + 12, y, 12.5, font, navy);
  page.drawLine({
    start: { x: marginX, y: y - 12 },
    end: { x: marginX + contentW, y: y - 12 },
    thickness: 0.6,
    color: line,
  });
};

const fields = {};

await mkdir(outputDir, { recursive: true });

const pdfDoc = await PDFDocument.create();
pdfDoc.registerFontkit(fontkit);
const regular = await pdfDoc.embedFont(await readFont("NanumGothic-Regular.ttf"), { subset: false });
const bold = await pdfDoc.embedFont(await readFont("NanumGothic-Bold.ttf"), { subset: false });

const page = pdfDoc.addPage([A4_W, A4_H]);
page.drawRectangle({ x: 0, y: 0, width: A4_W, height: A4_H, color: paper });

page.drawRectangle({ x: marginX, y: 776, width: 42, height: 42, color: navy });
drawText(page, "S", marginX + 13, 790, 22, bold, rgb(1, 1, 1));
drawText(page, "샘플대학교", marginX + 52, 804, 11.5, bold, navy);
drawText(page, "발전기금팀", marginX + 52, 788, 8.8, regular, muted);

drawText(page, "발전기금 기부약정서", marginX, 742, 24, bold, navy);
page.drawLine({
  start: { x: marginX, y: 727 },
  end: { x: marginX + contentW, y: 727 },
  thickness: 1.3,
  color: gold,
});
drawText(
  page,
  "본 약정서는 태블릿에서 작성한 입력값과 전자서명을 기반으로 자동 생성되었습니다.",
  marginX,
  707,
  8.5,
  regular,
  muted,
);

section(page, "1. 기부자 정보", 674, bold);
fields.pledgeDate = fieldBox(page, "작성일", 42, 628, 150, 29, regular, { align: "center" });
fields.donorName = fieldBox(page, "성명/기관명", 212, 628, 170, 29, regular);
fields.donorType = fieldBox(page, "구분", 402, 628, 151, 29, regular, { align: "center" });

section(page, "2. 연락처 및 주소", 583, bold);
fields.contact = fieldBox(page, "연락처", 42, 537, 220, 29, regular);
fields.address = fieldBox(page, "주소", 282, 537, 271, 29, regular);

section(page, "3. 기부금 정보", 492, bold);
fields.donationAmount = fieldBox(page, "기부금액", 42, 446, 220, 29, regular, {
  align: "right",
  fontSize: 10.5,
});
fields.donationPurpose = fieldBox(page, "기부용도", 282, 446, 271, 29, regular);

section(page, "4. 납부 방법", 401, bold);
fields.paymentMethod = fieldBox(page, "납부 방법", 42, 355, 220, 29, regular, { align: "center" });
page.drawRectangle({
  x: 282,
  y: 355,
  width: 271,
  height: 29,
  borderColor: line,
  borderWidth: 0.75,
  color: softFill,
});
label(page, "비고", 282, 389, regular);
drawText(page, "세부 납부 일정 및 계좌 정보는 기관 확인 절차에 따릅니다.", 292, 365, 8.5, regular, muted);

section(page, "5. 전자 서명", 305, bold);
page.drawRectangle({
  x: marginX,
  y: 198,
  width: contentW,
  height: 82,
  borderColor: line,
  borderWidth: 0.75,
  color: fieldFill,
});
label(page, "기부자 서명", marginX, 286, regular);
page.drawLine({
  start: { x: marginX + 22, y: 220 },
  end: { x: marginX + contentW - 22, y: 220 },
  thickness: 0.6,
  color: line,
  dashArray: [3, 3],
});
fields.signaturePng = { page: 1, x: marginX + 28, y: 208, width: contentW - 56, height: 56, fit: "contain" };

drawText(page, "확인 사항", marginX, 161, 9.5, bold, navy);
drawText(page, "- 입력 내용은 기부자의 확인을 거쳐 PDF로 보관됩니다.", marginX, 143, 8.5, regular, muted);
drawText(page, "- 원본 HWP 약정서가 확정되면 본 템플릿과 좌표표를 교체해야 합니다.", marginX, 128, 8.5, regular, muted);

drawText(page, "샘플대학교 발전기금팀", marginX, 42, 8, regular, muted);
drawText(page, "Sample template v2", A4_W - marginX - 92, 42, 8, regular, muted);

const fieldMap = {
  template: "pledge-template.pdf",
  pageSize: "A4",
  fields,
};

await writeFile(templatePath, await pdfDoc.save());
await writeFile(mapPath, `${JSON.stringify(fieldMap, null, 2)}\n`, "utf8");
console.log(`Generated ${templatePath}`);
console.log(`Generated ${mapPath}`);
