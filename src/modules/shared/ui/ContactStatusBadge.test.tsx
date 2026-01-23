import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactStatusBadge } from "./ContactStatusBadge";

describe("ContactStatusBadge", () => {
  it("renders NEW status correctly", () => {
    render(<ContactStatusBadge status="NEW" />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("renders READ status correctly", () => {
    render(<ContactStatusBadge status="READ" />);
    expect(screen.getByText("Read")).toBeInTheDocument();
  });

  it("renders ARCHIVED status correctly", () => {
    render(<ContactStatusBadge status="ARCHIVED" />);
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });

  it("applies blue styling for NEW status", () => {
    render(<ContactStatusBadge status="NEW" />);
    const badge = screen.getByText("New");
    expect(badge).toHaveClass("bg-blue-100");
    expect(badge).toHaveClass("text-blue-800");
  });

  it("applies gray styling for READ status", () => {
    render(<ContactStatusBadge status="READ" />);
    const badge = screen.getByText("Read");
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-800");
  });

  it("applies yellow styling for ARCHIVED status", () => {
    render(<ContactStatusBadge status="ARCHIVED" />);
    const badge = screen.getByText("Archived");
    expect(badge).toHaveClass("bg-yellow-100");
    expect(badge).toHaveClass("text-yellow-800");
  });
});
