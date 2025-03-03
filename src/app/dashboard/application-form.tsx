"use client";

import React, { useState } from "react";
import { createSupabaseClient } from "../../../supabaseClient";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Optional: for success/error notifications

// Define the Application type
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

interface ApplicationFormProps {
    userId: string;
    onApplicationAdded: (newApplication: Application) => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ userId, onApplicationAdded }) => {
    const [newApplication, setNewApplication] = useState({
        jobTitle: "",
        company: "",
        position: "",
        status: "IN_PROGRESS" as const,
        link: "",
    });

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewApplication((prev) => ({ ...prev, [name]: value }));
    };

    // Handle select changes
    const handleSelectChange = (value: string) => {
        setNewApplication((prev) => ({
            ...prev,
            status: value as "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED",
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const supabase = createSupabaseClient();
            const { data, error } = await supabase
                .from("JobApplication")
                .insert([
                    {
                        userId,
                        jobTitle: newApplication.jobTitle,
                        company: newApplication.company,
                        position: newApplication.position,
                        status: newApplication.status,
                        link: newApplication.link,
                    },
                ])
                .select();

            if (error) throw error;

            // Pass the new application to the parent component
            onApplicationAdded(data![0] as Application);

            // Reset the form
            setNewApplication({
                jobTitle: "",
                company: "",
                position: "",
                status: "IN_PROGRESS",
                link: "",
            });

            // Optional: Show success notification
            toast.success("Application added successfully!");
        } catch (err) {
            console.error("Error adding application:", err);
            toast.error("Failed to add application"); // Optional: Error notification
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <Input
                name="jobTitle"
                value={newApplication.jobTitle}
                onChange={handleInputChange}
                placeholder="Job Title"
                required
            />
            <Input
                name="company"
                value={newApplication.company}
                onChange={handleInputChange}
                placeholder="Company"
                required
            />
            <Input
                name="position"
                value={newApplication.position}
                onChange={handleInputChange}
                placeholder="Position"
                required
            />
            <Select value={newApplication.status} onValueChange={handleSelectChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
            </Select>
            <Input
                name="link"
                value={newApplication.link}
                onChange={handleInputChange}
                placeholder="Link"
                required
            />
            <Button type="submit" className="w-full">
                Add Application
            </Button>
        </form>
    );
};

export default ApplicationForm;