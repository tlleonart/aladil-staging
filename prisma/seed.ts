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
    prisma.project.upsert({
      where: { key: "PILA" },
      update: {},
      create: {
        key: "PILA",
        name: "Programa PILA",
        description: "PILA indicator reports management",
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
    // PILA
    "pila.submit",
    "pila.read_own",
    "pila.read_all",
    "pila.manage",
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

  // 3b. Create PILA-specific roles
  console.log("Creating PILA roles...");
  const pilaProject = projects.find((p) => p.key === "PILA")!;

  // lab_reporter: can submit reports and view own lab's reports
  const labReporterRole = await prisma.role.upsert({
    where: {
      projectId_key: { projectId: pilaProject.id, key: "lab_reporter" },
    },
    update: {},
    create: {
      projectId: pilaProject.id,
      key: "lab_reporter",
      name: "Lab Reporter",
      description:
        "Can submit PILA reports and view own laboratory reports only",
      isSystem: true,
    },
  });

  // Assign lab_reporter permissions: pila.submit + pila.read_own
  const labReporterPermissions = permissions.filter((p) =>
    ["pila.submit", "pila.read_own"].includes(p.key),
  );
  for (const permission of labReporterPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: labReporterRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: labReporterRole.id,
        permissionId: permission.id,
      },
    });
  }

  // pila_admin: can view all reports and manage PILA
  const pilaAdminRole = await prisma.role.upsert({
    where: {
      projectId_key: { projectId: pilaProject.id, key: "pila_admin" },
    },
    update: {},
    create: {
      projectId: pilaProject.id,
      key: "pila_admin",
      name: "PILA Administrator",
      description: "Full access to all PILA reports across all laboratories",
      isSystem: true,
    },
  });

  // Assign all pila permissions to pila_admin
  const pilaPermissions = permissions.filter((p) =>
    p.key.startsWith("pila."),
  );
  for (const permission of pilaPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: pilaAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: pilaAdminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(
    "Created PILA roles: lab_reporter (submit + read_own), pila_admin (all pila permissions)",
  );

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

  // 5. Seed PILA Indicators
  console.log("Creating PILA indicators...");
  const pilaIndicators = [
    {
      code: "I-1",
      name: "Error de ingreso de pacientes",
      formula: "Errores por ingreso / Total ingresos manuales",
      numeratorLabel: "Cantidad de errores por ingreso",
      denominatorLabel: "Cantidad total de ingresos manuales",
      considerations:
        "Se contabiliza la cantidad de errores en el ingreso de un paciente luego de la confirmación del mismo / total de ingresos.",
      exclusions:
        "Se excluyen modificaciones que surjan como un control interno del ingreso o que no hayan sido por un error en el momento del ingreso (Ej.: validación, errores detectados en el proceso de ingreso, etc.).",
      sortOrder: 1,
    },
    {
      code: "I-3",
      name: "Urocultivos contaminados",
      formula: "(Urocultivos contaminados / Número total de urocultivos) × 100",
      numeratorLabel: "Urocultivos contaminados",
      denominatorLabel: "Número total de urocultivos",
      considerations:
        "Se consideran en el numerador los urocultivos de los pacientes a los cuales se les solicitó nueva muestra.",
      exclusions: null,
      sortOrder: 2,
    },
    {
      code: "I-5",
      name: "Rechazo de muestras",
      formula: "Muestras rechazadas / Total de protocolos (pacientes)",
      numeratorLabel: "Muestras rechazadas",
      denominatorLabel: "Total de protocolos (pacientes)",
      considerations: "Todo tipo de muestras.",
      exclusions: null,
      sortOrder: 3,
    },
    {
      code: "I-6",
      name: "Repetición por solicitud de nueva muestra en el proceso analítico",
      formula:
        "Número de repeticiones por error de proceso analítico / Total de pacientes",
      numeratorLabel: "Número de repeticiones por error de proceso analítico",
      denominatorLabel: "Total de pacientes",
      considerations:
        "Solo se contabilizan los errores que llevan a una repetición de la toma de muestras.",
      exclusions:
        "Repetición por algoritmo. Ej. HIV. Confirmaciones de resultados propias del proceso de validación. Se excluyen protocolos para derivantes. Solo se contabilizan los pacientes atendidos en el laboratorio que debieron ser repetidos.",
      sortOrder: 4,
    },
    {
      code: "I-8",
      name: "Porcentaje de respuesta de los pacientes",
      formula: "Cantidad de respuestas obtenidas / Cantidad de encuestas enviadas",
      numeratorLabel: "Cantidad de respuestas obtenidas",
      denominatorLabel: "Cantidad de encuestas enviadas",
      considerations:
        "Se contabilizan la totalidad de las encuestas independientemente de las herramientas utilizadas (Google, SurveyMonkey, impresa, App, etc.). Los protocolos que se incluyen en el denominador corresponden a los pertinentes a pacientes del laboratorio, no los derivantes.",
      exclusions: null,
      sortOrder: 5,
    },
    {
      code: "I-9",
      name: "Informes demorados",
      formula:
        "% de pacientes con incumplimiento de la fecha-hora de promesa / Total de pacientes",
      numeratorLabel:
        "Pacientes con incumplimiento de la fecha-hora de promesa",
      denominatorLabel: "Total de pacientes",
      considerations:
        "Se considera informe demorado aquel que no está disponible para ser entregado a la fecha y hora comprometida; independientemente de que se haya solicitado o consultado por el paciente. Se incluye derivantes. Se evalúa el cumplimiento del plazo de entrega de los informes de análisis clínicos.",
      exclusions: null,
      sortOrder: 6,
    },
    {
      code: "I-11",
      name: "Error de validación",
      formula: "% de informes modificados / Total de informes validados",
      numeratorLabel: "Informes modificados",
      denominatorLabel: "Total de informes validados",
      considerations:
        "En este caso cuando hablamos de informe nos referimos a paciente. Informe = paciente. Refiere a cualquier modificación en los informes una vez que ya estuvo disponible para el paciente.",
      exclusions:
        "Modificaciones previas a la validación final que habilita la entrega del informe.",
      sortOrder: 7,
    },
    {
      code: "I-13",
      name: "Ausentismo total",
      formula: "Días no trabajados / Días laborables",
      numeratorLabel: "Días no trabajados",
      denominatorLabel: "Días laborables",
      considerations:
        "Se contabilizan el total de los días laborables de cada persona y los días trabajados. Se contabiliza a todo el personal. Se contabilizan TODAS las ausencias justificadas y NO justificadas.",
      exclusions: null,
      sortOrder: 8,
    },
    {
      code: "I-14",
      name: "Accidentes laborales",
      formula:
        "Inverso de (Cantidad de accidentes registrados durante días del mes en curso / Días del mes en curso)",
      numeratorLabel: "Cantidad de accidentes registrados",
      denominatorLabel: "Días del mes en curso",
      considerations:
        "Se contabilizan accidentes laborales de cualquier miembro del personal (punciones accidentales, caídas, accidentes de tránsito para personal que transporta muestras, etc.).",
      exclusions: null,
      sortOrder: 9,
    },
    {
      code: "I-15",
      name: "Rotación del personal",
      formula: "Cantidad de empleados desvinculados / Cantidad total de empleados",
      numeratorLabel: "Cantidad de empleados desvinculados (desvinculaciones)",
      denominatorLabel: "Cantidad total de empleados",
      considerations:
        "Solo empleados desvinculados (por jubilación, voluntario, despidos, etc.).",
      exclusions: null,
      sortOrder: 10,
    },
    {
      code: "I-17",
      name: "Llamadas atendidas",
      formula: "Total de llamadas atendidas / Llamadas totales",
      numeratorLabel: "Total de llamadas atendidas",
      denominatorLabel: "Llamadas totales",
      considerations: "Solo llamadas externas.",
      exclusions: null,
      sortOrder: 11,
    },
  ];

  for (const indicator of pilaIndicators) {
    await prisma.pilaIndicator.upsert({
      where: { code: indicator.code },
      update: {
        name: indicator.name,
        formula: indicator.formula,
        numeratorLabel: indicator.numeratorLabel,
        denominatorLabel: indicator.denominatorLabel,
        considerations: indicator.considerations,
        exclusions: indicator.exclusions,
        sortOrder: indicator.sortOrder,
      },
      create: indicator,
    });
  }
  console.log(`Created ${pilaIndicators.length} PILA indicators`);

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
