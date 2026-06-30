import { createFileRoute } from "@tanstack/react-router";
import { PledgeForm } from "@/components/pledge/PledgeForm";
import { AppHeader } from "@/components/AppHeader";
import { APP_TITLE, ORGANIZATION_NAME } from "@/lib/pledge/labels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP_TITLE} | ${ORGANIZATION_NAME}` },
      {
        name: "description",
        content: "태블릿에서 작성하는 전자 기부약정서. 입력 → 서명 → PDF 다운로드까지 한 화면에서.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppHeader />
      <PledgeForm />
    </div>
  );
}
