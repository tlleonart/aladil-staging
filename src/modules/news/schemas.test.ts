import { describe, expect, it } from "vitest";
import {
  CreateNewsPostSchema,
  ListNewsQuerySchema,
  NewsPostSchema,
  UpdateNewsPostSchema,
} from "./schemas";

describe("NewsPostSchema", () => {
  it("should validate a complete news post", () => {
    const validPost = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Test News Post",
      slug: "test-news-post",
      excerpt: "This is a test excerpt",
      content: { blocks: [] },
      status: "DRAFT" as const,
      coverAssetId: "550e8400-e29b-41d4-a716-446655440001",
      authorId: "550e8400-e29b-41d4-a716-446655440002",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = NewsPostSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const invalidPost = {
      id: "not-a-uuid",
      title: "Test",
      slug: "test",
      excerpt: null,
      content: null,
      status: "DRAFT",
      coverAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = NewsPostSchema.safeParse(invalidPost);
    expect(result.success).toBe(false);
  });

  it("should accept nullable fields", () => {
    const postWithNulls = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Test",
      slug: "test",
      excerpt: null,
      content: null,
      status: "PUBLISHED" as const,
      coverAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = NewsPostSchema.safeParse(postWithNulls);
    expect(result.success).toBe(true);
  });

  it("should validate all status values", () => {
    const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

    for (const status of statuses) {
      const post = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        slug: "test",
        excerpt: null,
        content: null,
        status,
        coverAssetId: null,
        authorId: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = NewsPostSchema.safeParse(post);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid status", () => {
    const post = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Test",
      slug: "test",
      excerpt: null,
      content: null,
      status: "INVALID_STATUS",
      coverAssetId: null,
      authorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = NewsPostSchema.safeParse(post);
    expect(result.success).toBe(false);
  });
});

describe("CreateNewsPostSchema", () => {
  it("should validate minimal create input", () => {
    const input = {
      title: "New Post",
      status: "DRAFT" as const,
    };

    const result = CreateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate full create input", () => {
    const input = {
      title: "New Post",
      slug: "new-post",
      excerpt: "Short description",
      content: { blocks: [{ type: "paragraph", text: "Hello" }] },
      status: "DRAFT" as const,
      coverAssetId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = CreateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should require title", () => {
    const input = {
      status: "DRAFT",
    };

    const result = CreateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should require status", () => {
    const input = {
      title: "New Post",
    };

    const result = CreateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const input = {
      title: "",
      status: "DRAFT",
    };

    const result = CreateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject title over 255 characters", () => {
    const input = {
      title: "a".repeat(256),
      status: "DRAFT",
    };

    const result = CreateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject excerpt over 500 characters", () => {
    const input = {
      title: "Test",
      status: "DRAFT",
      excerpt: "a".repeat(501),
    };

    const result = CreateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("UpdateNewsPostSchema", () => {
  it("should allow partial updates", () => {
    const input = {
      title: "Updated Title",
    };

    const result = UpdateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow empty object", () => {
    const result = UpdateNewsPostSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should validate fields when provided", () => {
    const input = {
      title: "", // Empty title should fail
    };

    const result = UpdateNewsPostSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("ListNewsQuerySchema", () => {
  it("should use default limit", () => {
    const result = ListNewsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("should accept status filter", () => {
    const result = ListNewsQuerySchema.safeParse({ status: "PUBLISHED" });
    expect(result.success).toBe(true);
  });

  it("should accept cursor for pagination", () => {
    const result = ListNewsQuerySchema.safeParse({
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid cursor", () => {
    const result = ListNewsQuerySchema.safeParse({
      cursor: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject limit below 1", () => {
    const result = ListNewsQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject limit above 100", () => {
    const result = ListNewsQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("should accept limit within range", () => {
    const result = ListNewsQuerySchema.safeParse({ limit: 50 });
    expect(result.success).toBe(true);
  });
});
