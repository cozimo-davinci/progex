"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Application = {
    id: string;
    jobTitle: string;
    company: string;
    position: string;
    status: "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED"; // Use string literals matching the enum
    link: string;
    applied_at: string;
    updated_at: string;
};

export const columns: ColumnDef<Application>[] = [
    {
        accessorKey: "jobTitle",
        header: "Job Title",
    },
    {
        accessorKey: "company",
        header: "Company",
    },
    {
        accessorKey: "position",
        header: "Position",
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        accessorKey: "link",
        header: "Link",
    },
    {
        accessorKey: "applied_at",
        header: "Applied At",
    },
    {
        accessorKey: "updated_at",
        header: "Updated At",
    },
];