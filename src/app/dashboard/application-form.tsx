"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Calendar,
} from "@/components/ui/calendar";
import { cn } from "../../components/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export type Application = {
    id: string;
    userId: string;
    jobTitle: string;
    company: string;
    position: string;
    status: "IN_PROGRESS" | "PROCESSING" | "APPROVED" | "REJECTED";
    link: string;
    applied_at: string | null; // Updated to allow null
    updated_at: string | null;
};

interface ApplicationFormProps {
    initialData?: Partial<Application>;
    userId?: string;
    onUpdate?: (data: Partial<Application>) => void;
    onApplicationAdded?: (newApplication: Application) => void;
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
            applied_at: null,
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

    const handleDateChange = (date: Date | undefined) => {
        setFormData((prev) => ({
            ...prev,
            applied_at: date ? date.toISOString() : null,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (onUpdate && initialData?.id) {
                await onUpdate(formData);
            } else if (onApplicationAdded && userId) {
                const submissionData = {
                    ...formData,
                    userId,
                    applied_at: formData.applied_at || new Date().toISOString(), // Default to current time if not set
                };
                const response = await fetch("/api/applications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(submissionData),
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
            <Select value={formData.status || "IN_PROGRESS"} onValueChange={handleSelectChange}>
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
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.applied_at && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.applied_at
                            ? format(new Date(formData.applied_at), "PPP")
                            : "Pick a date"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={formData.applied_at ? new Date(formData.applied_at) : undefined}
                        onSelect={handleDateChange}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <Button type="submit" className="w-full">
                {initialData?.id ? "Update Application" : "Add Application"}
            </Button>
        </form>
    );
};

export default ApplicationForm;