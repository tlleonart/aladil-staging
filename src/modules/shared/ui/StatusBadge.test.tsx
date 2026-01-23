import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders DRAFT status correctly", () => {
    render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders PUBLISHED status correctly", () => {
    render(<StatusBadge status="PUBLISHED" />);
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders ARCHIVED status correctly", () => {
    render(<StatusBadge status="ARCHIVED" />);
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });

  it("applies correct class for DRAFT", () => {
    render(<StatusBadge status="DRAFT" />);
    const badge = screen.getByText("Draft");
    expect(badge).toHaveClass("bg-yellow-100");
    expect(badge).toHaveClass("text-yellow-800");
  });

  it("applies correct class for PUBLISHED", () => {
    render(<StatusBadge status="PUBLISHED" />);
    const badge = screen.getByText("Published");
    expect(badge).toHaveClass("bg-green-100");
    expect(badge).toHaveClass("text-green-800");
  });

  it("applies correct class for ARCHIVED", () => {
    render(<StatusBadge status="ARCHIVED" />);
    const badge = screen.getByText("Archived");
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-800");
  });
});
