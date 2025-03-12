"use client";
import React, { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import debounce from "lodash/debounce";
import TipTapEditor from "@components/ui/TipTapEditor";



interface JobApplication {
    resumeKey: string;
    tailoredResumeKey: string;
    coverLetterKey: string;
    jobDescription: string;
    tailoredResumeContent: string;
    coverLetterContent: string;
    originalResumeUrl?: string; // Signed URL for original resume
}

const ResumeTutor = () => {
    const [resumeKey, setResumeKey] = useState<string | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [prompt, setPrompt] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [selectedApplication, setSelectedApplication] = useState<string | null>(null);

    // Debounced save function
    const saveContent = async (key: string, content: string) => {
        try {
            const response = await fetch("/api/editor-saves", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, content }),
            });
            if (!response.ok) {
                toast.error("Failed to save content");
                throw new Error('Failed to save content to S3');
            }
            console.log('Content saved successfully:', key);
            toast.success("Content saved successfully");
        } catch (error) {
            console.error("Error saving content:", error);
            // Optionally notify the user (e.g., with a toast)
            toast.error("Error saving content");
        }
    };
    const saveContentDebounced = useMemo(() => debounce(saveContent, 3000), []);

    // Handle resume upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                const { key } = await response.json();
                setResumeKey(key);
                // Optionally fetch a signed URL for the original resume
                const signedUrlRes = await fetch(`/api/get-signed-url?key=${key}`);
                const { url } = await signedUrlRes.json();
                setApplications(prev => [...prev, {
                    resumeKey: key,
                    tailoredResumeKey: '',
                    coverLetterKey: '',
                    jobDescription: '',
                    tailoredResumeContent: '',
                    coverLetterContent: '',
                    originalResumeUrl: url,
                }]);
                setSelectedApplication(key);
            } else {
                console.error("Failed to upload resume");
            }
        } catch (error) {
            console.error("Error uploading resume:", error);
        }
    };

    // Handle AI processing
    const handleReceiveSuggestions = async () => {
        if (!resumeKey || !jobDescription) {
            alert("Please upload a resume and provide a job description");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch("/api/ai-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeKey, jobDescription, prompt }),
            });
            if (response.ok) {
                const { resumeKey: returnedResumeKey, tailoredResumeKey, coverLetterKey } = await response.json();

                // Fetch content for display
                const resumeRes = await fetch(`/api/s3-content?key=${tailoredResumeKey}`);
                const { content: resumeContent } = await resumeRes.json();
                const coverRes = await fetch(`/api/s3-content?key=${coverLetterKey}`);
                const { content: coverContent } = await coverRes.json();

                // Update the application
                setApplications(prev => {
                    const updated = prev.map(app =>
                        app.resumeKey === returnedResumeKey
                            ? {
                                ...app,
                                tailoredResumeKey,
                                coverLetterKey,
                                jobDescription,
                                tailoredResumeContent: resumeContent || '',
                                coverLetterContent: coverContent || ''
                            }
                            : app
                    );
                    return updated;
                });
                setSelectedApplication(returnedResumeKey);
            } else {
                console.error("Failed to generate documents");
            }
        } catch (error) {
            console.error("Error generating documents:", error);
        } finally {
            setIsProcessing(false);
            setJobDescription(""); // Reset for next application
            setPrompt("");
        }
    };

    // New endpoint to get signed URL (add this to backend if needed)
    const currentApp = applications.find(app => app.resumeKey === selectedApplication);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 rounded-lg relative border-t-4 dark:border-t-yellow-500 border-t-black" style={{ backgroundImage: "url('/images/resume-background-picture.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>
            <div className="relative z-10 w-full max-w-lg">
                <h1 className="text-3xl dark:text-white text-white text-center font-bold">Welcome to Resume Tutor</h1>

                {/* Resume Upload */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="resume-upload" className="font-bold mb-4 block dark:text-white text-white">Upload Your Resume</Label>
                    <Input id="resume-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                    <p className="text-sm text-muted-foreground text-center mt-2"><span className="font-bold">Note:</span> Supported formats: PDF, DOC, DOCX.</p>
                </div>

                {/* Job Description */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="job-desc" className="font-bold mb-4 block dark:text-white text-white">Job Description</Label>
                    <Textarea id="job-desc" placeholder="Paste job description here." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
                </div>

                {/* Prompt */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="prompt" className="font-bold mb-4 block dark:text-white text-white">Prompt</Label>
                    <Input id="prompt" placeholder="E.g., Tailor my resume based on the job description." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                </div>

                {/* Button */}
                <Button className="mt-4" onClick={handleReceiveSuggestions} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Receive Suggestions"}
                </Button>

                {/* Application Selection */}
                {applications.length > 0 && (
                    <div className="mt-10">
                        <Label className="font-bold mb-4 block dark:text-white text-white">Select Application</Label>
                        <select
                            value={selectedApplication || ''}
                            onChange={(e) => setSelectedApplication(e.target.value)}
                            className="w-full p-2 bg-slate-900 text-white border-2 dark:border-yellow-500 rounded-md"
                        >
                            {applications.map(app => (
                                <option key={app.resumeKey} value={app.resumeKey}>
                                    Resume: {app.resumeKey.split('/')[1]} {app.jobDescription ? `- ${app.jobDescription.slice(0, 20)}...` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Results */}
                {currentApp && (
                    <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                        <Label className="font-bold mb-4 block dark:text-white text-white">Results</Label>
                        <Tabs defaultValue="original" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="original">Original Resume</TabsTrigger>
                                <TabsTrigger value="resume" disabled={!currentApp.tailoredResumeKey}>Tailored Resume</TabsTrigger>
                                <TabsTrigger value="cover-letter" disabled={!currentApp.coverLetterKey}>Cover Letter</TabsTrigger>
                            </TabsList>
                            <TabsContent value="original">
                                {currentApp.originalResumeUrl ? (
                                    <iframe src={currentApp.originalResumeUrl} className="w-full h-96" />
                                ) : (
                                    <p className="text-white">Original resume not available.</p>
                                )}
                            </TabsContent>
                            <TabsContent value="resume">
                                <TipTapEditor
                                    value={currentApp.tailoredResumeContent}
                                    onChange={(content) => {
                                        setApplications((prev) =>
                                            prev.map((app) =>
                                                app.resumeKey === currentApp.resumeKey
                                                    ? { ...app, tailoredResumeContent: content }
                                                    : app
                                            )
                                        );
                                        saveContentDebounced(currentApp.tailoredResumeKey, content);
                                    }}
                                />
                            </TabsContent>
                            <TabsContent value="cover-letter">
                                <TipTapEditor
                                    value={currentApp.coverLetterContent}
                                    onChange={(content) => {
                                        setApplications((prev) =>
                                            prev.map((app) =>
                                                app.resumeKey === currentApp.resumeKey
                                                    ? { ...app, coverLetterContent: content }
                                                    : app
                                            )
                                        );
                                        saveContentDebounced(currentApp.coverLetterKey, content);
                                    }}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeTutor;