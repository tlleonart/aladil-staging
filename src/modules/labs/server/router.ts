import * as z from "zod";
import { hasPermission } from "@/modules/core/auth/rbac";
import { prisma } from "@/modules/core/db";
import {
  ORPCError,
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateLabSchema,
  ListLabsQuerySchema,
  UpdateLabSchema,
} from "../schemas";

// Public list - for public website (no auth required)
export const publicList = publicProcedure
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ input }) => {
    const labs = await prisma.lab.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: input.limit,
      include: {
        logoAsset: true,
      },
    });

    return labs;
  });

// Permission check middleware
const withPermission = (permission: string) =>
  protectedProcedure.use(async ({ context, next }) => {
    const allowed = await hasPermission(context.user.id, "LABS", permission);
    if (!allowed) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permission denied: ${permission}`,
      });
    }
    return next({ context });
  });

// List labs
export const list = withPermission("labs.read")
  .input(ListLabsQuerySchema)
  .handler(async ({ input }) => {
    const { isActive, countryCode, limit, cursor } = input;

    const labs = await prisma.lab.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
        ...(countryCode && { countryCode }),
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: limit,
      include: {
        logoAsset: true,
      },
    });

    return labs;
  });

// Get single lab by ID
export const getById = withPermission("labs.read")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const lab = await prisma.lab.findUnique({
      where: { id: input.id },
      include: {
        logoAsset: true,
        executiveMembers: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!lab) {
      throw new ORPCError("NOT_FOUND", { message: "Lab not found" });
    }

    return lab;
  });

// Create lab
export const create = withPermission("labs.create")
  .input(CreateLabSchema)
  .handler(async ({ input }) => {
    const lab = await prisma.lab.create({
      data: {
        name: input.name,
        countryCode: input.countryCode,
        city: input.city,
        websiteUrl: input.websiteUrl || null,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        logoAssetId: input.logoAssetId,
      },
    });

    return lab;
  });

// Update lab
export const update = withPermission("labs.update")
  .input(
    z.object({
      id: z.string().uuid(),
      data: UpdateLabSchema,
    }),
  )
  .handler(async ({ input }) => {
    const existing = await prisma.lab.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Lab not found" });
    }

    const { websiteUrl, ...rest } = input.data;

    const lab = await prisma.lab.update({
      where: { id: input.id },
      data: {
        ...rest,
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl || null }),
      },
    });

    return lab;
  });

// Delete lab
export const remove = withPermission("labs.delete")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.lab.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Lab not found" });
    }

    await prisma.lab.delete({ where: { id: input.id } });
    return { success: true };
  });

// Toggle active status
export const toggleActive = withPermission("labs.update")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.lab.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Lab not found" });
    }

    const lab = await prisma.lab.update({
      where: { id: input.id },
      data: { isActive: !existing.isActive },
    });

    return lab;
  });

export const labsRouter = {
  publicList,
  list,
  getById,
  create,
  update,
  remove,
  toggleActive,
};
