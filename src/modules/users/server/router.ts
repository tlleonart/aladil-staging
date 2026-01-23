import bcrypt from "bcryptjs";
import * as z from "zod";
import { prisma } from "@/modules/core/db";
import { adminProcedure, ORPCError } from "@/modules/core/orpc/server";
import {
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
} from "../schemas";

// List users (admin only)
export const list = adminProcedure
  .input(ListUsersQuerySchema)
  .handler(async ({ input }) => {
    const { isActive, limit, cursor } = input;

    const users = await prisma.user.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          include: {
            project: { select: { id: true, key: true, name: true } },
            role: { select: { id: true, key: true, name: true } },
          },
        },
      },
    });

    return users;
  });

// Get single user by ID
export const getById = adminProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          include: {
            project: { select: { id: true, key: true, name: true } },
            role: { select: { id: true, key: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new ORPCError("NOT_FOUND", { message: "User not found" });
    }

    return user;
  });

// Create user
export const create = adminProcedure
  .input(CreateUserSchema)
  .handler(async ({ input }) => {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ORPCError("BAD_REQUEST", { message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        emailVerified: true, // Admin-created users are pre-verified
        isActive: input.isActive,
        isSuperAdmin: input.isSuperAdmin,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create Better Auth Account for credential login
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    return user;
  });

// Update user
export const update = adminProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      data: UpdateUserSchema,
    }),
  )
  .handler(async ({ input }) => {
    const existing = await prisma.user.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "User not found" });
    }

    // If email is being changed, check for uniqueness
    if (input.data.email && input.data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.data.email },
      });
      if (emailExists) {
        throw new ORPCError("BAD_REQUEST", { message: "Email already exists" });
      }
    }

    const { password, ...rest } = input.data;
    const updateData: Record<string, unknown> = { ...rest };

    // If password is being changed, hash it and update Better Auth Account
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.account.updateMany({
        where: { userId: input.id, providerId: "credential" },
        data: { password: hashedPassword },
      });
    }

    const user = await prisma.user.update({
      where: { id: input.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  });

// Delete user
export const remove = adminProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    // Prevent self-deletion
    if (input.id === context.user.id) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot delete your own account",
      });
    }

    const existing = await prisma.user.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "User not found" });
    }

    await prisma.user.delete({ where: { id: input.id } });
    return { success: true };
  });

// Toggle active status
export const toggleActive = adminProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    // Prevent self-deactivation
    if (input.id === context.user.id) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot deactivate your own account",
      });
    }

    const existing = await prisma.user.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "User not found" });
    }

    const user = await prisma.user.update({
      where: { id: input.id },
      data: { isActive: !existing.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  });

export const usersRouter = {
  list,
  getById,
  create,
  update,
  remove,
  toggleActive,
};
