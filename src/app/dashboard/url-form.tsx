"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    applied_at: string | null;
    updated_at: string | null;
};

interface URLFormProps {
    userId: string;
    onApplicationAdded: (newApplication: Application) => void;
    onClose: () => void;
}

const URLForm: React.FC<URLFormProps> = ({ userId, onApplicationAdded, onClose }) => {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Send the URL to the Grok API endpoint
            const grokResponse = await fetch("/api/grok", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!grokResponse.ok) {
                throw new Error("Failed to parse URL with Grok API");
            }

            const parsedData = await grokResponse.json();

            // Construct the application data with parsed fields
            const applicationData = {
                ...parsedData,
                userId,
                status: "IN_PROGRESS" as const, // Default status
                applied_at: new Date().toISOString(), // Current time for AI-assisted application
            };

            // Save the application to the database
            const saveResponse = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(applicationData),
            });

            if (!saveResponse.ok) {
                throw new Error("Failed to save application");
            }

            const newApplication: Application = await saveResponse.json();
            onApplicationAdded(newApplication); // Update the Dashboard UI
            onClose(); // Close the dialog
            toast.success("Application added successfully!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL"
                    required
                />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Submit"}
            </Button>
        </form>
    );
};

export default URLForm;