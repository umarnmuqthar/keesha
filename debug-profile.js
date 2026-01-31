
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProfile() {
    try {
        console.log("Checking Prisma Models...");
        if (!prisma.userProfile) {
            console.error("ERROR: prisma.userProfile is undefined!");
            console.log("Available properties:", Object.keys(prisma));
        } else {
            console.log("prisma.userProfile exists.");
            const profile = await prisma.userProfile.findFirst();
            console.log("Profile:", profile);
        }
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testProfile();
