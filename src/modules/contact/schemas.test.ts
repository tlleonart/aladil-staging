import { describe, expect, it } from "vitest";
import { ContactMessageSchema, ListContactQuerySchema } from "./schemas";

describe("ContactMessageSchema", () => {
  it("should validate a complete contact message", () => {
    const validMessage = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message",
      status: "NEW" as const,
      createdAt: new Date(),
    };

    const result = ContactMessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const invalidMessage = {
      id: "not-a-uuid",
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test message",
      status: "NEW",
      createdAt: new Date(),
    };

    const result = ContactMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const invalidMessage = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      email: "not-an-email",
      message: "This is a test message",
      status: "NEW",
      createdAt: new Date(),
    };

    const result = ContactMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it("should reject missing email", () => {
    const invalidMessage = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      message: "This is a test message",
      status: "NEW",
      createdAt: new Date(),
    };

    const result = ContactMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it("should validate all status values", () => {
    const statuses = ["NEW", "READ", "ARCHIVED"] as const;

    for (const status of statuses) {
      const message = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John Doe",
        email: "john@example.com",
        message: "Test message",
        status,
        createdAt: new Date(),
      };

      const result = ContactMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid status", () => {
    const invalidMessage = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      email: "john@example.com",
      message: "Test message",
      status: "INVALID_STATUS",
      createdAt: new Date(),
    };

    const result = ContactMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it("should reject missing name", () => {
    const invalidMessage = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "john@example.com",
      message: "Test message",
      status: "NEW",
      createdAt: new Date(),
    };

    const result = ContactMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it("should reject missing message", () => {
    const invalidMessage = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      email: "john@example.com",
      status: "NEW",
      createdAt: new Date(),
    };

    const result = ContactMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it("should reject missing createdAt", () => {
    const invalidMessage = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      email: "john@example.com",
      message: "Test message",
      status: "NEW",
    };

    const result = ContactMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it("should reject invalid createdAt type", () => {
    const invalidMessage = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      email: "john@example.com",
      message: "Test message",
      status: "NEW",
      createdAt: "not-a-date",
    };

    const result = ContactMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it("should accept various valid email formats", () => {
    const validEmails = [
      "test@example.com",
      "user.name@domain.org",
      "user+tag@example.co.uk",
      "name123@subdomain.domain.com",
    ];

    for (const email of validEmails) {
      const message = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John Doe",
        email,
        message: "Test message",
        status: "NEW" as const,
        createdAt: new Date(),
      };

      const result = ContactMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    }
  });

  it("should reject various invalid email formats", () => {
    const invalidEmails = [
      "plainaddress",
      "@missinglocal.com",
      "missing@.com",
      "missing.domain@",
      "spaces in@email.com",
    ];

    for (const email of invalidEmails) {
      const message = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John Doe",
        email,
        message: "Test message",
        status: "NEW",
        createdAt: new Date(),
      };

      const result = ContactMessageSchema.safeParse(message);
      expect(result.success).toBe(false);
    }
  });
});

describe("ListContactQuerySchema", () => {
  it("should use default limit of 50", () => {
    const result = ListContactQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("should accept status filter NEW", () => {
    const result = ListContactQuerySchema.safeParse({ status: "NEW" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("NEW");
    }
  });

  it("should accept status filter READ", () => {
    const result = ListContactQuerySchema.safeParse({ status: "READ" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("READ");
    }
  });

  it("should accept status filter ARCHIVED", () => {
    const result = ListContactQuerySchema.safeParse({ status: "ARCHIVED" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("ARCHIVED");
    }
  });

  it("should reject invalid status filter", () => {
    const result = ListContactQuerySchema.safeParse({ status: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("should accept cursor for pagination", () => {
    const result = ListContactQuerySchema.safeParse({
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("should reject invalid cursor format", () => {
    const result = ListContactQuerySchema.safeParse({
      cursor: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject limit below 1", () => {
    const result = ListContactQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative limit", () => {
    const result = ListContactQuerySchema.safeParse({ limit: -5 });
    expect(result.success).toBe(false);
  });

  it("should reject limit above 100", () => {
    const result = ListContactQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("should accept limit at minimum (1)", () => {
    const result = ListContactQuerySchema.safeParse({ limit: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(1);
    }
  });

  it("should accept limit at maximum (100)", () => {
    const result = ListContactQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });

  it("should accept limit within range", () => {
    const result = ListContactQuerySchema.safeParse({ limit: 25 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it("should reject non-integer limit", () => {
    const result = ListContactQuerySchema.safeParse({ limit: 10.5 });
    expect(result.success).toBe(false);
  });

  it("should accept all optional parameters together", () => {
    const result = ListContactQuerySchema.safeParse({
      status: "NEW",
      limit: 25,
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("NEW");
      expect(result.data.limit).toBe(25);
      expect(result.data.cursor).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("should have undefined status when not provided", () => {
    const result = ListContactQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
    }
  });

  it("should have undefined cursor when not provided", () => {
    const result = ListContactQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBeUndefined();
    }
  });
});
