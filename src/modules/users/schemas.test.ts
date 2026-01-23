import { describe, expect, it } from "vitest";
import {
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  UserSchema,
} from "./schemas";

describe("UserSchema", () => {
  it("should validate a complete user", () => {
    const validUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      name: "John Doe",
      isActive: true,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const invalidUser = {
      id: "not-a-uuid",
      email: "user@example.com",
      name: "John Doe",
      isActive: true,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = UserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const invalidUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "invalid-email",
      name: "John Doe",
      isActive: true,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = UserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it("should require all fields", () => {
    const incompleteUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
    };

    const result = UserSchema.safeParse(incompleteUser);
    expect(result.success).toBe(false);
  });

  it("should validate boolean fields", () => {
    const userWithInvalidBoolean = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      name: "John Doe",
      isActive: "yes", // Should be boolean
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = UserSchema.safeParse(userWithInvalidBoolean);
    expect(result.success).toBe(false);
  });

  it("should validate date fields", () => {
    const userWithInvalidDate = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      name: "John Doe",
      isActive: true,
      isSuperAdmin: false,
      createdAt: "not-a-date",
      updatedAt: new Date(),
    };

    const result = UserSchema.safeParse(userWithInvalidDate);
    expect(result.success).toBe(false);
  });

  it("should accept user with super admin privileges", () => {
    const superAdmin = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "admin@example.com",
      name: "Admin User",
      isActive: true,
      isSuperAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = UserSchema.safeParse(superAdmin);
    expect(result.success).toBe(true);
  });

  it("should accept inactive user", () => {
    const inactiveUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "inactive@example.com",
      name: "Inactive User",
      isActive: false,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = UserSchema.safeParse(inactiveUser);
    expect(result.success).toBe(true);
  });
});

describe("CreateUserSchema", () => {
  it("should validate a complete create input", () => {
    const input = {
      email: "newuser@example.com",
      name: "New User",
      password: "securePassword123",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should require email", () => {
    const input = {
      name: "New User",
      password: "securePassword123",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require name", () => {
    const input = {
      email: "newuser@example.com",
      password: "securePassword123",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require password", () => {
    const input = {
      email: "newuser@example.com",
      name: "New User",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const input = {
      email: "not-valid-email",
      name: "New User",
      password: "securePassword123",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("should reject empty name", () => {
    const input = {
      email: "newuser@example.com",
      name: "",
      password: "securePassword123",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("should reject name over 255 characters", () => {
    const input = {
      email: "newuser@example.com",
      name: "a".repeat(256),
      password: "securePassword123",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept name exactly 255 characters", () => {
    const input = {
      email: "newuser@example.com",
      name: "a".repeat(255),
      password: "securePassword123",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject password under 8 characters", () => {
    const input = {
      email: "newuser@example.com",
      name: "New User",
      password: "short",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must be at least 8 characters",
      );
    }
  });

  it("should accept password exactly 8 characters", () => {
    const input = {
      email: "newuser@example.com",
      name: "New User",
      password: "12345678",
      isActive: true,
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should require isActive field", () => {
    const input = {
      email: "newuser@example.com",
      name: "New User",
      password: "securePassword123",
      isSuperAdmin: false,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require isSuperAdmin field", () => {
    const input = {
      email: "newuser@example.com",
      name: "New User",
      password: "securePassword123",
      isActive: true,
    };

    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept various valid email formats", () => {
    const validEmails = [
      "test@example.com",
      "user.name@domain.org",
      "user+tag@example.co.uk",
      "firstname.lastname@company.net",
    ];

    for (const email of validEmails) {
      const input = {
        email,
        name: "Test User",
        password: "securePassword123",
        isActive: true,
        isSuperAdmin: false,
      };

      const result = CreateUserSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });
});

describe("UpdateUserSchema", () => {
  it("should allow partial updates", () => {
    const input = {
      name: "Updated Name",
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow empty object", () => {
    const result = UpdateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should allow updating only email", () => {
    const input = {
      email: "newemail@example.com",
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only password", () => {
    const input = {
      password: "newSecurePassword123",
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only isActive", () => {
    const input = {
      isActive: false,
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only isSuperAdmin", () => {
    const input = {
      isSuperAdmin: true,
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating multiple fields", () => {
    const input = {
      email: "updated@example.com",
      name: "Updated Name",
      isActive: false,
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate email format when provided", () => {
    const input = {
      email: "invalid-email",
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("should validate name max length when provided", () => {
    const input = {
      name: "a".repeat(256),
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should allow empty name in update", () => {
    // Note: UpdateUserSchema does not have min(1) constraint unlike CreateUserSchema
    const input = {
      name: "",
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate password min length when provided", () => {
    const input = {
      password: "short",
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must be at least 8 characters",
      );
    }
  });

  it("should accept password exactly 8 characters when provided", () => {
    const input = {
      password: "12345678",
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow full update of all fields", () => {
    const input = {
      email: "fullyupdated@example.com",
      name: "Fully Updated Name",
      password: "newSecurePassword456",
      isActive: true,
      isSuperAdmin: true,
    };

    const result = UpdateUserSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("ListUsersQuerySchema", () => {
  it("should use default limit of 50", () => {
    const result = ListUsersQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("should accept isActive filter", () => {
    const result = ListUsersQuerySchema.safeParse({ isActive: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it("should accept isActive filter set to false", () => {
    const result = ListUsersQuerySchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(false);
    }
  });

  it("should accept cursor for pagination", () => {
    const result = ListUsersQuerySchema.safeParse({
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid cursor", () => {
    const result = ListUsersQuerySchema.safeParse({
      cursor: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject limit below 1", () => {
    const result = ListUsersQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative limit", () => {
    const result = ListUsersQuerySchema.safeParse({ limit: -5 });
    expect(result.success).toBe(false);
  });

  it("should reject limit above 100", () => {
    const result = ListUsersQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("should accept limit of 1 (minimum)", () => {
    const result = ListUsersQuerySchema.safeParse({ limit: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(1);
    }
  });

  it("should accept limit of 100 (maximum)", () => {
    const result = ListUsersQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });

  it("should accept limit within range", () => {
    const result = ListUsersQuerySchema.safeParse({ limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("should reject non-integer limit", () => {
    const result = ListUsersQuerySchema.safeParse({ limit: 50.5 });
    expect(result.success).toBe(false);
  });

  it("should accept all query parameters together", () => {
    const result = ListUsersQuerySchema.safeParse({
      isActive: true,
      limit: 25,
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.limit).toBe(25);
      expect(result.data.cursor).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });
});
