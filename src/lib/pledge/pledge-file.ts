const FORBIDDEN_FILE_NAME_CHARS = /[\\/:*?"<>|]/g;

export const sanitizeDonorFileName = (donorName: string): string => {
  const sanitized = donorName.trim().replace(FORBIDDEN_FILE_NAME_CHARS, "").replace(/\s+/g, "_");
  return sanitized || "unknown";
};

export const buildPledgeFileName = (
  pledgeDate: string,
  donorName: string,
  donationAmount: number,
  duplicateIndex = 0,
): string => {
  const date = pledgeDate.replace(/-/g, "");
  const donor = sanitizeDonorFileName(donorName);
  const suffix = duplicateIndex > 0 ? `_${String(duplicateIndex).padStart(3, "0")}` : "";
  return `${date}_${donor}_${Math.trunc(donationAmount)}${suffix}.pdf`;
};

export const buildPledgeStoragePath = (pledgeDate: string, fileName: string): string => {
  const yyyy = pledgeDate.slice(0, 4);
  const mm = pledgeDate.slice(5, 7);
  return `${yyyy}/${mm}/${fileName}`;
};
