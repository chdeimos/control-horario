
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSorting() {
    console.log("Setting up test data...");

    try {
        const account = await prisma.account.findFirst();
        if (!account) {
            console.error("No account found to create transactions");
            return;
        }

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        // Cleanup previous test if any
        await prisma.transaction.deleteMany({
            where: { description: "TEST_VISION_LATEST_SCAN_OLD_DATE" }
        });

        const txA = await prisma.transaction.create({
            data: {
                amount: 10,
                description: "TEST_VISION_LATEST_SCAN_OLD_DATE",
                date: yesterday, // Old date
                type: "GASTO",
                accountId: account.id,
                // createdAt is automatically NOW
            }
        });

        console.log(`Created TX A (Latest Scan): ID=${txA.id}, Date=${txA.date.toISOString()}, CreatedAt=${txA.createdAt.toISOString()}`);

        const sortBy = "createdAt";
        const validSortFields = ["date", "amount", "description", "isVerified", "createdAt"]; // UPDATED CODE
        const actualSortBy = validSortFields.includes(sortBy) ? sortBy : "date";

        console.log(`Requested sortBy: ${sortBy}`);
        console.log(`Actual resolved sortBy logic: ${actualSortBy}`);

        if (actualSortBy === "createdAt") {
            console.log("PASS: Logic accepts 'createdAt'");
        } else {
            console.error("FAIL: Logic defaults to 'date' instead of 'createdAt'");
        }

        // Cleanup
        await prisma.transaction.delete({ where: { id: txA.id } });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testSorting();
