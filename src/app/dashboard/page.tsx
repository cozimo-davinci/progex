"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "../lib/utils/supabase/client";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import ApplicationForm from "./application-form";
import URLForm from "./url-form";
import { toast } from "sonner";
import Papa from "papaparse";
import { format, parse } from "date-fns";
import { X } from "lucide-react";

interface Application {
    id: string;
    userId: string;
    jobTitle: string;
    company: string;
    position: string;
    status: "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED";
    link: string;
    applied_at: string | null;
    updated_at: string | null;
}

const Dashboard = () => {
    const [jobApplications, setJobApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const supabase = createSupabaseClient();

    useEffect(() => {
        const fetchData = async () => {
            const sessionString = localStorage.getItem('sb-auth-session');
            if (!sessionString) {
                toast.error("Session not detected!", { description: "Please log in." });
                router.push("/login");
                setSessionLoading(false);
                return;
            }

            const sessionData = JSON.parse(sessionString);
            const currentTime = Math.floor(Date.now() / 1000);

            const supabase = createSupabaseClient();

            // Refresh session if expired
            if (currentTime >= sessionData.expires_at) {
                const { data: refreshedSession, error } = await supabase.auth.refreshSession({
                    refresh_token: sessionData.refresh_token,
                });

                if (error || !refreshedSession.session) {
                    localStorage.removeItem('sb-auth-session');
                    toast.error("Session expired!", { description: "Please log in again." });
                    router.push("/login");
                    setSessionLoading(false);
                    return;
                }

                const newSessionData = {
                    access_token: refreshedSession.session.access_token,
                    refresh_token: refreshedSession.session.refresh_token,
                    expires_at: refreshedSession.session.expires_at,
                    expires_in: refreshedSession.session.expires_in,
                };

                localStorage.setItem('sb-auth-session', JSON.stringify(newSessionData));
                await supabase.auth.setSession({
                    access_token: newSessionData.access_token,
                    refresh_token: newSessionData.refresh_token,
                });
            } else {
                await supabase.auth.setSession({
                    access_token: sessionData.access_token,
                    refresh_token: sessionData.refresh_token,
                });
            }

            const { data: { session } } = await supabase.auth.getSession();
            setSessionLoading(false);

            if (!session) {
                toast.error("Session not detected!", { description: "Please log in." });
                router.push("/login");
                return;
            }

            const userId = session.user.id;
            setUserId(userId);

            try {
                const response = await fetch(`/api/applications?userId=${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch job applications");
                }
                const data: Application[] = await response.json();
                setJobApplications(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const handleApplicationUpdated = (event: Event) => {
            const updatedApplication = (event as CustomEvent).detail as Application;
            setJobApplications((prev) =>
                prev.map((app) =>
                    app.id === updatedApplication.id ? updatedApplication : app
                )
            );
        };

        const handleApplicationDeleted = (event: Event) => {
            const deletedApplicationId = (event as CustomEvent).detail as string;
            setJobApplications((prev) => prev.filter((app) => app.id !== deletedApplicationId));
        };

        window.addEventListener("applicationUpdated", handleApplicationUpdated);
        window.addEventListener("applicationDeleted", handleApplicationDeleted);

        return () => {
            window.removeEventListener("applicationUpdated", handleApplicationUpdated);
            window.removeEventListener("applicationDeleted", handleApplicationDeleted);
        };
    }, [router]);

    const handleApplicationAdded = (newApplication: Application) => {
        setJobApplications((prev) => [...prev, newApplication]);
    };

    const handleFileChange = (file: File | null) => {
        if (file) {
            if (file.type === "text/csv") {
                setCsvFile(file);
            } else {
                toast.error("Please upload a valid CSV file.");
                setCsvFile(null);
            }
        } else {
            setCsvFile(null);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        handleFileChange(file);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0] || null;
        handleFileChange(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleRemoveFile = () => {
        setCsvFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleAreaClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const standardizeDate = (dateStr: string): string | null => {
        const possibleFormats = [
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss.SSS",
            "MM/dd/yyyy",
            "dd/MM/yyyy",
            "yyyy-MM-dd",
            "MM-dd-yyyy",
            "dd-MM-yyyy",
            "MMM dd, yyyy",
        ];

        for (const formatStr of possibleFormats) {
            try {
                const parsedDate = parse(dateStr, formatStr, new Date());
                if (!isNaN(parsedDate.getTime())) {
                    return format(parsedDate, "yyyy-MM-dd");
                }
            } catch (error) {
                console.log(`Failed to parse date with format ${formatStr}:`, error);
                continue;
            }
        }

        return null;
    };

    const handleImportCSV = async () => {
        if (!csvFile || !userId) {
            toast.error("Please select a CSV file to import.");
            return;
        }

        setImportLoading(true);

        try {
            const parsedData = await new Promise<any[]>((resolve, reject) => {
                Papa.parse(csvFile, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => resolve(result.data),
                    error: (error) => reject(error),
                });
            });

            const expectedColumns = [
                "jobTitle",
                "company",
                "position",
                "status",
                "link",
                "applied_at",
                "updated_at",
            ];

            const csvColumns = Object.keys(parsedData[0] || {});
            const missingColumns = expectedColumns.filter((col) => !csvColumns.includes(col));
            if (missingColumns.length > 0) {
                toast.error(`Missing required columns: ${missingColumns.join(", ")}`);
                setImportLoading(false);
                return;
            }

            const seenLinks = new Set<string>();
            const seenPositionCompany = new Set<string>();
            const duplicatesInCSV: any[] = [];
            const uniqueApplications: Application[] = [];

            for (const row of parsedData) {
                const link = row.link?.trim();
                const positionCompany = `${row.position?.trim()}|${row.company?.trim()}`.toLowerCase();

                if (seenLinks.has(link)) {
                    duplicatesInCSV.push(row);
                    continue;
                }
                if (seenPositionCompany.has(positionCompany)) {
                    duplicatesInCSV.push(row);
                    continue;
                }

                seenLinks.add(link);
                seenPositionCompany.add(positionCompany);

                const appliedAt = row.applied_at ? standardizeDate(row.applied_at) : null;
                const updatedAt = row.updated_at ? standardizeDate(row.updated_at) : null;

                if (row.applied_at && !appliedAt) {
                    toast.warning(`Invalid date format for applied_at in row: ${row.jobTitle}`);
                    continue;
                }
                if (row.updated_at && !updatedAt) {
                    toast.warning(`Invalid date format for updated_at in row: ${row.jobTitle}`);
                    continue;
                }

                const validStatuses = ["IN_PROGRESS", "PROCESSING", "APPROVED", "REJECTED"];
                if (!validStatuses.includes(row.status)) {
                    toast.warning(`Invalid status in row: ${row.jobTitle}. Status must be one of ${validStatuses.join(", ")}`);
                    continue;
                }

                uniqueApplications.push({
                    id: "",
                    userId,
                    jobTitle: row.jobTitle?.trim(),
                    company: row.company?.trim(),
                    position: row.position?.trim(),
                    status: row.status as "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED",
                    link,
                    applied_at: appliedAt,
                    updated_at: updatedAt,
                });
            }

            if (duplicatesInCSV.length > 0) {
                toast.warning(`${duplicatesInCSV.length} duplicate entries found in the CSV and skipped.`);
            }

            // Refresh the session before making API calls
            const sessionString = localStorage.getItem('sb-auth-session');
            if (!sessionString) {
                toast.error("Session not detected!", { description: "Please log in." });
                router.push("/login");
                setImportLoading(false);
                return;
            }

            const sessionData = JSON.parse(sessionString);
            const currentTime = Math.floor(Date.now() / 1000);
            let accessToken = sessionData.access_token;

            if (currentTime >= sessionData.expires_at) {
                const { data: refreshedSession, error } = await supabase.auth.refreshSession({
                    refresh_token: sessionData.refresh_token,
                });

                if (error || !refreshedSession.session) {
                    localStorage.removeItem('sb-auth-session');
                    toast.error("Session expired!", { description: "Please log in again." });
                    router.push("/login");
                    setImportLoading(false);
                    return;
                }

                const newSessionData = {
                    access_token: refreshedSession.session.access_token,
                    refresh_token: refreshedSession.session.refresh_token,
                    expires_at: refreshedSession.session.expires_at,
                    expires_in: refreshedSession.session.expires_in,
                };

                localStorage.setItem('sb-auth-session', JSON.stringify(newSessionData));
                accessToken = newSessionData.access_token;
            }

            const existingApplications = await fetch(`/api/applications?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }).then((res) => res.json());
            const existingLinks = new Set(existingApplications.map((app: Application) => app.link));
            const existingPositionCompany = new Set(
                existingApplications.map((app: Application) =>
                    `${app.position}|${app.company}`.toLowerCase()
                )
            );

            const applicationsToInsert = uniqueApplications.filter((app) => {
                const positionCompany = `${app.position}|${app.company}`.toLowerCase();
                return !existingLinks.has(app.link) && !existingPositionCompany.has(positionCompany);
            });

            const skippedDueToExisting = uniqueApplications.length - applicationsToInsert.length;

            if (applicationsToInsert.length === 0) {
                toast.error(`No new applications to import after duplicate checks. ${skippedDueToExisting} applications were skipped because they already exist in the database.`);
                setImportLoading(false);
                return;
            }

            const response = await fetch("/api/applications/bulk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ applications: applicationsToInsert }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to import applications");
            }

            const newApplications = await response.json();
            setJobApplications((prev) => [...prev, ...newApplications]);
            toast.success(`${newApplications.length} applications imported successfully!`);
            setIsImportDialogOpen(false);
            setCsvFile(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred while importing the CSV.");
        } finally {
            setImportLoading(false);
        }
    };

    if (sessionLoading) {
        return <div className="p-4">Loading session...</div>;
    }

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    return (
        <div className="p-4 mt-16">
            <h1 className="text-2xl font-bold mb-4 text-white">Dashboard</h1>
            <div className="flex justify-start gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500">
                            Add Application
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Application</DialogTitle>
                        </DialogHeader>
                        {userId && (
                            <ApplicationForm
                                userId={userId}
                                onApplicationAdded={handleApplicationAdded}
                                onClose={() => setIsAddDialogOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
                <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500">
                            AI Application
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>AI Application</DialogTitle>
                        </DialogHeader>
                        {userId && (
                            <URLForm
                                userId={userId}
                                onApplicationAdded={handleApplicationAdded}
                                onClose={() => setIsAIDialogOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import Job Applications from CSV</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2 mb-2">
                            <div
                                className={`relative flex flex-col items-center 
                                    justify-center border-4 border-dashed border-gray-500 rounded-xl
                                     p-6 py-28 transition-colors ${isDragging ? "bg-gray-800" : "bg-black"}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={handleAreaClick}
                            >
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleInputChange}
                                    className="hidden"
                                    ref={fileInputRef}
                                />
                                <p className="text-center text-white font-semibold">
                                    Drag & Drop your CSV file here or Click to select
                                </p>
                            </div>

                            {csvFile && (
                                <div className="flex justify-center">
                                    <div className="relative bg-gray-800 border border-gray-300 rounded-2xl 
                                     py-1 shadow-sm flex items-center justify-center text-center gap-2 w-2/3 h-36">
                                        <span className="text-white font-bold truncate">{csvFile.name}</span>
                                        <button
                                            onClick={handleRemoveFile}
                                            className="text-red-500 font-bold bg-black rounded-lg hover:text-red-600"
                                            aria-label="Remove file"
                                        >
                                            <X className="h-7 w-7 hover:bg-gray-400 rounded-lg" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={handleImportCSV}
                                disabled={importLoading || !csvFile}
                                className="w-full"
                            >
                                {importLoading ? "Importing..." : "Import CSV"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <DataTable
                columns={columns}
                data={jobApplications}
                meta={{
                    setJobApplications,
                }}
                onImportCSV={() => setIsImportDialogOpen(true)}
            />
        </div>
    );
};

export default Dashboard;