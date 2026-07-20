const MAX_SIZE_BYTES = 7 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "text/plain"]);

/**
 * Validates files client-side before they ever touch the network -
 * same 7MB limit and type allow-list the server enforces.
 * See PRD §4.2, FRONTEND.md §4.2.
 */
export function useFileValidation() {
  function validateFiles(fileList) {
    const files = Array.from(fileList);
    const valid = [];
    const errors = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        errors.push(`"${file.name}" isn't a supported type (PDF or .txt only).`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`"${file.name}" is over the 7MB limit.`);
        continue;
      }
      valid.push(file);
    }

    return { valid, errors };
  }

  return { validateFiles, maxSizeBytes: MAX_SIZE_BYTES };
}
