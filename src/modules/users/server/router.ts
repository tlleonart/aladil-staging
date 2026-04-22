import * as z from "zod";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { fromConvex } from "@/modules/core/orpc/errors";
import { protectedProcedure } from "@/modules/core/orpc/server";
import {
  ChangePasswordSchema,
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateProfileSchema,
  UpdateUserSchema,
} from "../schemas";

const coerceLab = (v: string | null | undefined) =>
  v ? (v as Id<"labs">) : null;

export const list = protectedProcedure
  .input(ListUsersQuerySchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.users.list, {
        isActive: input.isActive,
        limit: input.limit,
        cursor: input.cursor,
      }),
    ),
  );

export const getById = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.users.getById, {
        id: input.id as Id<"users">,
      }),
    ),
  );

export const create = protectedProcedure
  .input(CreateUserSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.users.create, {
        email: input.email,
        name: input.name,
        password: input.password,
        isActive: input.isActive,
        isSuperAdmin: input.isSuperAdmin,
        labId: coerceLab(input.labId),
        roleKey: input.roleKey,
        pilaRoleKey: input.pilaRoleKey,
      }),
    ),
  );

export const update = protectedProcedure
  .input(z.object({ id: z.string().min(1), data: UpdateUserSchema }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.users.update, {
        id: input.id as Id<"users">,
        data: {
          email: input.data.email,
          name: input.data.name,
          password: input.data.password,
          isActive: input.data.isActive,
          isSuperAdmin: input.data.isSuperAdmin,
          labId:
            input.data.labId === undefined
              ? undefined
              : coerceLab(input.data.labId),
          roleKey: input.data.roleKey,
          pilaRoleKey: input.data.pilaRoleKey,
        },
      }),
    ),
  );

export const remove = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.users.remove, {
        id: input.id as Id<"users">,
      }),
    ),
  );

export const toggleActive = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.users.toggleActive, {
        id: input.id as Id<"users">,
      }),
    ),
  );

export const me = protectedProcedure.handler(async ({ context }) =>
  fromConvex(() => context.convex.query(api.users.me, {})),
);

export const updateProfile = protectedProcedure
  .input(UpdateProfileSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.users.updateProfile, { name: input.name }),
    ),
  );

export const changePassword = protectedProcedure
  .input(ChangePasswordSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.users.changePassword, {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    ),
  );

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
