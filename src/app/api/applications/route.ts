import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Initialize Prisma client
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;
(async () => {
    try {
        await prisma.$connect();
        console.log("Prisma client connected to database");
    } catch (error) {
        console.error("Prisma client failed to connect:", error);
    }
})();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    try {
        // Create Supabase client with automatic session handling
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jobApplications = await prisma.job_application.findMany({
            where: { ...(userId ? { userId } : { userId: user.id }) },
            orderBy: { applied_at: "desc" },
        });
        return NextResponse.json(jobApplications, { status: 200 });
    } catch (error) {
        console.error("Error fetching job applications:", error);
        return NextResponse.json({ error: "Failed to fetch job applications" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    console.log("Received POST data:", data);

    try {
        // Create Supabase client with automatic session handling
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.error("Authentication failed:", error);
            return NextResponse.json({ error: "Unauthorized", details: error?.message || "No user found" }, { status: 401 });
        }

        // Ensure the userId in the data matches the authenticated user
        if (data.userId !== user.id) {
            console.error("User ID mismatch:", { requestUserId: data.userId, authenticatedUserId: user.id });
            return NextResponse.json({ error: "Unauthorized to create application for this user" }, { status: 403 });
        }

        // Validate required fields
        const requiredFields = ["userId", "jobTitle", "company", "position", "status", "link"];
        for (const field of requiredFields) {
            if (!data[field] || typeof data[field] !== "string") {
                console.error(`Validation failed: ${field} is missing or invalid`);
                return NextResponse.json({ error: `Validation failed: ${field} is required and must be a string` }, { status: 400 });
            }
        }

        // Validate status
        const validStatuses = ["IN_PROGRESS", "PROCESSING", "APPROVED", "REJECTED"];
        if (!validStatuses.includes(data.status)) {
            console.error("Invalid status:", data.status);
            return NextResponse.json({ error: `Invalid status: must be one of ${validStatuses.join(", ")}` }, { status: 400 });
        }

        // Validate applied_at
        let appliedAt: Date;
        if (data.applied_at) {
            appliedAt = new Date(data.applied_at);
            if (isNaN(appliedAt.getTime())) {
                console.error("Invalid applied_at date:", data.applied_at);
                return NextResponse.json({ error: "Invalid applied_at date format" }, { status: 400 });
            }
        } else {
            appliedAt = new Date();
        }

        console.log("Creating job application with data:", {
            userId: data.userId,
            jobTitle: data.jobTitle,
            company: data.company,
            position: data.position,
            status: data.status,
            link: data.link,
            applied_at: appliedAt,
        });

        // Create the job application
        const newApplication = await prisma.job_application.create({
            data: {
                userId: data.userId,
                jobTitle: data.jobTitle,
                company: data.company,
                position: data.position,
                status: data.status as "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED",
                link: data.link,
                applied_at: appliedAt,
            },
        });

        console.log("Job application created:", newApplication);
        return NextResponse.json(newApplication, { status: 201 });
    } catch (error) {
        console.error("Error creating job application:", error);
        return NextResponse.json({ error: "Failed to create job application", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(request: NextRequest) {
    const data = await request.json();

    try {
        // Create Supabase client with automatic session handling
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!data.id) {
            return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
        }

        // Verify the application belongs to the user
        const application = await prisma.job_application.findUnique({
            where: { id: data.id },
            select: { userId: true },
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        if (application.userId !== user.id) {
            return NextResponse.json({ error: "Unauthorized to update this application" }, { status: 403 });
        }

        const updateData: Partial<{
            userId: string;
            jobTitle: string;
            company: string;
            position: string;
            status: string;
            link: string;
            applied_at: Date;
        }> = {};

        if (data.userId !== undefined) updateData.userId = data.userId;
        if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
        if (data.company !== undefined) updateData.company = data.company;
        if (data.position !== undefined) updateData.position = data.position;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.link !== undefined) updateData.link = data.link;
        if (data.applied_at !== undefined) updateData.applied_at = new Date(data.applied_at);

        const updatedApplication = await prisma.job_application.update({
            where: { id: data.id },
            data: updateData,
        });

        return NextResponse.json(updatedApplication, { status: 200 });
    } catch (error) {
        console.error("Error updating job application:", error);
        return NextResponse.json({ error: "Failed to update job application" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    try {
        // Create Supabase client with automatic session handling
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!id) {
            const body = await request.json();
            id = body.id;
        }

        if (!id) {
            return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
        }

        // Verify the application exists and belongs to the user
        const application = await prisma.job_application.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        if (application.userId !== user.id) {
            return NextResponse.json({ error: "Unauthorized to delete this application" }, { status: 403 });
        }

        await prisma.job_application.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Application deleted successfully", id }, { status: 200 });
    } catch (error) {
        console.error("Error deleting job application:", error);
        return NextResponse.json({ error: "Failed to delete job application" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}