"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "../../../supabaseClient";
import { DataTable } from "./data-table";
import { columns } from "./columns";
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
                setUserId(userId); // Store userId for the form

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
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

            {/* Render the ApplicationForm if userId is available */}
            {userId && (
                <ApplicationForm userId={userId} onApplicationAdded={handleApplicationAdded} />
            )}

            {/* Render the DataTable */}
            <DataTable columns={columns} data={jobApplications} />
        </div>
    );
};

export default Dashboard;