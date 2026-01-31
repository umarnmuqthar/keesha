
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Clear existing data
    await prisma.transactionLedger.deleteMany()
    await prisma.subscription.deleteMany()

    // 1. Netflix - Weekly/Monthly active
    const netflix = await prisma.subscription.create({
        data: {
            name: 'Netflix',
            status: 'Active',
            billingCycle: 'Monthly',
            currentCost: 649,
            nextRenewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
            autoPayActive: true,
            paymentMethod: 'Credit Card',
            ledger: {
                create: [
                    { amount: 649, type: 'Payment', date: new Date('2023-11-20') },
                    { amount: 649, type: 'Payment', date: new Date('2023-10-20') },
                    { amount: 649, type: 'Payment', date: new Date('2023-09-20') },
                ]
            }
        }
    })

    // 2. Adobe Creative Cloud - Yearly, Auto-Pay Warning
    const adobe = await prisma.subscription.create({
        data: {
            name: 'Adobe Creative Cloud',
            status: 'Active',
            billingCycle: 'Yearly',
            currentCost: 23988, // ~1999/mo
            nextRenewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Due in 10 days
            autoPayActive: true, // Should trigger watchdog if < 14 days
            paymentMethod: 'PayPal',
            ledger: {
                create: [
                    { amount: 23988, type: 'Payment', date: new Date('2023-01-20') },
                ]
            }
        }
    })

    // 3. Spotify - Free Trial ending soon
    const spotify = await prisma.subscription.create({
        data: {
            name: 'Spotify Premium',
            status: 'Free Trial',
            billingCycle: 'Monthly',
            currentCost: 119,
            nextRenewalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days (Critical!)
            autoPayActive: true,
            paymentMethod: 'Debit Card',
            ledger: {
                create: [
                    { amount: 0, type: 'Trial Start', date: new Date('2023-12-20') },
                ]
            }
        }
    })

    // 4. Gym Membership - Paused
    const gym = await prisma.subscription.create({
        data: {
            name: 'Gold\'s Gym',
            status: 'Paused',
            billingCycle: 'Monthly',
            currentCost: 1500,
            nextRenewalDate: null,
            autoPayActive: false,
            paymentMethod: 'Cash',
            ledger: {
                create: [
                    { amount: 1500, type: 'Payment', date: new Date('2023-08-01') },
                    { amount: 1500, type: 'Payment', date: new Date('2023-07-01') },
                ]
            }
        }
    })

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
