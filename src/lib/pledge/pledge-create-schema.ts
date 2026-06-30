import { z } from "zod";

const phoneRegex = /^[0-9\-()\s]+$/;

export const createPledgeInputSchema = z
  .object({
    submissionId: z.string().uuid(),
    pledgeDate: z.string().min(1, "작성일을 선택하세요."),
    donorName: z.string().trim().min(2).max(50),
    donorType: z.enum([
      "individual",
      "corporate",
      "alumni",
      "parent",
      "faculty",
      "staff",
      "organization",
      "other",
    ]),
    donorTypeOther: z.string().trim().max(30).optional().default(""),
    birthOrBusinessNo: z.string().trim().max(13).regex(/^[0-9\-]*$/).optional().default(""),
    mobilePhone: z.string().trim().regex(phoneRegex).optional().or(z.literal("")).default(""),
    phone: z.string().trim().regex(phoneRegex).optional().or(z.literal("")).default(""),
    email: z.string().trim().email().optional().or(z.literal("")).default(""),
    postalCode: z.string().trim().regex(/^[0-9]{5}$|^$/).optional().default(""),
    addressLine1: z.string().trim().min(5).max(100),
    addressLine2: z.string().trim().max(100).optional().default(""),
    donationAmount: z.number().int().min(10000).max(9_999_999_999),
    donationPurpose: z.enum(["general", "scholarship", "department", "building", "research", "other"]),
    departmentName: z.string().trim().max(50).optional().default(""),
    purposeOther: z.string().trim().max(100).optional().default(""),
    paymentType: z.enum(["one_time", "recurring"]).optional().default("one_time"),
    paymentMethod: z.enum(["bank_transfer", "cms", "salary_deduction", "visit", "other"]),
    pledgeStartDate: z.string().optional().default(""),
    recurringMonths: z.number().int().min(1).max(120).optional(),
    withdrawalDay: z.enum(["5", "15", "25"]).optional().or(z.literal("")).default(""),
    bankName: z.string().trim().max(50).optional().default(""),
    accountNumber: z.string().trim().regex(/^[0-9\-]*$/).max(30).optional().default(""),
    accountHolder: z.string().trim().max(50).optional().default(""),
    privacyConsent: z.boolean().optional().default(false),
    receiptConsent: z.boolean().optional().default(false),
    signaturePng: z.string().startsWith("data:image/png;base64,"),
  })
  .superRefine((data, ctx) => {
    if (!data.mobilePhone && !data.phone) {
      ctx.addIssue({ code: "custom", path: ["mobilePhone"], message: "휴대전화 또는 전화를 1개 이상 입력하세요." });
    }
    if (data.donorType === "other" && !data.donorTypeOther) {
      ctx.addIssue({ code: "custom", path: ["donorTypeOther"], message: "기타 구분 내용을 입력하세요." });
    }
    if (data.donationPurpose === "department" && !data.departmentName) {
      ctx.addIssue({ code: "custom", path: ["departmentName"], message: "지정 학과/부서를 입력하세요." });
    }
    if (data.donationPurpose === "other" && !data.purposeOther) {
      ctx.addIssue({ code: "custom", path: ["purposeOther"], message: "기타 기부용도를 입력하세요." });
    }
    if (data.paymentType === "recurring" && !data.pledgeStartDate) {
      ctx.addIssue({ code: "custom", path: ["pledgeStartDate"], message: "납부 시작일을 선택하세요." });
    }
    if (data.paymentType === "recurring" && !data.recurringMonths) {
      ctx.addIssue({ code: "custom", path: ["recurringMonths"], message: "약정 개월을 입력하세요." });
    }
    if (data.paymentMethod === "cms" && !data.withdrawalDay) {
      ctx.addIssue({ code: "custom", path: ["withdrawalDay"], message: "CMS 출금일을 선택하세요." });
    }
  });

export type CreatePledgeInput = z.infer<typeof createPledgeInputSchema>;
