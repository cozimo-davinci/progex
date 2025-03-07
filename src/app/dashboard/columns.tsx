"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { parseISO, format, isValid, parse } from "date-fns";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ApplicationForm from "./application-form";
import { toast } from "sonner";
import {
    Select as CustomSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type Application = {
    id: string;
    userId: string;
    jobTitle: string;
    company: string;
    position: string;
    status: "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED";
    link: string;
    applied_at: string | null;
    updated_at: string | null;
};

// Define the props for the ActionsCell component
interface ActionsCellProps {
    application: Application;
    setJobApplications: React.Dispatch<React.SetStateAction<Application[]>>;
}

const ActionsCell: React.FC<ActionsCellProps> = ({ application, setJobApplications }) => {
    const [isUpdateDialogOpen, setUpdateDialogOpen] = React.useState(false);
    const [isViewDialogOpen, setViewDialogOpen] = React.useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const handleUpdateApplication = async (updatedData: Partial<Application>) => {
        try {
            const response = await fetch(`/api/applications`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...updatedData, id: application.id }),
                credentials: "include",
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error("Session expired. Please sign in again.");
                    window.location.href = "/login";
                    return;
                }
                throw new Error("Failed to update application");
            }

            const updatedApplication: Application = await response.json();
            setUpdateDialogOpen(false);
            window.dispatchEvent(
                new CustomEvent("applicationUpdated", { detail: updatedApplication })
            );
            toast.success("Application updated successfully!");
        } catch (error) {
            console.error("Error updating application:", error);
            toast.error("Failed to update application");
        }
    };

    const handleDeleteApplication = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        setDeleteDialogOpen(false);
        setJobApplications((prev) => prev.filter((app) => app.id !== application.id));

        try {
            const response = await fetch(`/api/applications?id=${application.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (!response.ok) {
                if (response.status === 401) {
                    toast.error("Session expired. Please sign in again.");
                    window.location.href = "/login";
                    setJobApplications((prev) => [...prev, application]);
                    return;
                }
                if (response.status === 403) {
                    toast.error("You are not authorized to delete this application.");
                    setJobApplications((prev) => [...prev, application]);
                    return;
                }
                if (response.status === 404) {
                    toast.error("Application not found.");
                    setJobApplications((prev) => [...prev, application]);
                    return;
                }
                throw new Error("Failed to delete application");
            }
            toast.success("Application deleted successfully!");
            window.dispatchEvent(new CustomEvent("applicationDeleted", { detail: application.id }));
        } catch (err) {
            setJobApplications((prev) => [...prev, application]);
            console.error("Error deleting application:", err);
            toast.error("Failed to delete application");
        }
    };

    const handleMenuItemClick = (e: React.MouseEvent, action: "update" | "view") => {
        e.preventDefault();
        e.stopPropagation();
        if (action === "update") setUpdateDialogOpen(true);
        if (action === "view") setViewDialogOpen(true);
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(application.id);
        toast.success("Application ID copied to clipboard!");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleCopy}>Copy application ID</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, "update")}>
                    Update Application
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleMenuItemClick(e, "view")}>
                    View Application
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteApplication}>
                    Delete Application
                </DropdownMenuItem>
                <Dialog open={isUpdateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Application</DialogTitle>
                        </DialogHeader>
                        <ApplicationForm
                            initialData={application}
                            onUpdate={handleUpdateApplication}
                            onClose={() => setUpdateDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
                <Dialog open={isViewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm font-medium text-slate-100">
                                <span className="font-bold">Job Title:</span> {application.jobTitle}
                            </p>
                            <p className="text-sm font-medium text-slate-100">
                                <span className="font-bold">Company:</span> {application.company}
                            </p>
                            <p className="text-sm font-medium text-slate-100">
                                <span className="font-bold">Position:</span> {application.position}
                            </p>
                            <p className="text-sm font-medium text-slate-100">
                                <span className="font-bold">Status:</span>{" "}
                                {application.status === "IN_PROGRESS"
                                    ? "In Progress"
                                    : application.status === "PROCESSING"
                                        ? "Processing"
                                        : application.status === "APPROVED"
                                            ? "Approved"
                                            : application.status === "REJECTED"
                                                ? "Rejected"
                                                : "Unknown"}
                            </p>
                            <p className="text-sm font-medium text-slate-100">
                                <span className="font-bold">Link:</span>{" "}
                                <a
                                    href={application.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 underline hover:text-blue-700"
                                >
                                    Job Posting
                                </a>
                            </p>
                            <p className="text-sm font-medium text-slate-100">
                                <span className="font-bold">Applied At:</span>{" "}
                                {application.applied_at
                                    ? `${format(parseISO(application.applied_at), "MMMM d, yyyy")} at ${format(
                                        parseISO(application.applied_at),
                                        "h:mm a"
                                    )}`
                                    : "Not set"}
                            </p>
                            <p className="text-sm font-medium text-slate-100">
                                <span className="font-bold">Updated At:</span>{" "}
                                {application.updated_at
                                    ? `${format(parseISO(application.updated_at), "MMMM d, yyyy")} at ${format(
                                        parseISO(application.updated_at),
                                        "h:mm a"
                                    )}`
                                    : "Not set"}
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogContent>
                </Dialog>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-slate-100">
                            Are you sure you want to delete the application for {application.jobTitle} at {application.company}?
                        </p>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                Delete
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
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
        header: () => (
            <div className="text-slate-900 dark:text-neutral-300">Job Title</div>
        ),
    },
    {
        accessorKey: "company",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-slate-900 dark:text-neutral-300"
            >
                Company
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "position",
        header: () => (
            <div className="text-slate-900 dark:text-neutral-300">Position</div>
        ),
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="text-slate-900 dark:text-neutral-300"
            >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as Application["status"];
            const statusStyles = {
                IN_PROGRESS: "text-yellow-500 font-bold text-lg",
                PROCESSING: "text-blue-500 font-bold text-lg",
                APPROVED: "text-green-500 font-bold text-lg",
                REJECTED: "text-red-500 font-bold text-lg",
            };

            const statusOptions = [
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "PROCESSING", label: "Processing" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
            ];

            const handleStatusChange = async (newStatus: string) => {
                try {
                    const updatedData = { status: newStatus as Application["status"] };
                    const response = await fetch(`/api/applications`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...updatedData, id: row.original.id }),
                    });

                    if (!response.ok) {
                        throw new Error("Failed to update status");
                    }

                    const updatedApplication: Application = await response.json();
                    window.dispatchEvent(
                        new CustomEvent("applicationUpdated", { detail: updatedApplication })
                    );
                    toast.success("Status updated successfully!");
                } catch (error) {
                    console.error("Error updating status:", error);
                    toast.error("Failed to update status");
                }
            };

            return (
                <CustomSelect
                    value={status}
                    onValueChange={handleStatusChange}
                    className={`w-full text-start text-lg font-bold ${statusStyles[status] || ""}`}
                >
                    <SelectTrigger className="w-full bg-stone-800 dark:bg-black dark:border-white dark:border-2 border-black border-2 focus:ring-0">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="border-white">
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="dark:border-b-white dark:border-b-2">
                                <span className={statusStyles[option.value as Application["status"]] || ""}>
                                    {option.label}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </CustomSelect>
            );
        },
    },
    {
        accessorKey: "link",
        header: () => (
            <div className="text-slate-900 dark:text-neutral-300">Link</div>
        ),
        cell: ({ row }) => (
            <a
                href={row.original.link}
                target="_blank"
                rel="noopener noreferrer"
                className="dark:text-blue-500 underline dark:hover:text-blue-700 text-black hover:text-neutral-800"
                title={row.original.link}
            >
                Job Posting
            </a>
        ),
    },
    {
        accessorKey: "applied_at",
        header: () => (
            <div className="text-slate-900 dark:text-neutral-300">Applied At</div>
        ),
        cell: ({ row }) => {
            const date = row.original.applied_at ? parseISO(row.original.applied_at) : null;
            if (!date) return "Not set";
            const formattedDate = format(date, "MMMM d, yyyy");
            const formattedTime = format(date, "h:mm a");
            return `${formattedDate} at ${formattedTime}`;
        },
        filterFn: (row, columnId, filterValue) => {
            const rowDate = row.original.applied_at ? parseISO(row.original.applied_at) : null;
            if (!rowDate || !isValid(rowDate)) return false;

            // Parse the filter value as a date (from the date input, which returns YYYY-MM-DD)
            const filterDate = filterValue ? parse(filterValue, "yyyy-MM-dd", new Date()) : null;
            if (!filterDate || !isValid(filterDate)) return true; // Allow all if filter is invalid

            // Compare dates (ignore time for simplicity)
            return rowDate.toDateString() === filterDate.toDateString();
        },
    },
    {
        accessorKey: "updated_at",
        header: () => (
            <div className="text-slate-900 dark:text-neutral-300">Updated At</div>
        ),
        cell: ({ row }) => {
            const date = row.original.updated_at ? parseISO(row.original.updated_at) : null;
            if (!date) return "Not set";
            const formattedDate = format(date, "MMMM d, yyyy");
            const formattedTime = format(date, "h:mm a");
            return `${formattedDate} at ${formattedTime}`;
        },
    },
    {
        id: "actions",
        cell: ({ row, table }) => {
            const setJobApplications = (table.options.meta as Record<string, unknown>)?.setJobApplications as React.Dispatch<React.SetStateAction<Application[]>> | undefined;
            if (!setJobApplications) {
                console.error("setJobApplications is not provided to DataTable");
                return null;
            }
            return <ActionsCell application={row.original} setJobApplications={setJobApplications} />;
        },
    },
];