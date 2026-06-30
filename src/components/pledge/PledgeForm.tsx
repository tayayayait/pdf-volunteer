import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import {
  ChevronRight,
  FileSignature,
  Loader2,
  RotateCcw,
} from "lucide-react";

import { pledgeSchema, type PledgeInput } from "@/lib/pledge/schema";
import {
  amountToKorean,
  formatAmount,
  parseAmount,
  todayISO,
} from "@/lib/pledge/formatters";
import { buildPledgeFileName } from "@/lib/pledge/pledge-file";
import {
  DONATION_PURPOSES,
  DONOR_TYPES,
  PAYMENT_METHODS,
  labelOf,
} from "@/lib/pledge/labels";
import { PENDING_TEMPLATE_DEFAULTS } from "@/lib/pledge/pending-template-fields";
import {
  SignaturePadField,
  type SignaturePadHandle,
} from "./SignaturePadField";

const SECTIONS = [
  { id: "donor", title: "기부자 정보" },
  { id: "contact", title: "연락처 및 주소" },
  { id: "donation", title: "기부금 정보" },
  { id: "payment", title: "납부 방법" },
  { id: "signature", title: "전자 서명" },
  { id: "review", title: "검토 및 생성" },
] as const;

const fileNameFromDisposition = (disposition: string | null, fallback: string): string => {
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] ?? fallback;
};

