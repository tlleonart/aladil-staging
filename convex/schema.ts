import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ─── Enums ──────────────────────────────────────────────────────────
const contentStatus = v.union(
  v.literal("DRAFT"),
  v.literal("PUBLISHED"),
  v.literal("ARCHIVED"),
);

const assetType = v.union(
  v.literal("IMAGE"),
  v.literal("PDF"),
  v.literal("OTHER"),
);

const projectKey = v.union(
  v.literal("INTRANET"),
  v.literal("NEWS"),
  v.literal("MEETINGS"),
  v.literal("LABS"),
  v.literal("EXEC_COMMITTEE"),
  v.literal("SETTINGS"),
  v.literal("PILA"),
);

const pilaReportStatus = v.union(
  v.literal("DRAFT"),
  v.literal("SUBMITTED"),
  v.literal("REVIEWED"),
);

// ─── Schema ─────────────────────────────────────────────────────────
export default defineSchema({
  // Spread auth tables (sessions, accounts, authVerifiers, authVerificationCodes, authRateLimits)
  // but override `users` with custom fields.
  ...authTables,

  users: defineTable({
    // Fields managed by @convex-dev/auth
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // Custom (ported from Prisma User)
    isActive: v.boolean(),
    isSuperAdmin: v.boolean(),
    labId: v.optional(v.id("labs")),

    // Migration bridge — UUID from Prisma
    legacyId: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_labId", ["labId"])
    .index("by_active", ["isActive"])
    .index("by_superAdmin", ["isSuperAdmin"])
    .index("by_legacyId", ["legacyId"]),

  // ── RBAC ──────────────────────────────────────────────────────────
  projects: defineTable({
    key: projectKey,
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_active", ["isActive"])
    .index("by_legacyId", ["legacyId"]),

  roles: defineTable({
    projectId: v.id("projects"),
    key: v.string(), // e.g. "admin", "editor", "reader"
    name: v.string(),
    description: v.optional(v.string()),
    isSystem: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_projectId", ["projectId"])
    .index("by_project_key", ["projectId", "key"])
    .index("by_legacyId", ["legacyId"]),

  permissions: defineTable({
    key: v.string(), // e.g. "news.create", "pila.manage"
    description: v.optional(v.string()),
    legacyId: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_legacyId", ["legacyId"]),

  rolePermissions: defineTable({
    roleId: v.id("roles"),
    permissionId: v.id("permissions"),
    legacyId: v.optional(v.string()),
  })
    .index("by_roleId", ["roleId"])
    .index("by_permissionId", ["permissionId"])
    .index("by_role_permission", ["roleId", "permissionId"])
    .index("by_legacyId", ["legacyId"]),

  userProjectRoles: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    roleId: v.id("roles"),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_projectId", ["projectId"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_project_active", ["projectId", "isActive"])
    .index("by_roleId", ["roleId"])
    .index("by_legacyId", ["legacyId"]),

  // ── Business ──────────────────────────────────────────────────────
  labs: defineTable({
    name: v.string(),
    countryCode: v.string(),
    city: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
    logoAssetId: v.optional(v.id("assets")),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_countryCode", ["countryCode"])
    .index("by_active_sortOrder", ["isActive", "sortOrder"])
    .index("by_legacyId", ["legacyId"]),

  executiveMembers: defineTable({
    fullName: v.string(),
    position: v.string(),
    countryCode: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
    labId: v.optional(v.id("labs")),
    photoAssetId: v.optional(v.id("assets")),
    flagAssetId: v.optional(v.id("assets")),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_countryCode", ["countryCode"])
    .index("by_active_sortOrder", ["isActive", "sortOrder"])
    .index("by_labId", ["labId"])
    .index("by_legacyId", ["legacyId"]),

  meetings: defineTable({
    number: v.number(),
    title: v.string(),
    slug: v.string(),
    city: v.string(),
    country: v.string(),
    countryCode: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    hostName: v.optional(v.string()),
    hostLabId: v.optional(v.id("labs")),
    summary: v.optional(v.string()),
    content: v.optional(v.any()), // JSON rich text
    status: contentStatus,
    coverAssetId: v.optional(v.id("assets")),
    topicsPdfAssetId: v.optional(v.id("assets")),
    authorId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    legacyId: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_status_publishedAt", ["status", "publishedAt"])
    .index("by_countryCode_startDate", ["countryCode", "startDate"])
    .index("by_number", ["number"])
    .index("by_hostLabId", ["hostLabId"])
    .index("by_authorId", ["authorId"])
    .index("by_legacyId", ["legacyId"]),

  meetingAssets: defineTable({
    meetingId: v.id("meetings"),
    assetId: v.id("assets"),
    sortOrder: v.number(),
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_meetingId", ["meetingId"])
    .index("by_meeting_sort", ["meetingId", "sortOrder"])
    .index("by_meeting_asset", ["meetingId", "assetId"])
    .index("by_legacyId", ["legacyId"]),

  newsPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.optional(v.any()),
    status: contentStatus,
    coverAssetId: v.optional(v.id("assets")),
    authorName: v.optional(v.string()),
    authorId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    legacyId: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_status_publishedAt", ["status", "publishedAt"])
    .index("by_authorId", ["authorId"])
    .index("by_legacyId", ["legacyId"]),

  newsAssets: defineTable({
    newsPostId: v.id("newsPosts"),
    assetId: v.id("assets"),
    sortOrder: v.number(),
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_newsPostId", ["newsPostId"])
    .index("by_news_sort", ["newsPostId", "sortOrder"])
    .index("by_news_asset", ["newsPostId", "assetId"])
    .index("by_legacyId", ["legacyId"]),

  assets: defineTable({
    type: assetType,
    filename: v.string(),
    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    uploadedById: v.optional(v.id("users")),
    createdAt: v.number(),

    // Convex file storage
    storageId: v.optional(v.id("_storage")),

    // Legacy (during migration — remove after)
    legacyBucket: v.optional(v.string()),
    legacyPath: v.optional(v.string()),
    legacyId: v.optional(v.string()),
  })
    .index("by_type", ["type"])
    .index("by_uploadedById", ["uploadedById"])
    .index("by_storageId", ["storageId"])
    .index("by_legacy_bucket_path", ["legacyBucket", "legacyPath"])
    .index("by_legacyId", ["legacyId"]),

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    status: v.string(), // NEW | READ | ARCHIVED
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_legacyId", ["legacyId"]),

  // ── PILA ──────────────────────────────────────────────────────────
  pilaIndicators: defineTable({
    code: v.string(), // "I-1", "I-3"
    name: v.string(),
    formula: v.string(),
    numeratorLabel: v.string(),
    denominatorLabel: v.string(),
    considerations: v.optional(v.string()),
    exclusions: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_code", ["code"])
    .index("by_active_sortOrder", ["isActive", "sortOrder"])
    .index("by_legacyId", ["legacyId"]),

  pilaReports: defineTable({
    labId: v.id("labs"),
    submittedById: v.optional(v.id("users")),
    reviewedById: v.optional(v.id("users")),
    year: v.number(),
    month: v.number(), // 1-12
    status: pilaReportStatus,
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    submittedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    legacyId: v.optional(v.string()),
  })
    .index("by_lab_year_month", ["labId", "year", "month"])
    .index("by_labId_year", ["labId", "year"])
    .index("by_status", ["status"])
    .index("by_year_month", ["year", "month"])
    .index("by_legacyId", ["legacyId"]),

  pilaReportValues: defineTable({
    reportId: v.id("pilaReports"),
    indicatorId: v.id("pilaIndicators"),
    numerator: v.optional(v.number()),
    denominator: v.optional(v.number()),
    doesNotReport: v.boolean(),
    legacyId: v.optional(v.string()),
  })
    .index("by_reportId", ["reportId"])
    .index("by_indicatorId", ["indicatorId"])
    .index("by_report_indicator", ["reportId", "indicatorId"])
    .index("by_legacyId", ["legacyId"]),

  pilaPublishedReports: defineTable({
    year: v.number(),
    month: v.number(),
    storagePath: v.string(), // legacy supabase path — will migrate to storageId
    storageId: v.optional(v.id("_storage")),
    filename: v.string(),
    sizeBytes: v.optional(v.number()),
    publishedById: v.id("users"),
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_year_month", ["year", "month"])
    .index("by_storageId", ["storageId"])
    .index("by_legacyId", ["legacyId"]),

  // ── Audit ─────────────────────────────────────────────────────────
  auditEvents: defineTable({
    userId: v.optional(v.id("users")),
    action: v.string(), // "NEWS_CREATE", etc.
    entity: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_action", ["action"])
    .index("by_legacyId", ["legacyId"]),
});
