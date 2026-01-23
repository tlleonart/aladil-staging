import { describe, expect, it } from "vitest";
import {
  CreateExecutiveMemberSchema,
  ExecutiveMemberSchema,
  ListExecutiveQuerySchema,
  UpdateExecutiveMemberSchema,
} from "./schemas";

describe("ExecutiveMemberSchema", () => {
  it("should validate a complete executive member", () => {
    const validMember = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: "550e8400-e29b-41d4-a716-446655440001",
      photoAssetId: "550e8400-e29b-41d4-a716-446655440002",
      flagAssetId: "550e8400-e29b-41d4-a716-446655440003",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(validMember);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const invalidMember = {
      id: "not-a-uuid",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: null,
      photoAssetId: null,
      flagAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
  });

  it("should accept nullable fields", () => {
    const memberWithNulls = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: null,
      photoAssetId: null,
      flagAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(memberWithNulls);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for labId", () => {
    const invalidMember = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: "invalid-uuid",
      photoAssetId: null,
      flagAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for photoAssetId", () => {
    const invalidMember = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: null,
      photoAssetId: "invalid-uuid",
      flagAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for flagAssetId", () => {
    const invalidMember = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: null,
      photoAssetId: null,
      flagAssetId: "invalid-uuid",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
  });

  it("should validate boolean isActive field", () => {
    const memberActive = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: null,
      photoAssetId: null,
      flagAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const memberInactive = {
      ...memberActive,
      isActive: false,
    };

    expect(ExecutiveMemberSchema.safeParse(memberActive).success).toBe(true);
    expect(ExecutiveMemberSchema.safeParse(memberInactive).success).toBe(true);
  });

  it("should reject non-boolean isActive", () => {
    const invalidMember = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: "yes",
      labId: null,
      photoAssetId: null,
      flagAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
  });

  it("should validate numeric sortOrder", () => {
    const member = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 100,
      isActive: true,
      labId: null,
      photoAssetId: null,
      flagAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(member);
    expect(result.success).toBe(true);
  });

  it("should reject non-numeric sortOrder", () => {
    const invalidMember = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: "first",
      isActive: true,
      labId: null,
      photoAssetId: null,
      flagAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = ExecutiveMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
  });
});

describe("CreateExecutiveMemberSchema", () => {
  it("should validate full create input", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: "550e8400-e29b-41d4-a716-446655440000",
      photoAssetId: "550e8400-e29b-41d4-a716-446655440001",
      flagAssetId: "550e8400-e29b-41d4-a716-446655440002",
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate minimal create input (required fields only)", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should require fullName", () => {
    const input = {
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require position", () => {
    const input = {
      fullName: "John Doe",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require countryCode", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require sortOrder", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require isActive", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject empty fullName", () => {
    const input = {
      fullName: "",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Full name is required");
    }
  });

  it("should reject fullName over 255 characters", () => {
    const input = {
      fullName: "a".repeat(256),
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept fullName at 255 characters", () => {
    const input = {
      fullName: "a".repeat(255),
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty position", () => {
    const input = {
      fullName: "John Doe",
      position: "",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Position is required");
    }
  });

  it("should reject position over 255 characters", () => {
    const input = {
      fullName: "John Doe",
      position: "a".repeat(256),
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept position at 255 characters", () => {
    const input = {
      fullName: "John Doe",
      position: "a".repeat(255),
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject countryCode with less than 2 characters", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "U",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Country code must be 2 characters",
      );
    }
  });

  it("should reject countryCode with more than 2 characters", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "USA",
      sortOrder: 1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Country code must be 2 characters",
      );
    }
  });

  it("should accept valid 2-character countryCode", () => {
    const countryCodes = ["US", "MX", "AR", "BR", "ES"];

    for (const countryCode of countryCodes) {
      const input = {
        fullName: "John Doe",
        position: "President",
        countryCode,
        sortOrder: 1,
        isActive: true,
      };

      const result = CreateExecutiveMemberSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it("should require sortOrder to be an integer", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1.5,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept negative sortOrder", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: -1,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept zero sortOrder", () => {
    const input = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 0,
      isActive: true,
    };

    const result = CreateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate optional labId as UUID", () => {
    const validInput = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      labId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const invalidInput = {
      ...validInput,
      labId: "not-a-uuid",
    };

    expect(CreateExecutiveMemberSchema.safeParse(validInput).success).toBe(
      true,
    );
    expect(CreateExecutiveMemberSchema.safeParse(invalidInput).success).toBe(
      false,
    );
  });

  it("should validate optional photoAssetId as UUID", () => {
    const validInput = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      photoAssetId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const invalidInput = {
      ...validInput,
      photoAssetId: "not-a-uuid",
    };

    expect(CreateExecutiveMemberSchema.safeParse(validInput).success).toBe(
      true,
    );
    expect(CreateExecutiveMemberSchema.safeParse(invalidInput).success).toBe(
      false,
    );
  });

  it("should validate optional flagAssetId as UUID", () => {
    const validInput = {
      fullName: "John Doe",
      position: "President",
      countryCode: "US",
      sortOrder: 1,
      isActive: true,
      flagAssetId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const invalidInput = {
      ...validInput,
      flagAssetId: "not-a-uuid",
    };

    expect(CreateExecutiveMemberSchema.safeParse(validInput).success).toBe(
      true,
    );
    expect(CreateExecutiveMemberSchema.safeParse(invalidInput).success).toBe(
      false,
    );
  });
});

describe("UpdateExecutiveMemberSchema", () => {
  it("should allow partial updates with single field", () => {
    const input = {
      fullName: "Updated Name",
    };

    const result = UpdateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow empty object", () => {
    const result = UpdateExecutiveMemberSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should allow updating only position", () => {
    const input = {
      position: "Vice President",
    };

    const result = UpdateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only countryCode", () => {
    const input = {
      countryCode: "MX",
    };

    const result = UpdateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only sortOrder", () => {
    const input = {
      sortOrder: 5,
    };

    const result = UpdateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only isActive", () => {
    const input = {
      isActive: false,
    };

    const result = UpdateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating multiple fields", () => {
    const input = {
      fullName: "Updated Name",
      position: "New Position",
      isActive: false,
    };

    const result = UpdateExecutiveMemberSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate fullName when provided", () => {
    const emptyName = { fullName: "" };
    const longName = { fullName: "a".repeat(256) };

    expect(UpdateExecutiveMemberSchema.safeParse(emptyName).success).toBe(
      false,
    );
    expect(UpdateExecutiveMemberSchema.safeParse(longName).success).toBe(false);
  });

  it("should validate position when provided", () => {
    const emptyPosition = { position: "" };
    const longPosition = { position: "a".repeat(256) };

    expect(UpdateExecutiveMemberSchema.safeParse(emptyPosition).success).toBe(
      false,
    );
    expect(UpdateExecutiveMemberSchema.safeParse(longPosition).success).toBe(
      false,
    );
  });

  it("should validate countryCode when provided", () => {
    const shortCode = { countryCode: "U" };
    const longCode = { countryCode: "USA" };

    expect(UpdateExecutiveMemberSchema.safeParse(shortCode).success).toBe(
      false,
    );
    expect(UpdateExecutiveMemberSchema.safeParse(longCode).success).toBe(false);
  });

  it("should validate sortOrder as integer when provided", () => {
    const floatOrder = { sortOrder: 1.5 };

    expect(UpdateExecutiveMemberSchema.safeParse(floatOrder).success).toBe(
      false,
    );
  });

  it("should validate labId as UUID when provided", () => {
    const invalidLabId = { labId: "not-a-uuid" };
    const validLabId = { labId: "550e8400-e29b-41d4-a716-446655440000" };

    expect(UpdateExecutiveMemberSchema.safeParse(invalidLabId).success).toBe(
      false,
    );
    expect(UpdateExecutiveMemberSchema.safeParse(validLabId).success).toBe(
      true,
    );
  });

  it("should validate photoAssetId as UUID when provided", () => {
    const invalidId = { photoAssetId: "not-a-uuid" };
    const validId = { photoAssetId: "550e8400-e29b-41d4-a716-446655440000" };

    expect(UpdateExecutiveMemberSchema.safeParse(invalidId).success).toBe(
      false,
    );
    expect(UpdateExecutiveMemberSchema.safeParse(validId).success).toBe(true);
  });

  it("should validate flagAssetId as UUID when provided", () => {
    const invalidId = { flagAssetId: "not-a-uuid" };
    const validId = { flagAssetId: "550e8400-e29b-41d4-a716-446655440000" };

    expect(UpdateExecutiveMemberSchema.safeParse(invalidId).success).toBe(
      false,
    );
    expect(UpdateExecutiveMemberSchema.safeParse(validId).success).toBe(true);
  });
});

describe("ListExecutiveQuerySchema", () => {
  it("should use default limit of 50", () => {
    const result = ListExecutiveQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("should accept isActive filter", () => {
    const activeFilter = { isActive: true };
    const inactiveFilter = { isActive: false };

    const activeResult = ListExecutiveQuerySchema.safeParse(activeFilter);
    const inactiveResult = ListExecutiveQuerySchema.safeParse(inactiveFilter);

    expect(activeResult.success).toBe(true);
    expect(inactiveResult.success).toBe(true);
    if (activeResult.success) {
      expect(activeResult.data.isActive).toBe(true);
    }
    if (inactiveResult.success) {
      expect(inactiveResult.data.isActive).toBe(false);
    }
  });

  it("should accept countryCode filter", () => {
    const result = ListExecutiveQuerySchema.safeParse({ countryCode: "US" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBe("US");
    }
  });

  it("should accept cursor for pagination", () => {
    const result = ListExecutiveQuerySchema.safeParse({
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("should reject invalid cursor UUID", () => {
    const result = ListExecutiveQuerySchema.safeParse({
      cursor: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject limit below 1", () => {
    const result = ListExecutiveQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative limit", () => {
    const result = ListExecutiveQuerySchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
  });

  it("should reject limit above 100", () => {
    const result = ListExecutiveQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("should accept limit at minimum (1)", () => {
    const result = ListExecutiveQuerySchema.safeParse({ limit: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(1);
    }
  });

  it("should accept limit at maximum (100)", () => {
    const result = ListExecutiveQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });

  it("should accept custom limit within range", () => {
    const result = ListExecutiveQuerySchema.safeParse({ limit: 25 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it("should reject non-integer limit", () => {
    const result = ListExecutiveQuerySchema.safeParse({ limit: 10.5 });
    expect(result.success).toBe(false);
  });

  it("should accept multiple query parameters", () => {
    const result = ListExecutiveQuerySchema.safeParse({
      isActive: true,
      countryCode: "MX",
      limit: 30,
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.countryCode).toBe("MX");
      expect(result.data.limit).toBe(30);
      expect(result.data.cursor).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("should allow any string for countryCode filter", () => {
    // Note: The schema doesn't enforce 2-character country codes in the query
    // This might be intentional for flexibility in filtering
    const result = ListExecutiveQuerySchema.safeParse({
      countryCode: "United States",
    });
    expect(result.success).toBe(true);
  });
});
