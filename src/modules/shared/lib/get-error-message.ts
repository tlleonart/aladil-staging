/**
 * Extracts a user-friendly error message from an unknown error object.
 * Works with ORPC errors, standard Error instances, and unknown shapes.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado",
): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || fallback;
  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}
