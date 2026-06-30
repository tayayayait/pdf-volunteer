export function formatAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? Number(value.replace(/[^\d]/g, "")) : value;
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("ko-KR");
}

export function parseAmount(input: string): number {
  const cleaned = input.replace(/[^\d]/g, "");
  return cleaned ? Number(cleaned) : NaN;
}

const KOREAN_DIGITS = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const KOREAN_SMALL = ["", "십", "백", "천"];
const KOREAN_BIG = ["", "만", "억", "조"];

export function amountToKorean(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  const s = String(Math.floor(amount));
  let result = "";
  const groups: string[] = [];
  for (let i = s.length; i > 0; i -= 4) {
    groups.unshift(s.slice(Math.max(0, i - 4), i));
  }
  groups.forEach((group, idx) => {
    const big = KOREAN_BIG[groups.length - 1 - idx];
    let chunk = "";
    const padded = group.padStart(4, "0");
    for (let i = 0; i < 4; i++) {
      const digit = Number(padded[i]);
      if (digit > 0) {
        const small = KOREAN_SMALL[3 - i];
        chunk += (digit === 1 && small ? "" : KOREAN_DIGITS[digit]) + small;
      }
    }
    if (chunk) result += chunk + big;
  });
  return result + "원";
}

export function formatDateKorean(date: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export function formatDateDot(date: string): string {
  if (!date) return "";
  return date.replace(/-/g, ".");
}

export function todayISO(): string {
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_");
}

export function pdfFileName(pledgeDate: string, donorName: string, amount: number): string {
  const ymd = pledgeDate.replace(/-/g, "");
  return `${ymd}_${sanitizeFileName(donorName)}_${amount}.pdf`;
}
