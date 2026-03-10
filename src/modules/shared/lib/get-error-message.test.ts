import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./get-error-message";

describe("getErrorMessage", () => {
  it("returns fallback for null/undefined", () => {
    expect(getErrorMessage(null)).toBe("Ocurrió un error inesperado");
    expect(getErrorMessage(undefined)).toBe("Ocurrió un error inesperado");
  });

  it("returns custom fallback", () => {
    expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
  });

  it("returns string errors directly", () => {
    expect(getErrorMessage("Something broke")).toBe("Something broke");
  });

  it("extracts message from Error instances", () => {
    expect(getErrorMessage(new Error("DB connection failed"))).toBe(
      "DB connection failed",
    );
  });

  it("returns fallback for Error with empty message", () => {
    expect(getErrorMessage(new Error(""))).toBe("Ocurrió un error inesperado");
  });

  it("extracts message from plain objects", () => {
    expect(getErrorMessage({ message: "Not found" })).toBe("Not found");
  });

  it("returns fallback for objects without message", () => {
    expect(getErrorMessage({ code: 500 })).toBe("Ocurrió un error inesperado");
  });

  it("returns fallback for non-string message properties", () => {
    expect(getErrorMessage({ message: 42 })).toBe(
      "Ocurrió un error inesperado",
    );
  });

  it("handles ORPC-style error objects", () => {
    const orpcError = {
      message: "Permission denied: news.create",
      code: "FORBIDDEN",
    };
    expect(getErrorMessage(orpcError)).toBe(
      "Permission denied: news.create",
    );
  });
});
