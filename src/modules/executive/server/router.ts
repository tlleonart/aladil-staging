import * as z from "zod";
import { hasPermission } from "@/modules/core/auth/rbac";
import { prisma } from "@/modules/core/db";
import {
  ORPCError,
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateExecutiveMemberSchema,
  ListExecutiveQuerySchema,
  UpdateExecutiveMemberSchema,
} from "../schemas";

// Permission check middleware
const withPermission = (permission: string) =>
  protectedProcedure.use(async ({ context, next }) => {
    const allowed = await hasPermission(
      context.user.id,
      "EXEC_COMMITTEE",
      permission,
    );
    if (!allowed) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permission denied: ${permission}`,
      });
    }
    return next({ context });
  });

// List executive members
export const list = withPermission("executive.read")
  .input(ListExecutiveQuerySchema)
  .handler(async ({ input }) => {
    const { isActive, countryCode, limit, cursor } = input;

    const members = await prisma.executiveMember.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
        ...(countryCode && { countryCode }),
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
      take: limit,
      include: {
        lab: { select: { id: true, name: true } },
        photoAsset: true,
      },
    });

    return members;
  });

// Get single executive member by ID
export const getById = withPermission("executive.read")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const member = await prisma.executiveMember.findUnique({
      where: { id: input.id },
      include: {
        lab: { select: { id: true, name: true } },
        photoAsset: true,
        flagAsset: true,
      },
    });

    if (!member) {
      throw new ORPCError("NOT_FOUND", {
        message: "Executive member not found",
      });
    }

    return member;
  });

// Create executive member
export const create = withPermission("executive.create")
  .input(CreateExecutiveMemberSchema)
  .handler(async ({ input }) => {
    const member = await prisma.executiveMember.create({
      data: {
        fullName: input.fullName,
        position: input.position,
        countryCode: input.countryCode,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        labId: input.labId,
        photoAssetId: input.photoAssetId,
        flagAssetId: input.flagAssetId,
      },
    });

    return member;
  });

// Update executive member
export const update = withPermission("executive.update")
  .input(
    z.object({
      id: z.string().uuid(),
      data: UpdateExecutiveMemberSchema,
    }),
  )
  .handler(async ({ input }) => {
    const existing = await prisma.executiveMember.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Executive member not found",
      });
    }

    const member = await prisma.executiveMember.update({
      where: { id: input.id },
      data: input.data,
    });

    return member;
  });

// Delete executive member
export const remove = withPermission("executive.delete")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.executiveMember.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Executive member not found",
      });
    }

    await prisma.executiveMember.delete({ where: { id: input.id } });
    return { success: true };
  });

// Toggle active status
export const toggleActive = withPermission("executive.update")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.executiveMember.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Executive member not found",
      });
    }

    const member = await prisma.executiveMember.update({
      where: { id: input.id },
      data: { isActive: !existing.isActive },
    });

    return member;
  });

// ==========================================
// PUBLIC PROCEDURES (no auth required)
// ==========================================

// List active executive members (public)
export const listPublic = publicProcedure
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ input }) => {
    const { limit } = input;

    const members = await prisma.executiveMember.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
      take: limit,
      include: {
        lab: { select: { id: true, name: true } },
        photoAsset: true,
      },
    });

    return members;
  });

export const executiveRouter = {
  // Public procedures
  listPublic,
  // Protected procedures
  list,
  getById,
  create,
  update,
  remove,
  toggleActive,
};
