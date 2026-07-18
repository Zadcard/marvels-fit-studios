export function attachmentContentDisposition(fileName: string) {
  const normalized = fileName.trim() || "download";
  const asciiFallback = normalized
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\/]/g, "_");

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(normalized)}`;
}
