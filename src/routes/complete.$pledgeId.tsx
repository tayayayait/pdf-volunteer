import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FilePlus2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/complete/$pledgeId")({
  head: () => ({
    meta: [{ title: "약정서 생성 완료" }],
  }),
  component: CompletePage,
});

function CompletePage() {
  const { pledgeId } = Route.useParams();
  const search = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const fileName = search.get("fileName");
  const downloadUrl = search.get("downloadUrl");

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppHeader />
      <main className="mx-auto flex max-w-[640px] flex-col items-center px-4 py-16">
        <div className="rounded-full bg-[#EAF5F2] p-6">
          <CheckCircle2 className="h-12 w-12 text-[var(--color-forest)]" />
        </div>
        <h1 className="mt-6 text-[28px]">약정서가 생성되었습니다</h1>
        <p className="mt-3 text-center text-[15px] text-[var(--color-muted-ink)]">
          PDF 파일이 생성되어 로컬 저장소에 저장되었습니다.
          <br />
          아래 파일명과 접수 ID를 확인하세요.
        </p>
        {fileName && (
          <div className="mt-6 max-w-full rounded-md border border-dashed border-[var(--color-line)] bg-white px-5 py-3 text-center font-mono text-[13px] text-[var(--color-ink)]">
            {fileName}
          </div>
        )}
        <div className="mt-6 rounded-md border border-dashed border-[var(--color-line)] bg-white px-5 py-3 font-mono text-[13px] text-[var(--color-ink)]">
          {pledgeId}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--color-forest)] px-5 text-[15px] font-bold text-white hover:brightness-110"
            >
              PDF 다운로드
            </a>
          )}
          <Link
            to="/"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--color-campus-navy)] px-5 text-[15px] font-bold text-white hover:brightness-110"
          >
            <FilePlus2 className="h-5 w-5" /> 새 약정서 작성
          </Link>
        </div>
      </main>
    </div>
  );
}
