export const DONOR_TYPES = [
  { value: "individual", label: "개인" },
  { value: "alumni", label: "동문" },
  { value: "parent", label: "학부모" },
  { value: "faculty", label: "교원" },
  { value: "staff", label: "직원" },
  { value: "corporate", label: "법인" },
  { value: "organization", label: "단체" },
  { value: "other", label: "기타" },
] as const;

export const DONATION_PURPOSES = [
  { value: "general", label: "일반 발전기금" },
  { value: "scholarship", label: "장학기금" },
  { value: "department", label: "지정 학과/부서" },
  { value: "building", label: "건축기금" },
  { value: "research", label: "연구기금" },
  { value: "other", label: "기타" },
] as const;

export const PAYMENT_TYPES = [
  { value: "one_time", label: "일시 납부" },
  { value: "recurring", label: "정기 납부" },
] as const;

export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "계좌이체 (가상계좌/무통장)" },
  { value: "cms", label: "CMS 자동이체" },
  { value: "salary_deduction", label: "급여 공제" },
  { value: "visit", label: "방문 납부" },
  { value: "other", label: "기타" },
] as const;

export const WITHDRAWAL_DAYS = [
  { value: "5", label: "매월 5일" },
  { value: "15", label: "매월 15일" },
  { value: "25", label: "매월 25일" },
] as const;

export function labelOf<T extends readonly { value: string; label: string }[]>(
  list: T,
  value: string | null | undefined,
): string {
  if (!value) return "";
  return list.find((item) => item.value === value)?.label ?? value;
}

const runtimeEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const processEnv =
  typeof process === "undefined" ? ({} as Record<string, string | undefined>) : process.env;

export const ORGANIZATION_NAME =
  runtimeEnv?.VITE_ORGANIZATION_NAME ?? processEnv.ORGANIZATION_NAME ?? "샘플대학교";
export const APP_TITLE = "발전기금 기부약정서";
