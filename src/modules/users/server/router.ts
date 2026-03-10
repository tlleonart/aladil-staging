import bcrypt from "bcryptjs";
import * as z from "zod";
import { prisma } from "@/modules/core/db";
import {
  adminProcedure,
  ORPCError,
  protectedProcedure,
} from "@/modules/core/orpc/server";
import {
  ChangePasswordSchema,
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateProfileSchema,
  UpdateUserSchema,
} from "../schemas";

const userSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  isSuperAdmin: true,
  labId: true,
  lab: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
  memberships: {
    include: {
      project: { select: { id: true, key: true, name: true } },
      role: { select: { id: true, key: true, name: true } },
    },
  },
} as const;

// Helper to sync a project role assignment for a user
async function syncProjectRole(
  userId: string,
  projectKey: "PILA" | "INTRANET",
  roleKey: string | undefined,
): Promise<void> {
  if (roleKey === undefined) return;

  const project = await prisma.project.findUnique({
    where: { key: projectKey },
  });
  if (!project) return;

  if (roleKey === "none") {
    await prisma.userProjectRole.deleteMany({
      where: { userId, projectId: project.id },
    });
    return;
  }

  const role = await prisma.role.findUnique({
    where: { projectId_key: { projectId: project.id, key: roleKey } },
  });
  if (!role) return;

  await prisma.userProjectRole.upsert({
    where: { userId_projectId: { userId, projectId: project.id } },
    update: { roleId: role.id, isActive: true },
    create: {
      userId,
      projectId: project.id,
      roleId: role.id,
      isActive: true,
    },
  });
}

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
      select: userSelect,
    });

    return users;
  });

// Get single user by ID
export const getById = adminProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id },
      select: userSelect,
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
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ORPCError("BAD_REQUEST", { message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const { pilaRoleKey, roleKey, ...userData } = input;

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        emailVerified: true,
        isActive: userData.isActive,
        isSuperAdmin: userData.isSuperAdmin,
        labId: userData.labId,
      },
      select: userSelect,
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

    // Sync roles
    await syncProjectRole(user.id, "INTRANET", roleKey);
    await syncProjectRole(user.id, "PILA", pilaRoleKey);

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

    const { password, pilaRoleKey, roleKey, ...rest } = input.data;
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
      select: userSelect,
    });

    // Sync roles
    await syncProjectRole(input.id, "INTRANET", roleKey);
    await syncProjectRole(input.id, "PILA", pilaRoleKey);

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

// Get current user's profile with role info (for sidebar filtering, etc.)
export const me = protectedProcedure.handler(async ({ context }) => {
  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
      labId: true,
      lab: { select: { id: true, name: true } },
      memberships: {
        where: { isActive: true },
        include: {
          project: { select: { key: true } },
          role: {
            select: {
              key: true,
              permissions: {
                include: { permission: { select: { key: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ORPCError("NOT_FOUND", { message: "User not found" });
  }

  // Flatten all permissions across all project memberships
  const allPermissions = user.isSuperAdmin
    ? ["*"]
    : user.memberships.flatMap((m) =>
        m.role.permissions.map((rp) => rp.permission.key),
      );

  // Determine effective role for UI purposes
  let effectiveRole: "admin" | "director" | "reporter" = "reporter";
  if (user.isSuperAdmin) {
    effectiveRole = "admin";
  } else {
    const intranetMembership = user.memberships.find(
      (m) => m.project.key === "INTRANET",
    );
    if (intranetMembership) {
      if (intranetMembership.role.key === "admin") effectiveRole = "admin";
      else if (intranetMembership.role.key === "director")
        effectiveRole = "director";
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    labId: user.labId,
    labName: user.lab?.name ?? null,
    effectiveRole,
    permissions: allPermissions,
  };
});

// Update own profile (any authenticated user)
export const updateProfile = protectedProcedure
  .input(UpdateProfileSchema)
  .handler(async ({ input, context }) => {
    await prisma.user.update({
      where: { id: context.user.id },
      data: { name: input.name },
    });
    return { success: true };
  });

// Change own password (any authenticated user)
export const changePassword = protectedProcedure
  .input(ChangePasswordSchema)
  .handler(async ({ input, context }) => {
    const account = await prisma.account.findFirst({
      where: { userId: context.user.id, providerId: "credential" },
    });

    if (!account?.password) {
      throw new ORPCError("BAD_REQUEST", {
        message: "No se encontró una cuenta con contraseña",
      });
    }

    const isValid = await bcrypt.compare(
      input.currentPassword,
      account.password,
    );
    if (!isValid) {
      throw new ORPCError("BAD_REQUEST", {
        message: "La contraseña actual es incorrecta",
      });
    }

    const hashed = await bcrypt.hash(input.newPassword, 12);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashed },
    });

    return { success: true };
  });

export const usersRouter = {
  list,
  getById,
  create,
  update,
  remove,
  toggleActive,
  me,
  updateProfile,
  changePassword,
};
