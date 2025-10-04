const {
  PrismaClient,
} = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const azureId = process.argv[2];
  const email = process.argv[3] || null;
  if (!azureId) {
    console.error(
      "Usage: node scripts/upsertAdminByAzureId.js <azureId> [email]",
    );
    process.exit(2);
  }

  const data = {
    azureId,
    isAdmin: true,
    active: true,
  };
  if (email) data.email = email;

  try {
    if (email) {
      // If an AdminUser exists with this email, update it to set/attach the azureId
      const existing =
        await prisma.adminUser.findUnique({
          where: { email },
        });
      if (existing) {
        const updated =
          await prisma.adminUser.update({
            where: { email },
            data: { ...data, email },
          });
        console.log(
          "Updated existing admin user by email:",
          updated,
        );
        return;
      }
    }

    const user = await prisma.adminUser.upsert({
      where: { azureId },
      update: data,
      create: {
        azureId,
        email:
          email || `service-${azureId}@local`,
        isAdmin: true,
        active: true,
      },
    });
    console.log("Upserted admin user:", user);
  } catch (err) {
    console.error("Upsert failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
