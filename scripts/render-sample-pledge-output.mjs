import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const root = process.cwd();
const templateDir = join(root, "storage", "templates", "pledge");
const fontDir = join(root, "public", "fonts");
const outDir = join(root, "tmp", "pdfs");

const data = {
  pledgeDate: "2026년 6월 30일",
  donorName: "유광재",
  donorType: "개인",
  contact: "010-7894-4944",
  address: "경상북도 구미시 옥계동",
  donationAmount: "5,000,000원",
  donationPurpose: "일반 발전기금",
  paymentMethod: "계좌이체 (가상계좌/무통장)",
};

const signaturePng =
  "iVBORw0KGgoAAAANSUhEUgAAAWgAAABkCAYAAACrUKoaAAAEaElEQVR4nO3dS27jOBiF0aTQK9Csd1D7X03toGfZghsZuBAEiiFbJHX585xRo1GxFT6+2JIf77fb7Q2APL+uPgAA9gk0QCiBBggl0AChBBoglEADhBJogFACDRBKoAFCCTRAKIEGCCXQAKEEGiCUQAOEEmiAUAINEEqgAUIJNEAogQYIJdAAoQQaIJRAA4QSaIBQAg0QSqABQv1z9QFAddu/v2/3//7478/7tUfDTN5vt79rB+gQ5T1CzRECDYOivEeoeUSg4YIwfyXS/ESgG3O+cQ1no7xHqPlOoDuF+fsGtvnWjfJ97o/+vLXCnUAP3rQ231pRPnOb1goCfeFTXBuw3twenVOR5giBDjj3+Emsaz5abnWf1seaBLrD5n32nONPP09/KXMk1OwR6A5hPnMbR26Pc5LnQ6j5SqAHb5bkOFQ207ivEOnP33Hm4x9FoC/cIDNFY0YjLvb1VDHU3ifwHIEO2RBibSwrh3rvd0g+3hQCHbYBhNq4nV0bSeET5nOWDnSLC4A9ibXxmTXSM4V5Cz4fvmSg08O8R6yNwyvrYfT6nS3Mb+HHuFSgZwzzntU+1tIfp/Nj03v+Zwnz9mC8Eo93iUBXCXNquHo8RZz9FRirhLpCmJOPu3Sgq4Y5Ida9Homk/NGZ0cj1XinMyb9DyUCvFObRkesxtqI8z6PpGcK8FToFWCrQq4e5V/h+up29MTz6b0V5rlBXDPNH2PGXDbQwtx2j0Y+0W9wf5+fi6B/ctPnYCoa5RKCFuf+49XhK3PP+OD8Xe98IlDYfW6HTGCUDnfLyotn1irVTGJlmD9tW+NFyiUAL89hxfGYD+JaZecy2j7bFwjxdoGdbUKmOXMTr9a0xe/f3zAVI1ttX26JhnibQ6QtoBmciOPJin1iPk3wKavUoTxFoFwD7jV+PN6c88uz9CXU/jy7+Xf1gSJgnCLQw9xm/lptq5NtmxbqNZ16VMTrUwjxBoIW5/diNejp6f1lWz/sT6nbj1vodnqNefvlR+FRGfKCPTNqKE1TlU7laEuvXxqj3qa0e1zQ+iq/lEoFefZLuVo7yHuvl2Ji0WBtnIy3MBQI9y4dojyZExuiVNXLld2f+9G7EIz/30oEVFRlokyTKZ9fQ3v+vuK6ueku2z1pZNNArcwpjzHhWCHXKZ2X4rJW+BDpA5ZCkqDLGKWH+yvnlfgT6IlWCMZtZxz0xzN95BtieQA9kAWeZIdYzhPmq18avQKAHmCEEK0ucnxnDTHsCvdCmJ3/ehJmvBLohpzDqGB1qYWaPQBd41MW88yvMPCLQLxLl9bScc2HmCIF+0fcN5tHyWl6NtTDzDIF+kZcQcV8HR0ItzLxCoKGRq7+RhHoEGhpzfYJWBBo6ciqMMwQaINSvqw8AgH0CDRBKoAFCCTRAKIEGCCXQAKEEGiCUQAOEEmiAUAINEEqgAUIJNEAogQYIJdAAoQQaIJRAA4QSaIBQAg0QSqABQgk0QCiBBggl0AChBBoglEADvGX6H1Ht7jCm6Qw9AAAAAElFTkSuQmCC";

const map = JSON.parse(await readFile(join(templateDir, "pdf-field-map.json"), "utf8"));
const pdfDoc = await PDFDocument.load(await readFile(join(templateDir, map.template)));
pdfDoc.registerFontkit(fontkit);
const font = await pdfDoc.embedFont(await readFile(join(fontDir, "NanumGothic-Regular.ttf")), { subset: false });
const page = pdfDoc.getPage(0);

const widthOf = (text, size) => font.widthOfTextAtSize(String(text), size);

for (const [field, value] of Object.entries(data)) {
  const box = map.fields[field];
  if (!box || !value) continue;
  const size = box.fontSize ?? 9.5;
  const text = String(value);
  const x =
    box.align === "right"
      ? box.x + box.width - widthOf(text, size)
      : box.align === "center"
        ? box.x + (box.width - widthOf(text, size)) / 2
        : box.x;
  page.drawText(text, {
    x,
    y: box.y + (box.height - size) / 2,
    size,
    font,
    color: rgb(0.09, 0.13, 0.17),
    maxWidth: box.width,
  });
}

const signatureBox = map.fields.signaturePng;
const image = await pdfDoc.embedPng(Buffer.from(signaturePng, "base64"));
const scale = Math.min(signatureBox.width / image.width, signatureBox.height / image.height);
page.drawImage(image, {
  x: signatureBox.x + (signatureBox.width - image.width * scale) / 2,
  y: signatureBox.y + (signatureBox.height - image.height * scale) / 2,
  width: image.width * scale,
  height: image.height * scale,
});

await mkdir(outDir, { recursive: true });
const outputPath = join(outDir, "sample-pledge-output.pdf");
await writeFile(outputPath, await pdfDoc.save());
console.log(outputPath);
