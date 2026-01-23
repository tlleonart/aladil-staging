import { describe, expect, it } from "vitest";
import {
  CreateMeetingSchema,
  ListMeetingsQuerySchema,
  MeetingSchema,
  UpdateMeetingSchema,
} from "./schemas";

describe("MeetingSchema", () => {
  it("should validate a complete meeting", () => {
    const validMeeting = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 42,
      title: "42nd Annual Meeting",
      slug: "42nd-annual-meeting",
      city: "Paris",
      country: "France",
      countryCode: "FR",
      startDate: new Date("2024-06-15"),
      endDate: new Date("2024-06-18"),
      hostName: "Institut Pasteur",
      hostLabId: "550e8400-e29b-41d4-a716-446655440001",
      summary: "Annual gathering of researchers",
      content: { blocks: [] },
      status: "PUBLISHED" as const,
      coverAssetId: "550e8400-e29b-41d4-a716-446655440002",
      topicsPdfAssetId: "550e8400-e29b-41d4-a716-446655440003",
      authorId: "550e8400-e29b-41d4-a716-446655440004",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(validMeeting);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const invalidMeeting = {
      id: "not-a-uuid",
      number: 1,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: new Date(),
      endDate: null,
      hostName: null,
      hostLabId: null,
      summary: null,
      content: null,
      status: "DRAFT",
      coverAssetId: null,
      topicsPdfAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(invalidMeeting);
    expect(result.success).toBe(false);
  });

  it("should accept nullable fields", () => {
    const meetingWithNulls = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 1,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "Berlin",
      country: "Germany",
      countryCode: "DE",
      startDate: new Date(),
      endDate: null,
      hostName: null,
      hostLabId: null,
      summary: null,
      content: null,
      status: "DRAFT" as const,
      coverAssetId: null,
      topicsPdfAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(meetingWithNulls);
    expect(result.success).toBe(true);
  });

  it("should validate all status values", () => {
    const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

    for (const status of statuses) {
      const meeting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        number: 1,
        title: "Test Meeting",
        slug: "test-meeting",
        city: "Tokyo",
        country: "Japan",
        countryCode: "JP",
        startDate: new Date(),
        endDate: null,
        hostName: null,
        hostLabId: null,
        summary: null,
        content: null,
        status,
        coverAssetId: null,
        topicsPdfAssetId: null,
        authorId: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = MeetingSchema.safeParse(meeting);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid status", () => {
    const meeting = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 1,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "Sydney",
      country: "Australia",
      countryCode: "AU",
      startDate: new Date(),
      endDate: null,
      hostName: null,
      hostLabId: null,
      summary: null,
      content: null,
      status: "INVALID_STATUS",
      coverAssetId: null,
      topicsPdfAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(meeting);
    expect(result.success).toBe(false);
  });

  it("should require number to be an integer", () => {
    const meeting = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 1.5,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "Madrid",
      country: "Spain",
      countryCode: "ES",
      startDate: new Date(),
      endDate: null,
      hostName: null,
      hostLabId: null,
      summary: null,
      content: null,
      status: "DRAFT",
      coverAssetId: null,
      topicsPdfAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(meeting);
    expect(result.success).toBe(false);
  });

  it("should validate date fields", () => {
    const meeting = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 1,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "Rome",
      country: "Italy",
      countryCode: "IT",
      startDate: "not-a-date",
      endDate: null,
      hostName: null,
      hostLabId: null,
      summary: null,
      content: null,
      status: "DRAFT",
      coverAssetId: null,
      topicsPdfAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(meeting);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for hostLabId", () => {
    const meeting = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 1,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "Vienna",
      country: "Austria",
      countryCode: "AT",
      startDate: new Date(),
      endDate: null,
      hostName: "Test Host",
      hostLabId: "invalid-uuid",
      summary: null,
      content: null,
      status: "DRAFT",
      coverAssetId: null,
      topicsPdfAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(meeting);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for coverAssetId", () => {
    const meeting = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 1,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "Amsterdam",
      country: "Netherlands",
      countryCode: "NL",
      startDate: new Date(),
      endDate: null,
      hostName: null,
      hostLabId: null,
      summary: null,
      content: null,
      status: "DRAFT",
      coverAssetId: "not-a-valid-uuid",
      topicsPdfAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(meeting);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for topicsPdfAssetId", () => {
    const meeting = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 1,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "Brussels",
      country: "Belgium",
      countryCode: "BE",
      startDate: new Date(),
      endDate: null,
      hostName: null,
      hostLabId: null,
      summary: null,
      content: null,
      status: "DRAFT",
      coverAssetId: null,
      topicsPdfAssetId: "bad-uuid",
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(meeting);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for authorId", () => {
    const meeting = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      number: 1,
      title: "Test Meeting",
      slug: "test-meeting",
      city: "Lisbon",
      country: "Portugal",
      countryCode: "PT",
      startDate: new Date(),
      endDate: null,
      hostName: null,
      hostLabId: null,
      summary: null,
      content: null,
      status: "DRAFT",
      coverAssetId: null,
      topicsPdfAssetId: null,
      authorId: "invalid",
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = MeetingSchema.safeParse(meeting);
    expect(result.success).toBe(false);
  });
});

describe("CreateMeetingSchema", () => {
  it("should validate minimal create input", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT" as const,
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate full create input", () => {
    const input = {
      number: 42,
      title: "42nd Annual Meeting",
      slug: "42nd-annual-meeting",
      city: "Paris",
      country: "France",
      countryCode: "FR",
      startDate: "2024-06-15",
      endDate: "2024-06-18",
      hostName: "Institut Pasteur",
      hostLabId: "550e8400-e29b-41d4-a716-446655440000",
      summary: "Annual gathering of researchers",
      content: { blocks: [] },
      status: "PUBLISHED" as const,
      coverAssetId: "550e8400-e29b-41d4-a716-446655440001",
      topicsPdfAssetId: "550e8400-e29b-41d4-a716-446655440002",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should require number", () => {
    const input = {
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require title", () => {
    const input = {
      number: 1,
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require city", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require country", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require countryCode", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require startDate", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require status", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const input = {
      number: 1,
      title: "",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject title over 255 characters", () => {
    const input = {
      number: 1,
      title: "a".repeat(256),
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept title with exactly 255 characters", () => {
    const input = {
      number: 1,
      title: "a".repeat(255),
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty city", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject empty country", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject countryCode with wrong length", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GBR",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject countryCode with single character", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "G",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept valid two-character countryCode", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty startDate", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject number less than 1", () => {
    const input = {
      number: 0,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject negative number", () => {
    const input = {
      number: -5,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject non-integer number", () => {
    const input = {
      number: 1.5,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for hostLabId", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
      hostLabId: "not-a-uuid",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for coverAssetId", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
      coverAssetId: "invalid",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for topicsPdfAssetId", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
      topicsPdfAssetId: "bad-id",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept valid UUIDs for optional fields", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
      hostLabId: "550e8400-e29b-41d4-a716-446655440000",
      coverAssetId: "550e8400-e29b-41d4-a716-446655440001",
      topicsPdfAssetId: "550e8400-e29b-41d4-a716-446655440002",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept optional endDate", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      endDate: "2024-06-18",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept optional hostName", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      hostName: "University of London",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept optional summary", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      summary: "A brief summary of the meeting",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept optional content", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      content: { blocks: [{ type: "paragraph", text: "Meeting details" }] },
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept optional slug", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      slug: "new-meeting",
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject slug over 255 characters", () => {
    const input = {
      number: 1,
      title: "New Meeting",
      slug: "a".repeat(256),
      city: "London",
      country: "United Kingdom",
      countryCode: "GB",
      startDate: "2024-06-15",
      status: "DRAFT",
    };

    const result = CreateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("UpdateMeetingSchema", () => {
  it("should allow partial updates", () => {
    const input = {
      title: "Updated Title",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow empty object", () => {
    const result = UpdateMeetingSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should allow updating only number", () => {
    const input = {
      number: 43,
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only city", () => {
    const input = {
      city: "New York",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only country", () => {
    const input = {
      country: "United States",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only countryCode", () => {
    const input = {
      countryCode: "US",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only status", () => {
    const input = {
      status: "PUBLISHED" as const,
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only startDate", () => {
    const input = {
      startDate: "2024-07-01",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow updating only endDate", () => {
    const input = {
      endDate: "2024-07-05",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate fields when provided", () => {
    const input = {
      title: "", // Empty title should fail
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid countryCode when provided", () => {
    const input = {
      countryCode: "USA",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid number when provided", () => {
    const input = {
      number: 0,
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for hostLabId when provided", () => {
    const input = {
      hostLabId: "not-valid",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for coverAssetId when provided", () => {
    const input = {
      coverAssetId: "bad-uuid",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for topicsPdfAssetId when provided", () => {
    const input = {
      topicsPdfAssetId: "invalid-uuid",
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should allow multiple fields update", () => {
    const input = {
      title: "Updated Meeting",
      city: "Barcelona",
      country: "Spain",
      countryCode: "ES",
      status: "PUBLISHED" as const,
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject title over 255 characters when provided", () => {
    const input = {
      title: "a".repeat(256),
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject slug over 255 characters when provided", () => {
    const input = {
      slug: "a".repeat(256),
    };

    const result = UpdateMeetingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("ListMeetingsQuerySchema", () => {
  it("should use default limit", () => {
    const result = ListMeetingsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("should accept status filter", () => {
    const result = ListMeetingsQuerySchema.safeParse({ status: "PUBLISHED" });
    expect(result.success).toBe(true);
  });

  it("should accept DRAFT status filter", () => {
    const result = ListMeetingsQuerySchema.safeParse({ status: "DRAFT" });
    expect(result.success).toBe(true);
  });

  it("should accept ARCHIVED status filter", () => {
    const result = ListMeetingsQuerySchema.safeParse({ status: "ARCHIVED" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid status filter", () => {
    const result = ListMeetingsQuerySchema.safeParse({ status: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("should accept cursor for pagination", () => {
    const result = ListMeetingsQuerySchema.safeParse({
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid cursor", () => {
    const result = ListMeetingsQuerySchema.safeParse({
      cursor: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject limit below 1", () => {
    const result = ListMeetingsQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative limit", () => {
    const result = ListMeetingsQuerySchema.safeParse({ limit: -5 });
    expect(result.success).toBe(false);
  });

  it("should reject limit above 100", () => {
    const result = ListMeetingsQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("should accept limit within range", () => {
    const result = ListMeetingsQuerySchema.safeParse({ limit: 50 });
    expect(result.success).toBe(true);
  });

  it("should accept minimum limit of 1", () => {
    const result = ListMeetingsQuerySchema.safeParse({ limit: 1 });
    expect(result.success).toBe(true);
  });

  it("should accept maximum limit of 100", () => {
    const result = ListMeetingsQuerySchema.safeParse({ limit: 100 });
    expect(result.success).toBe(true);
  });

  it("should reject non-integer limit", () => {
    const result = ListMeetingsQuerySchema.safeParse({ limit: 10.5 });
    expect(result.success).toBe(false);
  });

  it("should accept combination of all valid parameters", () => {
    const result = ListMeetingsQuerySchema.safeParse({
      status: "PUBLISHED",
      limit: 25,
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("PUBLISHED");
      expect(result.data.limit).toBe(25);
      expect(result.data.cursor).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("should accept only status and cursor without limit", () => {
    const result = ListMeetingsQuerySchema.safeParse({
      status: "DRAFT",
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20); // Default limit
    }
  });
});
