import "server-only";

export const COACH_FILES_BUCKET = "coach-files";
export const MAX_COACH_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_COACH_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function createCoachFilePath(
  scope: "client" | "group",
  targetId: string,
  originalName: string
) {
  const rawExtension = originalName.includes(".")
    ? originalName.split(".").pop()
    : null;
  const extension = rawExtension?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = extension ? `.${extension.slice(0, 10)}` : "";

  return `${scope}/${targetId}/${crypto.randomUUID()}${suffix}`;
}
