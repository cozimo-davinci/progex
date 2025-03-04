"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "../../../supabaseClient";
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

// Define the Application type (consistent with columns file)
interface Application {
    id: string;
    userId: string;
    jobTitle: string;
    company: string;
    position: string;
    status: "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED";
    link: string;
    applied_at: string;
    updated_at: string;
}

const Dashboard = () => {
    const [jobApplications, setJobApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createSupabaseClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    router.push("/login");
                    return;
                }

                const userId = session.user.id;
                setUserId(userId);

                const response = await fetch(`/api/applications?userId=${userId}`);
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

        // Listen for application updates
        const handleApplicationUpdated = (event: Event) => {
            const updatedApplication = (event as CustomEvent).detail as Application;
            setJobApplications((prev) =>
                prev.map((app) =>
                    app.id === updatedApplication.id ? updatedApplication : app
                )
            );
        };

        window.addEventListener("applicationUpdated", handleApplicationUpdated);
        return () => window.removeEventListener("applicationUpdated", handleApplicationUpdated);
    }, [router]);

    // Callback to update jobApplications when a new one is added
    const handleApplicationAdded = (newApplication: Application) => {
        setJobApplications((prev) => [...prev, newApplication]);
    };

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 text-white">Dashboard</h1>
            <div className="flex justify-start">
                <div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="text-white border-white border-2 rounded-md mb-4 hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                            >
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
                                    onClose={() => setIsDialogOpen(false)}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="ml-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="text-white border-white border-2 rounded-md mb-4 hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                            >
                                AI Application
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
                                    onClose={() => setIsDialogOpen(false)}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

            </div>
            <DataTable columns={columns} data={jobApplications} />
        </div>
    );
};

export default Dashboard;