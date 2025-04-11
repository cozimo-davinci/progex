import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Extend the global object to include prisma
declare global {
    var prisma: PrismaClient | undefined;
}

// Initialize Prisma client
const prisma = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") globalThis.prisma = prisma;

(async () => {
    try {
        await prisma.$connect();
        console.log("Prisma client connected to database");
    } catch (error) {
        console.error("Prisma client failed to connect:", error);
    }
})();

// Define the shape of an application object
interface ApplicationInput {
    userId: string;
    jobTitle: string;
    company: string;
    position: string;
    status: "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED";
    link: string;
    applied_at?: string | null;
    updated_at?: string | null;
}

export async function POST(request: NextRequest) {
    try {
        // Create Supabase client with automatic session handling
        const supabase = createRouteHandlerClient({ cookies });
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { applications } = await request.json();

        if (!Array.isArray(applications) || applications.length === 0) {
            return NextResponse.json({ error: "No applications provided" }, { status: 400 });
        }

        // Validate and prepare the applications
        const validStatuses = ["IN_PROGRESS", "PROCESSING", "APPROVED", "REJECTED"];
        const requiredFields: (keyof ApplicationInput)[] = [
            "userId",
            "jobTitle",
            "company",
            "position",
            "status",
            "link",
        ];

        const validatedApplications = applications.map((app: ApplicationInput) => {
            // Ensure the userId matches the authenticated user
            if (app.userId !== user.id) {
                throw new Error(`Unauthorized to create application for user ${app.userId}`);
            }

            // Validate required fields
            for (const field of requiredFields) {
                if (!app[field] || typeof app[field] !== "string") {
                    throw new Error(
                        `Validation failed: ${field} is required and must be a string`
                    );
                }
            }

            // Validate status
            if (!validStatuses.includes(app.status)) {
                throw new Error(
                    `Invalid status: must be one of ${validStatuses.join(", ")}`
                );
            }

            // Validate and parse dates
            let appliedAt: Date | undefined;
            let updatedAt: Date | undefined;

            if (app.applied_at) {
                appliedAt = new Date(app.applied_at);
                if (isNaN(appliedAt.getTime())) {
                    throw new Error(
                        `Invalid applied_at date format for application: ${app.jobTitle}. Received: ${app.applied_at}`
                    );
                }
            }

            if (app.updated_at) {
                updatedAt = new Date(app.updated_at);
                if (isNaN(updatedAt.getTime())) {
                    throw new Error(
                        `Invalid updated_at date format for application: ${app.jobTitle}. Received: ${app.updated_at}`
                    );
                }
            }

            return {
                userId: app.userId,
                jobTitle: app.jobTitle,
                company: app.company,
                position: app.position,
                status: app.status,
                link: app.link,
                applied_at: appliedAt,
                updated_at: updatedAt,
            };
        });

        // Bulk insert the applications
        await prisma.job_application.createMany({
            data: validatedApplications,
            skipDuplicates: true, // Prisma will skip duplicates based on unique constraints (if any)
        });

        // Fetch the inserted applications to return them (createMany doesn't return the inserted records)
        const newApplications = await prisma.job_application.findMany({
            where: {
                userId: user.id,
                link: { in: validatedApplications.map((app) => app.link) },
            },
        });

        return NextResponse.json(newApplications, { status: 201 });
    } catch (error) {
        console.error("Error importing job applications:", error);
        return NextResponse.json(
            {
                error: "Failed to import job applications",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}