const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export function PledgeForm() {
  const sigRef = useRef<SignaturePadHandle>(null);
  const submissionId = useRef(uuid());
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<PledgeInput>({
    resolver: zodResolver(pledgeSchema),
    mode: "onTouched",
    defaultValues: {
      pledgeDate: todayISO(),
      donorName: "",
      donorType: "individual",
      donorTypeOther: "",
      mobilePhone: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      donationAmount: undefined as unknown as number,
      donationPurpose: "general",
      departmentName: "",
      purposeOther: "",
      paymentMethod: "bank_transfer",
      signaturePng: "" as unknown as string,
      ...PENDING_TEMPLATE_DEFAULTS,
    },
  });

  const { register, handleSubmit, watch, formState, setValue, control } = form;
  const errors = formState.errors;
  const watched = watch();

  const onSubmit = async (values: PledgeInput) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        ...PENDING_TEMPLATE_DEFAULTS,
        ...values,
        submissionId: submissionId.current,
      };
      const fallbackFileName = buildPledgeFileName(
        values.pledgeDate,
        values.donorName,
        values.donationAmount,
      );
      const response = await fetch("/api/pledges/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(body?.error?.message ?? "PDF 생성 요청이 실패했습니다.");
      }

      const fileName = fileNameFromDisposition(
        response.headers.get("content-disposition"),
        fallbackFileName,
      );
      downloadBlob(await response.blob(), fileName);
      toast.success("PDF 다운로드를 시작했습니다.");
      const search = new URLSearchParams();
      search.set("fileName", fileName);
      window.location.assign(`/complete/${payload.submissionId}?${search.toString()}`);
    } catch (err) {
      console.error(err);
      setServerError("PDF 생성에 실패했습니다. 입력값과 서버 상태를 확인한 뒤 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = () => {
    const firstError = Object.keys(errors)[0];
    if (!firstError) return;
    const el = document.querySelector(`[data-field="${firstError}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const koreanAmount = useMemo(
    () => (watched.donationAmount ? amountToKorean(watched.donationAmount) : ""),
    [watched.donationAmount],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="mx-auto grid w-full max-w-[1120px] gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]"
    >
      <aside className="hidden lg:block">
        <nav className="section-card sticky top-24 space-y-1">
          <p className="mb-3 text-[12px] font-bold tracking-widest text-[var(--color-muted-ink)] uppercase">
            진행 단계
          </p>
          {SECTIONS.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] text-[var(--color-ink)] hover:bg-[var(--color-secondary)]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[12px] font-bold text-[var(--color-campus-navy)]">
                {index + 1}
              </span>
              {section.title}
            </a>
          ))}
        </nav>
      </aside>

      <div className="space-y-6">
        {serverError && (
          <div className="rounded-md border border-[var(--color-danger)] bg-[#FFF7F5] p-4 text-[14px] text-[var(--color-danger)]">
            {serverError}
          </div>
        )}

        <section id="donor" className="section-card">
          <SectionHeader index={1} title="기부자 정보" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="작성일" required name="pledgeDate" error={errors.pledgeDate?.message}>
              <input type="date" className="field-input" {...register("pledgeDate")} />
            </FieldWrap>
            <FieldWrap label="구분" required name="donorType" error={errors.donorType?.message}>
              <select className="field-input" {...register("donorType")}>
                {DONOR_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </FieldWrap>
            <FieldWrap label="성명/기관명" required name="donorName" error={errors.donorName?.message}>
              <input className="field-input" {...register("donorName")} placeholder="홍길동" />
            </FieldWrap>
            {watched.donorType === "other" && (
              <FieldWrap label="기타 구분" required name="donorTypeOther" error={errors.donorTypeOther?.message}>
                <input className="field-input" {...register("donorTypeOther")} />
              </FieldWrap>
            )}
          </div>
        </section>

        <section id="contact" className="section-card">
          <SectionHeader index={2} title="연락처 및 주소" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="휴대전화" name="mobilePhone" error={errors.mobilePhone?.message}>
              <input
                inputMode="tel"
                className="field-input"
                placeholder="010-1234-5678"
                {...register("mobilePhone")}
              />
            </FieldWrap>
            <FieldWrap label="전화" name="phone" error={errors.phone?.message}>
              <input
                inputMode="tel"
                className="field-input"
                placeholder="02-123-4567"
                {...register("phone")}
              />
            </FieldWrap>
            <div className="sm:col-span-2">
              <FieldWrap label="주소" required name="addressLine1" error={errors.addressLine1?.message}>
                <input className="field-input" {...register("addressLine1")} placeholder="서울특별시 ..." />
              </FieldWrap>
            </div>
            <div className="sm:col-span-2">
              <FieldWrap label="상세 주소" name="addressLine2">
                <input className="field-input" {...register("addressLine2")} placeholder="101동 1001호" />
              </FieldWrap>
            </div>
          </div>
        </section>

        <section id="donation" className="section-card">
          <SectionHeader index={3} title="기부금 정보" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="기부금액 (원)" required name="donationAmount" error={errors.donationAmount?.message}>
              <Controller
                control={control}
                name="donationAmount"
                render={({ field }) => (
                  <input
                    inputMode="numeric"
                    className="field-input"
                    value={field.value ? formatAmount(field.value) : ""}
                    onChange={(event) => {
                      const parsed = parseAmount(event.target.value);
                      field.onChange(Number.isFinite(parsed) ? parsed : undefined);
                    }}
                    onBlur={field.onBlur}
                    placeholder="10,000,000"
                  />
                )}
              />
              {koreanAmount && (
                <p className="mt-2 text-[13px] text-[var(--color-forest)]">{koreanAmount}</p>
              )}
            </FieldWrap>
            <FieldWrap label="기부 용도" required name="donationPurpose" error={errors.donationPurpose?.message}>
              <select className="field-input" {...register("donationPurpose")}>
                {DONATION_PURPOSES.map((purpose) => (
                  <option key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </option>
                ))}
              </select>
            </FieldWrap>
            {watched.donationPurpose === "department" && (
              <FieldWrap label="지정 학과/부서" required name="departmentName" error={errors.departmentName?.message}>
                <input className="field-input" {...register("departmentName")} />
              </FieldWrap>
            )}
            {watched.donationPurpose === "other" && (
              <FieldWrap label="기타 기부용도" required name="purposeOther" error={errors.purposeOther?.message}>
                <input className="field-input" {...register("purposeOther")} />
              </FieldWrap>
            )}
          </div>
        </section>

        <section id="payment" className="section-card">
          <SectionHeader index={4} title="납부 방법" />
          <FieldWrap label="납부 방법" required name="paymentMethod" error={errors.paymentMethod?.message}>
            <select className="field-input" {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </FieldWrap>
        </section>

        <section id="signature" className="section-card">
          <SectionHeader index={5} title="전자 서명" />
          <div data-field="signaturePng">
            <p className="field-label field-required">기부자 서명</p>
            <SignaturePadField
              ref={sigRef}
              onChange={(dataUrl) =>
                setValue("signaturePng", dataUrl ?? ("" as unknown as string), {
                  shouldValidate: true,
                })
              }
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="inline-flex h-[44px] items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-4 text-[14px] font-bold text-[var(--color-danger)] hover:bg-[#FFF7F5]"
                onClick={() => {
                  if (confirm("현재 서명을 지우고 다시 작성하시겠습니까?")) {
                    sigRef.current?.clear();
                  }
                }}
              >
                <RotateCcw className="h-4 w-4" /> 다시쓰기
              </button>
            </div>
            {errors.signaturePng?.message && (
              <p className="field-error">{errors.signaturePng.message}</p>
            )}
          </div>
        </section>

        <section id="review" className="section-card">
          <SectionHeader index={6} title="검토 및 생성" />
          <div className="grid gap-3 text-[14px] sm:grid-cols-2">
            <ReviewLine label="작성일" value={watched.pledgeDate} />
            <ReviewLine label="기부자명" value={watched.donorName} />
            <ReviewLine
              label="기부금액"
              value={
                watched.donationAmount
                  ? `${formatAmount(watched.donationAmount)}원 (${amountToKorean(
                      watched.donationAmount,
                    )})`
                  : ""
              }
              strong
            />
            <ReviewLine label="기부용도" value={labelOf(DONATION_PURPOSES, watched.donationPurpose)} />
            <ReviewLine label="납부 방법" value={labelOf(PAYMENT_METHODS, watched.paymentMethod)} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--color-campus-navy)] px-6 text-[16px] font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50 sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> 생성 중...
              </>
            ) : (
              <>
                <FileSignature className="h-5 w-5" /> PDF 생성 및 다운로드{" "}
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </section>
      </div>
    </form>
  );
}

function SectionHeader({ index, title }: { index: number; title: string }) {
  return (
    <header className="mb-5 flex items-center gap-3 border-b border-[var(--color-line)] pb-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-campus-navy)] text-[14px] font-bold text-white">
        {index}
      </span>
      <h2 className="text-[20px] leading-none">{title}</h2>
    </header>
  );
}

function FieldWrap({
  label,
  required,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-field={name}>
      <label className={`field-label ${required ? "field-required" : ""}`}>{label}</label>
      {children}
      {hint && !error && (
        <p className="mt-2 text-[13px] text-[var(--color-muted-ink)]">{hint}</p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function ReviewLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-[var(--color-line)] py-2">
      <span className="text-[var(--color-muted-ink)]">{label}</span>
      <span
        className={`text-right ${
          strong ? "text-[16px] font-bold text-[var(--color-campus-navy)]" : ""
        }`}
      >
        {value || "-"}
      </span>
    </div>
  );
}
