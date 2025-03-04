"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type Application = {
    id: string;
    userId: string;
    jobTitle: string;
    company: string;
    position: string;
    status: "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED";
    link: string;
    applied_at: string;
    updated_at: string;
};

interface ApplicationFormProps {
    initialData?: Partial<Application>; // Optional initial data for updates
    userId?: string; // Optional for new applications
    onUpdate?: (data: Partial<Application>) => void; // Callback for updates
    onApplicationAdded?: (newApplication: Application) => void; // Callback for new applications
    onClose: () => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
    initialData,
    userId,
    onUpdate,
    onApplicationAdded,
    onClose,
}) => {
    const [formData, setFormData] = useState<Partial<Application>>(
        initialData || {
            jobTitle: "",
            company: "",
            position: "",
            status: "IN_PROGRESS",
            link: "",
        }
    );

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            status: value as "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED",
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (onUpdate && initialData?.id) {
                // Update existing application
                await onUpdate(formData);
            } else if (onApplicationAdded && userId) {
                // Add new application (via Supabase or another endpoint)
                const response = await fetch("/api/applications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...formData, userId }),
                });

                if (!response.ok) throw new Error("Failed to add application");
                const data: Application = await response.json();
                onApplicationAdded(data);
            }

            onClose();
            if (initialData?.id) {
                toast.success("Application updated successfully!");
            } else {
                toast.success("Application added successfully!");
            }
            // toast.success("Action completed successfully!");
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to complete action");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                name="jobTitle"
                value={formData.jobTitle || ""}
                onChange={handleInputChange}
                placeholder="Job Title"
                required
            />
            <Input
                name="company"
                value={formData.company || ""}
                onChange={handleInputChange}
                placeholder="Company"
                required
            />
            <Input
                name="position"
                value={formData.position || ""}
                onChange={handleInputChange}
                placeholder="Position"
                required
            />
            <Select
                value={formData.status || "IN_PROGRESS"}
                onValueChange={handleSelectChange}
            >
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
                value={formData.link || ""}
                onChange={handleInputChange}
                placeholder="Link"
                required
            />
            <Button type="submit" className="w-full">
                {initialData?.id ? "Update Application" : "Add Application"}
            </Button>
        </form>
    );
};

export default ApplicationForm;