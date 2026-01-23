import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActiveBadge } from "./ActiveBadge";

describe("ActiveBadge", () => {
  it("renders Active when isActive is true", () => {
    render(<ActiveBadge isActive={true} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Inactive when isActive is false", () => {
    render(<ActiveBadge isActive={false} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("applies green styling for active state", () => {
    render(<ActiveBadge isActive={true} />);
    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("bg-green-100");
    expect(badge).toHaveClass("text-green-800");
  });

  it("applies red styling for inactive state", () => {
    render(<ActiveBadge isActive={false} />);
    const badge = screen.getByText("Inactive");
    expect(badge).toHaveClass("bg-red-100");
    expect(badge).toHaveClass("text-red-800");
  });
});
