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
import URLForm from "./url-form";

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
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
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

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 text-white">Dashboard</h1>
            <div className="flex justify-start gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
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
                                onClose={() => setIsAddDialogOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
                <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                        >
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
            </div>
            <DataTable
                columns={columns}
                data={jobApplications}
                // Pass setJobApplications via meta
                meta={{
                    setJobApplications,
                }}
            />
        </div>
    );
};

export default Dashboard;