import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cyphlab.dev" },
    update: {},
    create: {
      name: "Ada Admin",
      email: "admin@cyphlab.dev",
      passwordHash,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@cyphlab.dev" },
    update: {},
    create: {
      name: "Pat Manager",
      email: "manager@cyphlab.dev",
      passwordHash,
      role: "PROJECT_MANAGER",
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "member1@cyphlab.dev" },
    update: {},
    create: {
      name: "Sam Member",
      email: "member1@cyphlab.dev",
      passwordHash,
      role: "TEAM_MEMBER",
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "member2@cyphlab.dev" },
    update: {},
    create: {
      name: "Jo Member",
      email: "member2@cyphlab.dev",
      passwordHash,
      role: "TEAM_MEMBER",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "demo-project-seed-1" },
    update: {},
    create: {
      id: "demo-project-seed-1",
      name: "Website Redesign",
      description: "Revamp the marketing site with the new brand guidelines.",
      status: "ACTIVE",
      managerId: manager.id,
      members: {
        create: [{ userId: member1.id }, { userId: member2.id }, { userId: manager.id }],
      },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Design homepage mockups",
        description: "Create Figma mockups for the new homepage layout.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        projectId: project.id,
        assigneeId: member1.id,
        creatorId: manager.id,
      },
      {
        title: "Set up analytics tracking",
        description: "Wire up Google Analytics events for key CTAs.",
        status: "TODO",
        priority: "MEDIUM",
        projectId: project.id,
        assigneeId: member2.id,
        creatorId: manager.id,
      },
      {
        title: "Write launch announcement",
        description: "Draft the blog post announcing the redesign.",
        status: "DONE",
        priority: "LOW",
        projectId: project.id,
        assigneeId: member1.id,
        creatorId: manager.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete. Demo accounts (password: %s):", DEMO_PASSWORD);
  console.log(`  Admin:   ${admin.email}`);
  console.log(`  Manager: ${manager.email}`);
  console.log(`  Member:  ${member1.email}`);
  console.log(`  Member:  ${member2.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
