import * as z from "zod";
import { hasPermission } from "@/modules/core/auth/rbac";
import { prisma } from "@/modules/core/db";
import {
  ORPCError,
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import { CreateContactInputSchema, ListContactQuerySchema } from "../schemas";

// Permission check middleware
const withPermission = (permission: string) =>
  protectedProcedure.use(async ({ context, next }) => {
    const allowed = await hasPermission(
      context.user.id,
      "SETTINGS",
      permission,
    );
    if (!allowed) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permission denied: ${permission}`,
      });
    }
    return next({ context });
  });

// List contact messages
export const list = withPermission("contact.read")
  .input(ListContactQuerySchema)
  .handler(async ({ input }) => {
    const { status, limit, cursor } = input;

    const messages = await prisma.contactMessage.findMany({
      where: {
        ...(status && { status }),
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages;
  });

// Get single contact message by ID
export const getById = withPermission("contact.read")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const message = await prisma.contactMessage.findUnique({
      where: { id: input.id },
    });

    if (!message) {
      throw new ORPCError("NOT_FOUND", {
        message: "Contact message not found",
      });
    }

    // Mark as read if it was new
    if (message.status === "NEW") {
      await prisma.contactMessage.update({
        where: { id: input.id },
        data: { status: "READ" },
      });
    }

    return message;
  });

// Mark message as read
export const markAsRead = withPermission("contact.read")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.contactMessage.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Contact message not found",
      });
    }

    const message = await prisma.contactMessage.update({
      where: { id: input.id },
      data: { status: "READ" },
    });

    return message;
  });

// Archive message
export const archive = withPermission("contact.archive")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.contactMessage.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Contact message not found",
      });
    }

    const message = await prisma.contactMessage.update({
      where: { id: input.id },
      data: { status: "ARCHIVED" },
    });

    return message;
  });

// Unarchive message (restore to READ)
export const unarchive = withPermission("contact.archive")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.contactMessage.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Contact message not found",
      });
    }

    const message = await prisma.contactMessage.update({
      where: { id: input.id },
      data: { status: "READ" },
    });

    return message;
  });

// Public: Create a new contact message (no auth required)
export const create = publicProcedure
  .input(CreateContactInputSchema)
  .handler(async ({ input }) => {
    const message = await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        message: input.message,
        status: "NEW",
      },
    });

    return { success: true, id: message.id };
  });

export const contactRouter = {
  list,
  getById,
  markAsRead,
  archive,
  unarchive,
  create,
};
