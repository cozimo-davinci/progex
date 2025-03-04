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

export async function POST(request: Request) {
    const data = await request.json();
    try {
        // create a new application record
        const newApplication = await prisma.jobApplication.create({
            data: {
                userId: data.userId,
                jobTitle: data.jobTitle,
                company: data.company,
                position: data.position,
                status: data.status,
                link: data.link,
            },
        });
        return NextResponse.json(newApplication, { status: 201 });
    } catch (error) {
        console.error("Error creating job application:", error);
        return NextResponse.json(
            { error: "Failed to create job application" },
            { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// update the application
export async function PUT(request: Request) {
    const data = await request.json();
    try {
        // Validate that the required 'id' field is provided
        if (!data.id) {
            return NextResponse.json(
                { error: "Application ID is required" },
                { status: 400 }
            );
        }

        // Dynamically construct the data object with only the provided fields
        const updateData: Partial<{
            userId: string;
            jobTitle: string;
            company: string;
            position: string;
            status: string;
            link: string;
        }> = {};

        // Add only the fields that are present in the request body
        if (data.userId !== undefined) updateData.userId = data.userId;
        if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
        if (data.company !== undefined) updateData.company = data.company;
        if (data.position !== undefined) updateData.position = data.position;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.link !== undefined) updateData.link = data.link;

        // Update the application record with only the provided fields
        const updatedApplication = await prisma.jobApplication.update({
            where: { id: data.id },
            data: updateData,
        });

        return NextResponse.json(updatedApplication, { status: 200 });
    } catch (error) {
        console.error("Error updating job application:", error);
        return NextResponse.json(
            { error: "Failed to update job application" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}