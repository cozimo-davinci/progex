import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// Initialize Prisma client
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

// Helper function to get Supabase client with the user's session
const getSupabaseClientWithSession = (request: NextRequest) => {
    const accessToken = request.cookies.get("supabase-auth-token")?.value;
    if (!accessToken) {
        throw new Error("No access token found");
    }

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!,
        {
            global: {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        }
    );
    return supabase;
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    try {
        // Authenticate user
        const supabase = getSupabaseClientWithSession(request);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const jobApplications = await prisma.jobApplication.findMany({
            where: { ...(userId ? { userId } : { userId: user.id }) }, // Only fetch applications for the authenticated user if userId isn't specified
            orderBy: { applied_at: "desc" },
        });
        return NextResponse.json(jobApplications, { status: 200 });
    } catch (error) {
        console.error("Error fetching job applications:", error);
        return NextResponse.json(
            { error: "Failed to fetch job applications" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    console.log("Received POST data:", data);

    try {
        // Authenticate user
        const supabase = getSupabaseClientWithSession(request);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Ensure the userId in the data matches the authenticated user
        if (data.userId !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized to create application for this user" },
                { status: 403 }
            );
        }

        const newApplication = await prisma.jobApplication.create({
            data: {
                userId: data.userId,
                jobTitle: data.jobTitle,
                company: data.company,
                position: data.position,
                status: data.status,
                link: data.link,
                applied_at: data.applied_at ? new Date(data.applied_at) : new Date(),
            },
        });
        return NextResponse.json(newApplication, { status: 201 });
    } catch (error) {
        console.error("Error creating job application:", error);
        return NextResponse.json(
            { error: "Failed to create job application" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(request: NextRequest) {
    const data = await request.json();

    try {
        // Authenticate user
        const supabase = getSupabaseClientWithSession(request);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!data.id) {
            return NextResponse.json(
                { error: "Application ID is required" },
                { status: 400 }
            );
        }

        // Verify the application belongs to the user
        const application = await prisma.jobApplication.findUnique({
            where: { id: data.id },
            select: { userId: true },
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        if (application.userId !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized to update this application" },
                { status: 403 }
            );
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

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    try {
        // Authenticate user using the access token from cookies
        const supabase = getSupabaseClientWithSession(request);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!id) {
            const body = await request.json();
            id = body.id;
        }

        if (!id) {
            return NextResponse.json(
                { error: "Application ID is required" },
                { status: 400 }
            );
        }

        // Verify the application exists and belongs to the user
        const application = await prisma.jobApplication.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        if (application.userId !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized to delete this application" },
                { status: 403 }
            );
        }

        await prisma.jobApplication.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Application deleted successfully", id },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting job application:", error);
        return NextResponse.json(
            { error: "Failed to delete job application" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}