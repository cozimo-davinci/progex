import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createSupabaseClient } from "@/app/lib/utils/supabase/client";
import { cookies } from "next/headers";

// Initialize Prisma client
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

// Connect Prisma client once during server startup
(async () => {
    try {
        await prisma.$connect();
        console.log("Prisma client connected to database");
    } catch (error) {
        console.error("Prisma client failed to connect:", error);
        process.exit(1); // Exit if Prisma fails to connect
    }
})();

// Utility function to authenticate the user using the session cookie
const authenticateUser = async () => {
    const cookieStore = await cookies(); // Await cookies()
    const sessionCookie = cookieStore.get("sb-auth-session")?.value;

    if (!sessionCookie) {
        throw new Error("No session cookie found");
    }

    let sessionData;
    try {
        sessionData = JSON.parse(sessionCookie);
    } catch (error) {
        console.error("Failed to parse session cookie:", error);
        throw new Error("Invalid session cookie format");
    }

    if (!sessionData.access_token) {
        throw new Error("Access token missing in session data");
    }

    // Create Supabase client
    const supabase = createSupabaseClient();

    // Check if the session has expired
    if (sessionData.expires_at && Date.now() >= sessionData.expires_at * 1000) {
        console.log("Session expired, attempting to refresh...");

        if (!sessionData.refresh_token) {
            throw new Error("Refresh token missing in session data");
        }

        // Refresh the session using the refresh token
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: sessionData.refresh_token,
        });

        if (refreshError || !refreshedSession || !refreshedSession.session) {
            console.error("Failed to refresh session:", refreshError?.message || "No session returned");
            throw new Error("Failed to refresh session");
        }

        // Update the session data with the new tokens
        sessionData = {
            access_token: refreshedSession.session.access_token,
            refresh_token: refreshedSession.session.refresh_token,
            expires_at: refreshedSession.session.expires_at,
            expires_in: refreshedSession.session.expires_in,
        };

        // Update the cookie with the new session data
        cookieStore.set("sb-auth-session", JSON.stringify(sessionData), {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 3 * 60 * 60, // 3 hours in seconds
        });

        console.log("Session refreshed successfully:", sessionData);
    }

    // Set the session using the access token (either original or refreshed)
    const { error: setSessionError } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token || "",
    });

    if (setSessionError) {
        console.error("Failed to set session:", setSessionError.message);
        throw new Error("Failed to authenticate session");
    }

    // Get the authenticated user
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
        console.error("Failed to get user:", getUserError?.message || "No user found");
        throw new Error("Unauthorized");
    }

    return user;
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    try {
        // Authenticate the user
        const user = await authenticateUser();

        const jobApplications = await prisma.job_application.findMany({
            where: { ...(userId ? { userId } : { userId: user.id }) },
            orderBy: { applied_at: "desc" },
        });
        return NextResponse.json(jobApplications, { status: 200 });
    } catch (error) {
        console.error("Error fetching job applications:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch job applications";
        return NextResponse.json({ error: errorMessage }, { status: errorMessage === "Unauthorized" ? 401 : 500 });
    }
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    console.log("Received POST data:", data);

    try {
        // Authenticate the user
        const user = await authenticateUser();

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
        const errorMessage = error instanceof Error ? error.message : "Failed to create job application";
        return NextResponse.json(
            { error: errorMessage, details: error instanceof Error ? error.message : "Unknown error" },
            { status: errorMessage === "Unauthorized" ? 401 : 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    const data = await request.json();

    try {
        // Authenticate the user
        const user = await authenticateUser();

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
        const errorMessage = error instanceof Error ? error.message : "Failed to update job application";
        return NextResponse.json({ error: errorMessage }, { status: errorMessage === "Unauthorized" ? 401 : 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    try {
        // Authenticate the user
        const user = await authenticateUser();

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
        const errorMessage = error instanceof Error ? error.message : "Failed to delete job application";
        return NextResponse.json({ error: errorMessage }, { status: errorMessage === "Unauthorized" ? 401 : 500 });
    }
}

// Ensure Prisma disconnects when the server shuts down
process.on("beforeExit", async () => {
    await prisma.$disconnect();
    console.log("Prisma client disconnected from database");
});