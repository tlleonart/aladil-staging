import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("Seeding roles and default lab...\n");

  // ── 1. Create default "ALADIL" lab ─────────────────────────────
  const aladilLab = await prisma.lab.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "ALADIL",
      countryCode: "XX",
      city: null,
      websiteUrl: null,
      isActive: true,
      sortOrder: 0,
    },
  });
  console.log(`Default lab: ${aladilLab.name} (${aladilLab.id})`);

  // Assign admin user to ALADIL lab if no lab assigned
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@aladil.org" },
  });
  if (adminUser && !adminUser.labId) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { labId: aladilLab.id },
    });
    console.log("Assigned admin user to ALADIL lab");
  }

  // ── 2. Get INTRANET project ────────────────────────────────────
  const intranetProject = await prisma.project.findUnique({
    where: { key: "INTRANET" },
  });
  if (!intranetProject) {
    console.error("INTRANET project not found. Run seed.ts first.");
    return;
  }

  // ── 3. Create Director role on INTRANET ────────────────────────
  const readPermissionKeys = [
    "news.read",
    "meetings.read",
    "labs.read",
    "executive.read",
    "contact.read",
    "pila.read_own",
  ];

  const directorRole = await prisma.role.upsert({
    where: {
      projectId_key: { projectId: intranetProject.id, key: "director" },
    },
    update: { name: "Director", description: "Lectura de todos los módulos, PILA solo propio y anónimo" },
    create: {
      projectId: intranetProject.id,
      key: "director",
      name: "Director",
      description: "Lectura de todos los módulos, PILA solo propio y anónimo",
      isSystem: true,
    },
  });

  // Assign read permissions to director
  for (const permKey of readPermissionKeys) {
    const permission = await prisma.permission.findUnique({
      where: { key: permKey },
    });
    if (!permission) {
      console.warn(`  Permission ${permKey} not found, skipping`);
      continue;
    }
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: directorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: { roleId: directorRole.id, permissionId: permission.id },
    });
  }
  console.log(
    `Director role: ${directorRole.key} (${readPermissionKeys.length} permissions)`,
  );

  // ── 4. Create Reporter role on INTRANET ────────────────────────
  // This is for sidebar filtering — reporters only see PILA.
  // Their actual PILA permissions come from the PILA project's lab_reporter role.
  const reporterPermissionKeys = ["pila.submit", "pila.read_own"];

  const reporterRole = await prisma.role.upsert({
    where: {
      projectId_key: { projectId: intranetProject.id, key: "reporter" },
    },
    update: { name: "Reportador", description: "Solo acceso a Programa PILA" },
    create: {
      projectId: intranetProject.id,
      key: "reporter",
      name: "Reportador",
      description: "Solo acceso a Programa PILA",
      isSystem: true,
    },
  });

  for (const permKey of reporterPermissionKeys) {
    const permission = await prisma.permission.findUnique({
      where: { key: permKey },
    });
    if (!permission) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: reporterRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: { roleId: reporterRole.id, permissionId: permission.id },
    });
  }
  console.log(
    `Reporter role: ${reporterRole.key} (${reporterPermissionKeys.length} permissions)`,
  );

  // ── 5. Assign existing lab reporters to INTRANET reporter role ─
  // Find all users with PILA lab_reporter role and assign them INTRANET reporter role
  const pilaProject = await prisma.project.findUnique({
    where: { key: "PILA" },
  });
  if (pilaProject) {
    const pilaLabReporterRole = await prisma.role.findUnique({
      where: {
        projectId_key: { projectId: pilaProject.id, key: "lab_reporter" },
      },
    });

    if (pilaLabReporterRole) {
      const pilaMembers = await prisma.userProjectRole.findMany({
        where: {
          projectId: pilaProject.id,
          roleId: pilaLabReporterRole.id,
          isActive: true,
        },
        select: { userId: true },
      });

      let assigned = 0;
      for (const { userId } of pilaMembers) {
        await prisma.userProjectRole.upsert({
          where: {
            userId_projectId: { userId, projectId: intranetProject.id },
          },
          update: {},
          create: {
            userId,
            projectId: intranetProject.id,
            roleId: reporterRole.id,
            isActive: true,
          },
        });
        assigned++;
      }
      console.log(
        `Assigned ${assigned} existing lab reporters to INTRANET reporter role`,
      );
    }
  }

  // ── Summary ────────────────────────────────────────────────────
  const roles = await prisma.role.findMany({
    where: { projectId: intranetProject.id },
    include: {
      permissions: { include: { permission: { select: { key: true } } } },
      members: { select: { userId: true } },
    },
  });

  console.log("\n=== INTRANET Roles ===");
  for (const role of roles) {
    console.log(`  ${role.key} (${role.name})`);
    console.log(
      `    Perms: ${role.permissions.map((rp) => rp.permission.key).join(", ")}`,
    );
    console.log(`    Members: ${role.members.length}`);
  }
  console.log("\nDone!");
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());
