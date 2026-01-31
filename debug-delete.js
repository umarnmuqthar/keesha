const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB DELETE DEBUG ---');
    try {
        const id = 7; // User was on /subscription/7
        console.log('Attempting to delete ID:', id);

        const sub = await prisma.subscription.findUnique({ where: { id } });
        if (!sub) {
            console.log('Subscription not found.');
            return;
        }
        console.log('Found subscription:', sub.name);

        // Mimic the action logic
        await prisma.transactionLedger.deleteMany({
            where: { subscriptionId: id }
        });
        console.log('Deleted ledger entries.');

        await prisma.subscription.delete({
            where: { id }
        });
        console.log('Deleted subscription successfully.');

    } catch (e) {
        console.error('Delete failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
