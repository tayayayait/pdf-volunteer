import { describe, expect, it } from "vitest";

import { buildPledgeFileName, buildPledgeStoragePath } from "./pledge-file";

describe("pledge PDF file naming", () => {
  it("uses pledge date, sanitized donor name, and integer amount", () => {
    expect(buildPledgeFileName("2026-06-29", ' 홍 / 길:동 <A> ', 10000000)).toBe(
      "20260629_홍_길동_A_10000000.pdf",
    );
  });

  it("adds a three digit suffix for duplicate file names", () => {
    expect(buildPledgeFileName("2026-06-29", "홍길동", 10000000, 2)).toBe(
      "20260629_홍길동_10000000_002.pdf",
    );
  });

  it("stores PDFs below year and month folders", () => {
    expect(buildPledgeStoragePath("2026-06-29", "20260629_홍길동_10000000.pdf")).toBe(
      "2026/06/20260629_홍길동_10000000.pdf",
    );
  });
});
