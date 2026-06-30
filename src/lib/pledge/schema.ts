import { z } from "zod";

const phoneRegex = /^[0-9\-()\s]+$/;

export const pledgeSchema = z
  .object({
    pledgeDate: z.string().min(1, "작성일을 선택하세요."),

    donorName: z
      .string()
      .trim()
      .min(2, "기부자명은 2자 이상 입력하세요.")
      .max(50, "기부자명은 50자 이하로 입력하세요."),
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
    birthOrBusinessNo: z
      .string()
      .trim()
      .max(13)
      .regex(/^[0-9\-]*$/, "숫자와 하이픈만 입력하세요.")
      .optional()
      .default(""),

    mobilePhone: z.string().trim().regex(phoneRegex, "전화번호 형식이 올바르지 않습니다.").optional().or(z.literal("")).default(""),
    phone: z.string().trim().regex(phoneRegex, "전화번호 형식이 올바르지 않습니다.").optional().or(z.literal("")).default(""),
    email: z.string().trim().email("이메일 형식을 확인하세요.").optional().or(z.literal("")).default(""),

    postalCode: z
      .string()
      .trim()
      .regex(/^[0-9]{5}$|^$/, "우편번호는 숫자 5자리로 입력하세요.")
      .optional()
      .default(""),
    addressLine1: z.string().trim().min(5, "주소를 입력하세요.").max(100),
    addressLine2: z.string().trim().max(100).optional().default(""),

    donationAmount: z
      .number({ message: "기부금액을 입력하세요." })
      .int()
      .min(10000, "기부금액은 10,000원 이상 입력하세요.")
      .max(9_999_999_999, "기부금액은 9,999,999,999원 이하로 입력하세요."),
    donationPurpose: z.enum([
      "general",
      "scholarship",
      "department",
      "building",
      "research",
      "other",
    ]),
    departmentName: z.string().trim().max(50).optional().default(""),
    purposeOther: z.string().trim().max(100).optional().default(""),

    paymentType: z.enum(["one_time", "recurring"]).optional().default("one_time"),
    paymentMethod: z.enum([
      "bank_transfer",
      "cms",
      "salary_deduction",
      "visit",
      "other",
    ]),
    pledgeStartDate: z.string().optional().default(""),
    recurringMonths: z
      .number()
      .int()
      .min(1, "약정 개월은 1개월 이상이어야 합니다.")
      .max(120, "약정 개월은 120개월 이하여야 합니다.")
      .optional()
      .or(z.nan().transform(() => undefined)),
    withdrawalDay: z.enum(["5", "15", "25"]).optional().or(z.literal("")).default(""),
    bankName: z.string().trim().max(50).optional().default(""),
    accountNumber: z
      .string()
      .trim()
      .regex(/^[0-9\-]*$/, "숫자와 하이픈만 입력하세요.")
      .max(30)
      .optional()
      .default(""),
    accountHolder: z.string().trim().max(50).optional().default(""),

    privacyConsent: z.boolean().optional().default(false),
    receiptConsent: z.boolean().optional().default(false),

    signaturePng: z
      .string()
      .startsWith("data:image/png;base64,", "전자서명을 입력하세요."),
  })
  .superRefine((data, ctx) => {
    if (!data.mobilePhone && !data.phone) {
      ctx.addIssue({
        code: "custom",
        path: ["mobilePhone"],
        message: "휴대전화 또는 전화를 1개 이상 입력하세요.",
      });
    }
    if (data.donorType === "other" && !data.donorTypeOther) {
      ctx.addIssue({
        code: "custom",
        path: ["donorTypeOther"],
        message: "기타 구분 내용을 입력하세요.",
      });
    }
    if (data.donationPurpose === "department" && !data.departmentName) {
      ctx.addIssue({
        code: "custom",
        path: ["departmentName"],
        message: "지정 학과/부서를 입력하세요.",
      });
    }
    if (data.donationPurpose === "other" && !data.purposeOther) {
      ctx.addIssue({
        code: "custom",
        path: ["purposeOther"],
        message: "기타 기부용도를 입력하세요.",
      });
    }
    if (data.paymentType === "recurring") {
      if (!data.pledgeStartDate) {
        ctx.addIssue({
          code: "custom",
          path: ["pledgeStartDate"],
          message: "납부 시작일을 선택하세요.",
        });
      }
      if (!data.recurringMonths) {
        ctx.addIssue({
          code: "custom",
          path: ["recurringMonths"],
          message: "약정 개월을 입력하세요.",
        });
      }
    }
    if (data.paymentMethod === "cms" && !data.withdrawalDay) {
      ctx.addIssue({
        code: "custom",
        path: ["withdrawalDay"],
        message: "CMS 출금일을 선택하세요.",
      });
    }
  });

export type PledgeInput = z.infer<typeof pledgeSchema>;
