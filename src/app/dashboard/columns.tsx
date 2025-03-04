"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { parseISO, format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ApplicationForm from "./application-form"; // Adjust path based on your structure
import { toast } from "sonner";

export type Application = {
    id: string;
    jobTitle: string;
    company: string;
    position: string;
    status: "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED";
    link: string;
    applied_at: string;
    updated_at: string;
};

export const columns: ColumnDef<Application>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "jobTitle",
        header: "Job Title",
    },
    {
        accessorKey: "company",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Company
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "position",
        header: "Position",
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const status = row.getValue("status");
            const statusStyles = {
                IN_PROGRESS: "text-yellow-500",
                PROCESSING: "text-blue-500",
                APPROVED: "text-green-500",
                REJECTED: "text-red-500",
            };
            return (
                <div className={`text-center text-lg font-bold ${statusStyles[status as keyof typeof statusStyles] || ""}`}>
                    {status === "IN_PROGRESS"
                        ? "In Progress"
                        : status === "PROCESSING"
                            ? "Processing"
                            : status === "APPROVED"
                                ? "Approved"
                                : status === "REJECTED"
                                    ? "Rejected"
                                    : "Unknown"}
                </div>
            );
        },
    },
    {
        accessorKey: "link",
        header: "Link",
        cell: ({ row }) => (
            <a
                href={row.original.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-700"
            >
                {row.original.link}
            </a>
        ),
    },
    {
        accessorKey: "applied_at",
        header: "Applied At",
        cell: ({ row }) => {
            const date = parseISO(row.original.applied_at);
            const formattedDate = format(date, "MMMM d, yyyy");
            const formattedTime = format(date, "h:mm a");
            return `${formattedDate} at ${formattedTime}`;
        },
    },
    {
        accessorKey: "updated_at",
        header: "Updated At",
        cell: ({ row }) => {
            const date = parseISO(row.original.updated_at);
            const formattedDate = format(date, "MMMM d, yyyy");
            const formattedTime = format(date, "h:mm a");
            return `${formattedDate} at ${formattedTime}`;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const application = row.original;
            const [isDialogOpen, setIsDialogOpen] = React.useState(false);

            const handleUpdateApplication = async (updatedData: Partial<Application>) => {
                try {
                    const response = await fetch(`/api/applications`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...updatedData, id: application.id }),
                    });

                    if (!response.ok) {
                        throw new Error("Failed to update application");
                    }

                    const updatedApplication: Application = await response.json();
                    // toast.success("Application updated successfully!");
                    setIsDialogOpen(false); // Close dialog on success
                    window.dispatchEvent(new CustomEvent("applicationUpdated", { detail: updatedApplication }));
                } catch (error) {
                    console.error("Error updating application:", error);
                    toast.error("Failed to update application");
                }
            };

            // Prevent immediate closure by ensuring the dialog state is controlled
            const handleMenuItemClick = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDialogOpen(true);
            };

            const handleCopy = () => {
                navigator.clipboard.writeText(application.id),
                    toast.success("Application ID copied to clipboard!")
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={handleCopy}
                        >
                            Copy application ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleMenuItemClick}>
                            Update Application
                        </DropdownMenuItem>
                        <DropdownMenuItem>View company</DropdownMenuItem>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Update Application</DialogTitle>
                                </DialogHeader>
                                <ApplicationForm
                                    initialData={application}
                                    onUpdate={handleUpdateApplication}
                                    onClose={() => setIsDialogOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];