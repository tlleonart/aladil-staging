import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
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
  console.log("🔍 Database Diagnostic\n");
  console.log("=".repeat(50));

  // Check counts
  const labsCount = await prisma.lab.count();
  const meetingsCount = await prisma.meeting.count();
  const executiveCount = await prisma.executiveMember.count();
  const usersCount = await prisma.user.count();
  const sessionsCount = await prisma.session.count();

  console.log("\n📊 Record Counts:");
  console.log(`   Labs: ${labsCount}`);
  console.log(`   Meetings: ${meetingsCount}`);
  console.log(`   Executive Members: ${executiveCount}`);
  console.log(`   Users: ${usersCount}`);
  console.log(`   Active Sessions: ${sessionsCount}`);

  // Check admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@aladil.org" },
    include: {
      accounts: { select: { providerId: true, password: true } },
      memberships: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  console.log("\n👤 Admin User:");
  if (adminUser) {
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   isSuperAdmin: ${adminUser.isSuperAdmin}`);
    console.log(`   isActive: ${adminUser.isActive}`);
    console.log(`   Accounts: ${adminUser.accounts.length}`);
    console.log(
      `   Has password: ${adminUser.accounts.some((a) => a.password)}`
    );
    console.log(`   Memberships: ${adminUser.memberships.length}`);
    if (adminUser.memberships.length > 0) {
      const perms = adminUser.memberships[0].role.permissions.map(
        (p) => p.permission.key
      );
      console.log(`   Permissions: ${perms.length} (${perms.slice(0, 5).join(", ")}...)`);
    }
  } else {
    console.log("   ❌ NOT FOUND!");
  }

  // Check active sessions
  console.log("\n🔐 Active Sessions:");
  const sessions = await prisma.session.findMany({
    include: { user: { select: { email: true } } },
    take: 5,
  });
  if (sessions.length === 0) {
    console.log("   No active sessions");
  } else {
    for (const s of sessions) {
      console.log(`   - ${s.user.email} (expires: ${s.expiresAt})`);
    }
  }

  // Sample data
  console.log("\n📋 Sample Labs:");
  const labs = await prisma.lab.findMany({ take: 3, select: { name: true, isActive: true } });
  for (const lab of labs) {
    console.log(`   - ${lab.name} (active: ${lab.isActive})`);
  }

  console.log("\n📅 Sample Meetings:");
  const meetings = await prisma.meeting.findMany({
    take: 3,
    select: { number: true, title: true, status: true },
    orderBy: { number: "desc" },
  });
  for (const m of meetings) {
    console.log(`   - #${m.number}: ${m.title} (${m.status})`);
  }

  console.log(`\n${"=".repeat(50)}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
