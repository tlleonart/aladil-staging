import * as z from "zod";
import { hasPermission } from "@/modules/core/auth/rbac";
import { prisma } from "@/modules/core/db";
import {
  ORPCError,
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateMeetingSchema,
  ListMeetingsQuerySchema,
  UpdateMeetingSchema,
} from "../schemas";

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Permission check middleware
const withPermission = (permission: string) =>
  protectedProcedure.use(async ({ context, next }) => {
    const allowed = await hasPermission(
      context.user.id,
      "MEETINGS",
      permission,
    );
    if (!allowed) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permission denied: ${permission}`,
      });
    }
    return next({ context });
  });

// List meetings
export const list = withPermission("meetings.read")
  .input(ListMeetingsQuerySchema)
  .handler(async ({ input }) => {
    const { status, limit, cursor } = input;

    const meetings = await prisma.meeting.findMany({
      where: {
        ...(status && { status }),
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: { startDate: "desc" },
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        coverAsset: true,
        hostLab: { select: { id: true, name: true } },
      },
    });

    return meetings;
  });

// Get single meeting by ID
export const getById = withPermission("meetings.read")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const meeting = await prisma.meeting.findUnique({
      where: { id: input.id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        coverAsset: true,
        hostLab: { select: { id: true, name: true } },
        topicsPdfAsset: true,
        gallery: { include: { asset: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    if (!meeting) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    return meeting;
  });

// Create meeting
export const create = withPermission("meetings.create")
  .input(CreateMeetingSchema)
  .handler(async ({ input, context }) => {
    const slug = input.slug || generateSlug(input.title);

    // Check if slug already exists
    const existing = await prisma.meeting.findUnique({ where: { slug } });
    if (existing) {
      throw new ORPCError("BAD_REQUEST", { message: "Slug already exists" });
    }

    const meeting = await prisma.meeting.create({
      data: {
        number: input.number,
        title: input.title,
        slug,
        city: input.city,
        country: input.country,
        countryCode: input.countryCode,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        hostName: input.hostName,
        hostLabId: input.hostLabId,
        summary: input.summary,
        content: input.content,
        status: input.status,
        coverAssetId: input.coverAssetId,
        topicsPdfAssetId: input.topicsPdfAssetId,
        authorId: context.user.id,
      },
    });

    return meeting;
  });

// Update meeting
export const update = withPermission("meetings.update")
  .input(
    z.object({
      id: z.string().uuid(),
      data: UpdateMeetingSchema,
    }),
  )
  .handler(async ({ input }) => {
    const existing = await prisma.meeting.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    // If slug is being changed, check for uniqueness
    if (input.data.slug && input.data.slug !== existing.slug) {
      const slugExists = await prisma.meeting.findUnique({
        where: { slug: input.data.slug },
      });
      if (slugExists) {
        throw new ORPCError("BAD_REQUEST", { message: "Slug already exists" });
      }
    }

    const { startDate, endDate, ...rest } = input.data;

    const meeting = await prisma.meeting.update({
      where: { id: input.id },
      data: {
        ...rest,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
      },
    });

    return meeting;
  });

// Delete meeting
export const remove = withPermission("meetings.delete")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.meeting.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    await prisma.meeting.delete({ where: { id: input.id } });
    return { success: true };
  });

// Publish meeting
export const publish = withPermission("meetings.update")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const meeting = await prisma.meeting.update({
      where: { id: input.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return meeting;
  });

// Archive meeting
export const archive = withPermission("meetings.update")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const meeting = await prisma.meeting.update({
      where: { id: input.id },
      data: { status: "ARCHIVED" },
    });

    return meeting;
  });

// ============================================
// PUBLIC PROCEDURES (for public website)
// ============================================

// List published meetings (public - no auth required)
export const listPublished = publicProcedure
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ input }) => {
    const { limit, cursor } = input;

    const meetings = await prisma.meeting.findMany({
      where: {
        status: "PUBLISHED",
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: { number: "desc" },
      take: limit,
      include: {
        coverAsset: true,
        hostLab: { select: { id: true, name: true } },
      },
    });

    return meetings;
  });

// Get single published meeting by slug (public - no auth required)
export const getBySlug = publicProcedure
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const meeting = await prisma.meeting.findUnique({
      where: { slug: input.slug },
      include: {
        coverAsset: true,
        hostLab: { select: { id: true, name: true } },
        topicsPdfAsset: true,
        gallery: { include: { asset: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    if (!meeting) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    // Only return published meetings for public access
    if (meeting.status !== "PUBLISHED") {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    return meeting;
  });

export const meetingsRouter = {
  list,
  getById,
  create,
  update,
  remove,
  publish,
  archive,
  // Public procedures
  listPublished,
  getBySlug,
};
