// src/utils/imagePayload.ts
//
// Builds the `Images[]` / `AfterImages[]` arrays the task APIs expect next to
// the legacy fixed fields (Pick1..3, DeviceInfoImagePath, FieldPhoto..).
// Mirrors Java's "GET ARRAY OF 12 IMAGES HERE FOR POST" blocks (CountdownTechFragmentNew,
// TaskDialogNew.updateTask, TaskClosureFragmentNew.validate): keep only non-empty,
// de-duplicated base64 strings and give each one a unique timestamp_random name.

export interface ImagePayloadItem {
  Base64File: string;
  OriginalFileName: string;
  FileId?: number;
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

// Java: DateUtils.getDate(now, "yyyyMMdd_HHmmssSSS")
const timestamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_` +
  `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}${pad(d.getMilliseconds(), 3)}`;

/** Unique file name, e.g. "20260924_101530123_487". */
export const uniqueImageName = () =>
  `${timestamp(new Date())}_${Math.floor(Math.random() * 1000)}`;

/**
 * @param withFileId set true for the on-hold API, which Java posts with `FileId: 0`.
 */
export function buildImagesPayload(
  base64List: (string | null | undefined)[],
  withFileId = false,
): ImagePayloadItem[] | undefined {
  const seen = new Set<string>();
  const items: ImagePayloadItem[] = [];

  for (const raw of base64List) {
    const b64 = raw?.trim();
    if (!b64 || seen.has(b64)) continue;
    seen.add(b64);
    items.push({
      Base64File: b64,
      OriginalFileName: uniqueImageName(),
      ...(withFileId ? { FileId: 0 } : {}),
    });
  }

  // Java sends null when there are no images.
  return items.length > 0 ? items : undefined;
}
