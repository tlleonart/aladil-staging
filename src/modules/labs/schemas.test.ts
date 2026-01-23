import { describe, expect, it } from "vitest";
import {
  CreateLabSchema,
  LabSchema,
  ListLabsQuerySchema,
  UpdateLabSchema,
} from "./schemas";

describe("LabSchema", () => {
  it("should validate a complete lab", () => {
    const validLab = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Laboratory",
      countryCode: "US",
      city: "New York",
      websiteUrl: "https://example.com",
      isActive: true,
      sortOrder: 1,
      logoAssetId: "550e8400-e29b-41d4-a716-446655440001",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = LabSchema.safeParse(validLab);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const invalidLab = {
      id: "not-a-uuid",
      name: "Test Lab",
      countryCode: "US",
      city: null,
      websiteUrl: null,
      isActive: true,
      sortOrder: 1,
      logoAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = LabSchema.safeParse(invalidLab);
    expect(result.success).toBe(false);
  });

  it("should accept nullable fields", () => {
    const labWithNulls = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Lab",
      countryCode: "ES",
      city: null,
      websiteUrl: null,
      isActive: false,
      sortOrder: 0,
      logoAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = LabSchema.safeParse(labWithNulls);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for logoAssetId", () => {
    const lab = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Lab",
      countryCode: "US",
      city: null,
      websiteUrl: null,
      isActive: true,
      sortOrder: 1,
      logoAssetId: "invalid-uuid",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = LabSchema.safeParse(lab);
    expect(result.success).toBe(false);
  });

  it("should validate boolean isActive field", () => {
    const labActive = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Lab",
      countryCode: "US",
      city: null,
      websiteUrl: null,
      isActive: true,
      sortOrder: 1,
      logoAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const labInactive = {
      ...labActive,
      isActive: false,
    };

    expect(LabSchema.safeParse(labActive).success).toBe(true);
    expect(LabSchema.safeParse(labInactive).success).toBe(true);
  });

  it("should reject non-boolean isActive", () => {
    const lab = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Lab",
      countryCode: "US",
      city: null,
      websiteUrl: null,
      isActive: "yes",
      sortOrder: 1,
      logoAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = LabSchema.safeParse(lab);
    expect(result.success).toBe(false);
  });

  it("should validate numeric sortOrder", () => {
    const lab = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Lab",
      countryCode: "US",
      city: null,
      websiteUrl: null,
      isActive: true,
      sortOrder: 42,
      logoAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = LabSchema.safeParse(lab);
    expect(result.success).toBe(true);
  });

  it("should reject non-numeric sortOrder", () => {
    const lab = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test Lab",
      countryCode: "US",
      city: null,
      websiteUrl: null,
      isActive: true,
      sortOrder: "first",
      logoAssetId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = LabSchema.safeParse(lab);
    expect(result.success).toBe(false);
  });
});

describe("CreateLabSchema", () => {
  it("should validate minimal create input", () => {
    const input = {
      name: "New Lab",
      countryCode: "US",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate full create input", () => {
    const input = {
      name: "New Laboratory",
      countryCode: "ES",
      city: "Madrid",
      websiteUrl: "https://lab.example.com",
      isActive: true,
      sortOrder: 5,
      logoAssetId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const input = {
      countryCode: "US",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require countryCode", () => {
    const input = {
      name: "Test Lab",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require isActive", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require sortOrder", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      isActive: true,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const input = {
      name: "",
      countryCode: "US",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("should reject name over 255 characters", () => {
    const input = {
      name: "a".repeat(256),
      countryCode: "US",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept name at 255 characters", () => {
    const input = {
      name: "a".repeat(255),
      countryCode: "US",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject countryCode with less than 2 characters", () => {
    const input = {
      name: "Test Lab",
      countryCode: "U",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Country code must be 2 characters",
      );
    }
  });

  it("should reject countryCode with more than 2 characters", () => {
    const input = {
      name: "Test Lab",
      countryCode: "USA",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Country code must be 2 characters",
      );
    }
  });

  it("should accept countryCode with exactly 2 characters", () => {
    const countryCodes = ["US", "ES", "FR", "DE", "JP"];

    for (const countryCode of countryCodes) {
      const input = {
        name: "Test Lab",
        countryCode,
        isActive: true,
        sortOrder: 1,
      };

      const result = CreateLabSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it("should accept valid websiteUrl", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      websiteUrl: "https://example.com",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject invalid websiteUrl", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      websiteUrl: "not-a-url",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid URL");
    }
  });

  it("should accept empty string for websiteUrl", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      websiteUrl: "",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept optional city", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      city: "San Francisco",
      isActive: true,
      sortOrder: 1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept optional logoAssetId when valid UUID", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      isActive: true,
      sortOrder: 1,
      logoAssetId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for logoAssetId", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      isActive: true,
      sortOrder: 1,
      logoAssetId: "not-a-uuid",
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject non-integer sortOrder", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      isActive: true,
      sortOrder: 1.5,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept negative sortOrder", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      isActive: true,
      sortOrder: -1,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept zero sortOrder", () => {
    const input = {
      name: "Test Lab",
      countryCode: "US",
      isActive: true,
      sortOrder: 0,
    };

    const result = CreateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("UpdateLabSchema", () => {
  it("should allow partial updates", () => {
    const input = {
      name: "Updated Lab Name",
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow empty object", () => {
    const result = UpdateLabSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should validate name when provided", () => {
    const input = {
      name: "",
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should validate countryCode when provided", () => {
    const input = {
      countryCode: "USA",
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should allow updating only isActive", () => {
    const input = {
      isActive: false,
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only sortOrder", () => {
    const input = {
      sortOrder: 10,
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate sortOrder must be integer when provided", () => {
    const input = {
      sortOrder: 1.5,
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should validate websiteUrl when provided", () => {
    const input = {
      websiteUrl: "invalid-url",
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should allow valid websiteUrl update", () => {
    const input = {
      websiteUrl: "https://newsite.com",
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating multiple fields", () => {
    const input = {
      name: "Updated Lab",
      city: "London",
      isActive: false,
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate logoAssetId when provided", () => {
    const input = {
      logoAssetId: "not-a-uuid",
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should allow valid logoAssetId update", () => {
    const input = {
      logoAssetId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = UpdateLabSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("ListLabsQuerySchema", () => {
  it("should use default limit", () => {
    const result = ListLabsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("should accept isActive filter", () => {
    const result = ListLabsQuerySchema.safeParse({ isActive: true });
    expect(result.success).toBe(true);
  });

  it("should accept isActive false filter", () => {
    const result = ListLabsQuerySchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("should accept countryCode filter", () => {
    const result = ListLabsQuerySchema.safeParse({ countryCode: "US" });
    expect(result.success).toBe(true);
  });

  it("should accept cursor for pagination", () => {
    const result = ListLabsQuerySchema.safeParse({
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid cursor", () => {
    const result = ListLabsQuerySchema.safeParse({
      cursor: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject limit below 1", () => {
    const result = ListLabsQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject limit above 100", () => {
    const result = ListLabsQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("should accept limit within range", () => {
    const result = ListLabsQuerySchema.safeParse({ limit: 50 });
    expect(result.success).toBe(true);
  });

  it("should accept limit at minimum boundary", () => {
    const result = ListLabsQuerySchema.safeParse({ limit: 1 });
    expect(result.success).toBe(true);
  });

  it("should accept limit at maximum boundary", () => {
    const result = ListLabsQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(true);
  });

  it("should accept multiple filters", () => {
    const result = ListLabsQuerySchema.safeParse({
      isActive: true,
      countryCode: "ES",
      limit: 25,
    });
    expect(result.success).toBe(true);
  });

  it("should accept all query parameters", () => {
    const result = ListLabsQuerySchema.safeParse({
      isActive: true,
      countryCode: "US",
      limit: 10,
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-integer limit", () => {
    const result = ListLabsQuerySchema.safeParse({ limit: 10.5 });
    expect(result.success).toBe(false);
  });
});
