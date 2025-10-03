#!/usr/bin/env node
const prisma = require("../src/prisma").default;

async function main() {
  const email =
    process.env.ADMIN_EMAIL ||
    "mark@pernotto.com";
  console.log("Seeding admin user for", email);
  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { active: true, isAdmin: true },
    create: {
      email,
      isAdmin: true,
      active: true,
    },
  });
  console.log("Seeded admin user id=", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
