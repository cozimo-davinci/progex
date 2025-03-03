import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// create a prisma client
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "production") global.prisma = prisma;

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
        // fetch all the application records
        const jobApplications = await prisma.jobApplication.findMany(
            {
                where: {
                    ...(userId && { userId: userId }),
                },
                orderBy: { applied_at: "desc" },
            }
        );
        return NextResponse.json(jobApplications, { status: 200 });
    } catch (error) {
        console.error("Error fetching job applications:", error);
        return NextResponse.json(
            { error: "Failed to fetch job applications" },
            { status: 500 });
    } finally {
        await prisma.$disconnect();
    }


}