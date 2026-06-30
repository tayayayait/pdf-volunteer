import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { buildPledgeFileName, buildPledgeStoragePath } from "./pledge-file";
import { renderPledgePdf } from "./pdf-renderer";
import type { CreatePledgeInput } from "./pledge-create-schema";

export type CreatePledgeResult = {
  id: string;
  status: "saved";
  fileName: string;
  downloadUrl: string;
  duplicate: boolean;
};

export type PledgePdfLocation = {
  id: string;
  fileName: string;
  filePath: string;
};

type PledgeIndexRecord = {
  id: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
};

type CreatePledgeOptions = {
  storageRoot?: string;
  renderPdf?: (data: CreatePledgeInput) => Promise<Uint8Array>;
  now?: Date;
};

const INDEX_DIR = ".index";

export const getDefaultPledgeStorageRoot = (): string =>
  process.env.PLEDGE_OUTPUT_DIR ?? join(process.cwd(), "storage", "pledges");

const indexPathFor = (storageRoot: string, id: string): string =>
  join(storageRoot, INDEX_DIR, `${id}.json`);

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const readIndexRecord = async (
  id: string,
  storageRoot: string,
): Promise<PledgeIndexRecord | null> => {
  try {
    const raw = await readFile(indexPathFor(storageRoot, id), "utf8");
    return JSON.parse(raw) as PledgeIndexRecord;
  } catch {
    return null;
  }
};

const ensureInsideRoot = (storageRoot: string, filePath: string): string => {
  const root = resolve(storageRoot);
  const target = resolve(filePath);
  if (target !== root && !target.startsWith(`${root}\\`) && !target.startsWith(`${root}/`)) {
    throw new Error("INVALID_PLEDGE_STORAGE_PATH");
  }
  return target;
};

const uniqueFileLocation = async (
  storageRoot: string,
  pledgeDate: string,
  donorName: string,
  donationAmount: number,
): Promise<{ fileName: string; storagePath: string; filePath: string }> => {
  for (let duplicateIndex = 0; duplicateIndex <= 999; duplicateIndex += 1) {
    const fileName = buildPledgeFileName(pledgeDate, donorName, donationAmount, duplicateIndex);
    const storagePath = buildPledgeStoragePath(pledgeDate, fileName);
    const filePath = ensureInsideRoot(storageRoot, join(storageRoot, storagePath));
    if (!(await fileExists(filePath))) return { fileName, storagePath, filePath };
  }

  throw new Error("STORAGE_NAMING_OVERFLOW");
};

export const resolvePledgePdf = async (
  id: string,
  storageRoot = getDefaultPledgeStorageRoot(),
): Promise<PledgePdfLocation | null> => {
  const record = await readIndexRecord(id, storageRoot);
  if (!record) return null;

  const filePath = ensureInsideRoot(storageRoot, join(storageRoot, record.storagePath));
  if (!(await fileExists(filePath))) return null;

  return { id: record.id, fileName: record.fileName, filePath };
};

export const createPledgeRecord = async (
  data: CreatePledgeInput,
  options: CreatePledgeOptions = {},
): Promise<CreatePledgeResult> => {
  const storageRoot = options.storageRoot ?? getDefaultPledgeStorageRoot();
  const existing = await resolvePledgePdf(data.submissionId, storageRoot);
  if (existing) {
    return {
      id: existing.id,
      status: "saved",
      fileName: existing.fileName,
      downloadUrl: `/api/pledges/${existing.id}/pdf`,
      duplicate: true,
    };
  }

  const { fileName, storagePath, filePath } = await uniqueFileLocation(
    storageRoot,
    data.pledgeDate,
    data.donorName,
    data.donationAmount,
  );
  const renderer = options.renderPdf ?? renderPledgePdf;
  const pdfBytes = await renderer(data);

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, pdfBytes);

  const record: PledgeIndexRecord = {
    id: data.submissionId,
    fileName,
    storagePath,
    createdAt: (options.now ?? new Date()).toISOString(),
  };
  const indexPath = indexPathFor(storageRoot, data.submissionId);
  await mkdir(dirname(indexPath), { recursive: true });
  await writeFile(indexPath, JSON.stringify(record, null, 2), "utf8");

  return {
    id: data.submissionId,
    status: "saved",
    fileName,
    downloadUrl: `/api/pledges/${data.submissionId}/pdf`,
    duplicate: false,
  };
};
