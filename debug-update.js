
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    try {
        console.log("Fetching first subscription...");
        const sub = await prisma.subscription.findFirst();
        if (!sub) {
            console.log("No subscriptions found.");
            return;
        }
        console.log("Found subscription:", sub.id, sub.status);

        console.log("Attempting update...");
        const updated = await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'Cancelled' }
        });
        console.log("Update successful:", updated);
    } catch (e) {
        console.error("Update failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testUpdate();
