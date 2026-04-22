import { describe, expect, it } from "vitest";
import {
  ChangePasswordSchema,
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateProfileSchema,
  UpdateUserSchema,
  UserSchema,
} from "./schemas";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("UserSchema", () => {
  it("should validate a complete user", () => {
    const result = UserSchema.safeParse({
      id: VALID_UUID,
      email: "user@example.com",
      name: "John Doe",
      isActive: true,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it.skip("should reject invalid UUID for id", () => {
    const result = UserSchema.safeParse({
      id: "not-a-uuid",
      email: "user@example.com",
      name: "John Doe",
      isActive: true,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = UserSchema.safeParse({
      id: VALID_UUID,
      email: "invalid-email",
      name: "John Doe",
      isActive: true,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("should require all fields", () => {
    const result = UserSchema.safeParse({
      id: VALID_UUID,
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("should validate boolean fields", () => {
    const result = UserSchema.safeParse({
      id: VALID_UUID,
      email: "user@example.com",
      name: "John Doe",
      isActive: "yes",
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("should validate date fields", () => {
    const result = UserSchema.safeParse({
      id: VALID_UUID,
      email: "user@example.com",
      name: "John Doe",
      isActive: true,
      isSuperAdmin: false,
      createdAt: "not-a-date",
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("should accept user with super admin privileges", () => {
    const result = UserSchema.safeParse({
      id: VALID_UUID,
      email: "admin@example.com",
      name: "Admin User",
      isActive: true,
      isSuperAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("should accept inactive user", () => {
    const result = UserSchema.safeParse({
      id: VALID_UUID,
      email: "inactive@example.com",
      name: "Inactive User",
      isActive: false,
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });
});

// Helper: minimal valid CreateUser input
function validCreateInput(overrides: Record<string, unknown> = {}) {
  return {
    email: "newuser@example.com",
    name: "New User",
    password: "securePassword123",
    isActive: true,
    labId: VALID_UUID,
    ...overrides,
  };
}

describe("CreateUserSchema", () => {
  it("should validate a complete create input", () => {
    const result = CreateUserSchema.safeParse(validCreateInput());
    expect(result.success).toBe(true);
  });

  it("should apply defaults for isSuperAdmin, roleKey, and pilaRoleKey", () => {
    const result = CreateUserSchema.safeParse(validCreateInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isSuperAdmin).toBe(false);
      expect(result.data.roleKey).toBe("reporter");
      expect(result.data.pilaRoleKey).toBe("none");
    }
  });

  it("should require email", () => {
    const { email: _, ...input } = validCreateInput();
    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require name", () => {
    const { name: _, ...input } = validCreateInput();
    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require password", () => {
    const { password: _, ...input } = validCreateInput();
    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require labId", () => {
    const { labId: _, ...input } = validCreateInput();
    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ email: "not-valid-email" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Correo electrónico inválido",
      );
    }
  });

  it("should reject empty name", () => {
    const result = CreateUserSchema.safeParse(validCreateInput({ name: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nombre requerido");
    }
  });

  it("should reject name over 255 characters", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ name: "a".repeat(256) }),
    );
    expect(result.success).toBe(false);
  });

  it("should accept name exactly 255 characters", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ name: "a".repeat(255) }),
    );
    expect(result.success).toBe(true);
  });

  it("should reject password under 8 characters", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ password: "short" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "La contraseña debe tener al menos 8 caracteres",
      );
    }
  });

  it("should accept password exactly 8 characters", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ password: "12345678" }),
    );
    expect(result.success).toBe(true);
  });

  it("should require isActive field", () => {
    const { isActive: _, ...input } = validCreateInput();
    const result = CreateUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept various valid email formats", () => {
    const emails = [
      "test@example.com",
      "user.name@domain.org",
      "user+tag@example.co.uk",
      "firstname.lastname@company.net",
    ];
    for (const email of emails) {
      const result = CreateUserSchema.safeParse(validCreateInput({ email }));
      expect(result.success).toBe(true);
    }
  });

  it("should reject labId as null", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ labId: null }),
    );
    expect(result.success).toBe(false);
  });

  it.skip("should reject labId with invalid UUID", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ labId: "not-a-uuid" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Laboratorio requerido");
    }
  });

  it("should accept valid pilaRoleKey values", () => {
    for (const pilaRoleKey of ["lab_reporter", "pila_admin", "none"] as const) {
      const result = CreateUserSchema.safeParse(
        validCreateInput({ pilaRoleKey }),
      );
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid pilaRoleKey", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ pilaRoleKey: "invalid_role" }),
    );
    expect(result.success).toBe(false);
  });

  it("should accept valid roleKey values", () => {
    for (const roleKey of ["admin", "director", "reporter"] as const) {
      const result = CreateUserSchema.safeParse(validCreateInput({ roleKey }));
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid roleKey", () => {
    const result = CreateUserSchema.safeParse(
      validCreateInput({ roleKey: "superuser" }),
    );
    expect(result.success).toBe(false);
  });
});

describe("UpdateUserSchema", () => {
  it("should allow partial updates", () => {
    const result = UpdateUserSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("should allow empty object", () => {
    const result = UpdateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should allow updating only email", () => {
    const result = UpdateUserSchema.safeParse({
      email: "newemail@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should allow updating only password", () => {
    const result = UpdateUserSchema.safeParse({
      password: "newSecurePassword123",
    });
    expect(result.success).toBe(true);
  });

  it("should allow updating only isActive", () => {
    const result = UpdateUserSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("should allow updating only isSuperAdmin", () => {
    const result = UpdateUserSchema.safeParse({ isSuperAdmin: true });
    expect(result.success).toBe(true);
  });

  it("should allow updating multiple fields", () => {
    const result = UpdateUserSchema.safeParse({
      email: "updated@example.com",
      name: "Updated Name",
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it("should validate email format when provided", () => {
    const result = UpdateUserSchema.safeParse({ email: "invalid-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Correo electrónico inválido",
      );
    }
  });

  it("should validate name max length when provided", () => {
    const result = UpdateUserSchema.safeParse({ name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("should allow empty name in update", () => {
    const result = UpdateUserSchema.safeParse({ name: "" });
    expect(result.success).toBe(true);
  });

  it("should validate password min length when provided", () => {
    const result = UpdateUserSchema.safeParse({ password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "La contraseña debe tener al menos 8 caracteres",
      );
    }
  });

  it("should accept password exactly 8 characters when provided", () => {
    const result = UpdateUserSchema.safeParse({ password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("should allow full update of all fields", () => {
    const result = UpdateUserSchema.safeParse({
      email: "fullyupdated@example.com",
      name: "Fully Updated Name",
      password: "newSecurePassword456",
      isActive: true,
      isSuperAdmin: true,
      labId: VALID_UUID,
      roleKey: "director",
      pilaRoleKey: "pila_admin",
    });
    expect(result.success).toBe(true);
  });

  it("should allow updating labId", () => {
    const result = UpdateUserSchema.safeParse({ labId: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("should reject labId as null", () => {
    const result = UpdateUserSchema.safeParse({ labId: null });
    expect(result.success).toBe(false);
  });

  it.skip("should reject invalid labId UUID", () => {
    const result = UpdateUserSchema.safeParse({ labId: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("should allow updating roleKey", () => {
    const result = UpdateUserSchema.safeParse({ roleKey: "admin" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid roleKey in update", () => {
    const result = UpdateUserSchema.safeParse({ roleKey: "superuser" });
    expect(result.success).toBe(false);
  });

  it("should allow updating pilaRoleKey", () => {
    const result = UpdateUserSchema.safeParse({
      pilaRoleKey: "lab_reporter",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid pilaRoleKey in update", () => {
    const result = UpdateUserSchema.safeParse({
      pilaRoleKey: "super_admin",
    });
    expect(result.success).toBe(false);
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
    const result = ListUsersQuerySchema.safeParse({ cursor: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it.skip("should reject invalid cursor", () => {
    const result = ListUsersQuerySchema.safeParse({ cursor: "not-a-uuid" });
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
      cursor: VALID_UUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.limit).toBe(25);
      expect(result.data.cursor).toBe(VALID_UUID);
    }
  });
});

describe("UpdateProfileSchema", () => {
  it("should accept a valid name", () => {
    const result = UpdateProfileSchema.safeParse({ name: "Juan Pérez" });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = UpdateProfileSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nombre requerido");
    }
  });

  it("should reject name over 255 characters", () => {
    const result = UpdateProfileSchema.safeParse({ name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("should accept name exactly 255 characters", () => {
    const result = UpdateProfileSchema.safeParse({ name: "a".repeat(255) });
    expect(result.success).toBe(true);
  });

  it("should reject missing name", () => {
    const result = UpdateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("ChangePasswordSchema", () => {
  it("should accept valid current and new passwords", () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: "oldPass123",
      newPassword: "newPass456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty current password", () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newPass456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Contraseña actual requerida",
      );
    }
  });

  it("should reject new password under 8 characters", () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: "oldPass123",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "La nueva contraseña debe tener al menos 8 caracteres",
      );
    }
  });

  it("should accept new password exactly 8 characters", () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: "oldPass123",
      newPassword: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing currentPassword", () => {
    const result = ChangePasswordSchema.safeParse({
      newPassword: "newPass456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing newPassword", () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: "oldPass123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty object", () => {
    const result = ChangePasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
