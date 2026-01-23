import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_PRISMA_URL is required");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create Projects
  console.log("Creating projects...");
  const projects = await Promise.all([
    prisma.project.upsert({
      where: { key: "INTRANET" },
      update: {},
      create: {
        key: "INTRANET",
        name: "Intranet",
        description: "Admin dashboard access",
      },
    }),
    prisma.project.upsert({
      where: { key: "NEWS" },
      update: {},
      create: {
        key: "NEWS",
        name: "News Management",
        description: "Manage news posts",
      },
    }),
    prisma.project.upsert({
      where: { key: "MEETINGS" },
      update: {},
      create: {
        key: "MEETINGS",
        name: "Meetings Management",
        description: "Manage meetings",
      },
    }),
    prisma.project.upsert({
      where: { key: "LABS" },
      update: {},
      create: {
        key: "LABS",
        name: "Labs Management",
        description: "Manage member laboratories",
      },
    }),
    prisma.project.upsert({
      where: { key: "EXEC_COMMITTEE" },
      update: {},
      create: {
        key: "EXEC_COMMITTEE",
        name: "Executive Committee",
        description: "Manage executive committee",
      },
    }),
    prisma.project.upsert({
      where: { key: "SETTINGS" },
      update: {},
      create: {
        key: "SETTINGS",
        name: "Settings",
        description: "System settings",
      },
    }),
  ]);
  console.log(`Created ${projects.length} projects`);

  // 2. Create Permissions
  console.log("Creating permissions...");
  const permissionKeys = [
    // News
    "news.read",
    "news.create",
    "news.update",
    "news.delete",
    "news.publish",
    // Meetings
    "meetings.read",
    "meetings.create",
    "meetings.update",
    "meetings.delete",
    // Labs
    "labs.read",
    "labs.create",
    "labs.update",
    "labs.delete",
    // Executive
    "executive.read",
    "executive.create",
    "executive.update",
    "executive.delete",
    // Users
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "users.manage",
    // Contact
    "contact.read",
    "contact.archive",
    // Roles
    "roles.manage",
  ];

  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, description: `Permission: ${key}` },
      }),
    ),
  );
  console.log(`Created ${permissions.length} permissions`);

  // 3. Create Admin Role for Intranet project
  console.log("Creating admin role...");
  const intranetProject = projects.find((p) => p.key === "INTRANET")!;

  const adminRole = await prisma.role.upsert({
    where: {
      projectId_key: { projectId: intranetProject.id, key: "admin" },
    },
    update: {},
    create: {
      projectId: intranetProject.id,
      key: "admin",
      name: "Administrator",
      description: "Full access to all features",
      isSystem: true,
    },
  });

  // Assign all permissions to admin role
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log("Created admin role with all permissions");

  // 4. Create Admin User
  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("admin123!", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@aladil.org" },
    update: {},
    create: {
      email: "admin@aladil.org",
      name: "Admin",
      emailVerified: true,
      isActive: true,
      isSuperAdmin: true,
    },
  });

  // Create Better Auth Account for credential login
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: adminUser.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      accountId: adminUser.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  // Assign admin role to user
  await prisma.userProjectRole.upsert({
    where: {
      userId_projectId: { userId: adminUser.id, projectId: intranetProject.id },
    },
    update: {},
    create: {
      userId: adminUser.id,
      projectId: intranetProject.id,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log("\n========================================");
  console.log("Admin user created:");
  console.log("  Email: admin@aladil.org");
  console.log("  Password: admin123!");
  console.log("========================================\n");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
