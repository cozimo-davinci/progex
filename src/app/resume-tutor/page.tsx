"use client";
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Editor styles
import debounce from "lodash/debounce";
import { toast } from "sonner";

const ResumeTutor = () => {
    // State management
    const [resumeKey, setResumeKey] = React.useState(null);
    const [jobDescription, setJobDescription] = React.useState("");
    const [prompt, setPrompt] = React.useState("");
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [results, setResults] = React.useState(null);
    const [tailoredResumeContent, setTailoredResumeContent] = React.useState("");
    const [coverLetterContent, setCoverLetterContent] = React.useState("");

    // Debounced save function
    const saveContent = async (key, content) => {
        try {
            await fetch("/api/editor-saves/save-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, content }),
            });
        } catch (error) {
            console.error("Error saving content:", error);
            toast.error("Failed to save content. Please try again.");
        }
    };
    const saveContentDebounced = React.useMemo(() => debounce(saveContent, 1000), []);

    // Handle resume upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload/upload-resume", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                const { key } = await response.json();
                setResumeKey(key);
            } else {
                console.error("Failed to upload resume");
                toast.error("Failed to upload resume. Please try again.");
            }
        } catch (error) {
            console.error("Error uploading resume:", error);
            toast.error("Error uploading resume. Please try again.");
        }
    };

    // Handle AI processing
    const handleReceiveSuggestions = async () => {
        if (!resumeKey || !jobDescription) {
            toast.error("Please upload a resume and provide a job description");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch("/api/ai-resume/generate-documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeKey, jobDescription, prompt }),
            });
            if (response.ok) {
                const { tailoredResumeKey, coverLetterKey } = await response.json();
                setResults({ tailoredResumeKey, coverLetterKey });

                // Fetch content for editors
                const resumeRes = await fetch(`/api/s3-content/get-content?key=${tailoredResumeKey}`);
                const { content: resumeContent } = await resumeRes.json();
                setTailoredResumeContent(resumeContent);

                const coverRes = await fetch(`/api/s3-content/get-content?key=${coverLetterKey}`);
                const { content: coverContent } = await coverRes.json();
                setCoverLetterContent(coverContent);
            } else {
                console.error("Failed to generate documents");
                toast.error("Failed to generate documents. Please try again.");
            }
        } catch (error) {
            console.error("Error generating documents:", error);
            toast.error("Error generating documents. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 rounded-lg relative border-t-4 dark:border-t-yellow-500 border-t-black"
            style={{
                backgroundImage: "url('/images/resume-background-picture.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>
            <div className="relative z-10 w-full max-w-lg">
                <h1 className="text-3xl dark:text-white text-white text-center font-bold">
                    Welcome to Resume Tutor
                </h1>

                {/* Resume Upload */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="resume-upload" className="font-bold mb-4 block dark:text-white text-white">
                        Upload Your Resume
                    </Label>
                    <div className="flex items-center justify-center w-full">
                        <label
                            htmlFor="resume-upload"
                            className="cursor-pointer flex items-center justify-center w-full h-12 bg-white dark:bg-gray-700 border-2 dark:border-yellow-500 border-black rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                            <span>Choose File</span>
                            <input
                                id="resume-upload"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                        <span className="font-bold">Note:</span> Supported formats: PDF, DOC, DOCX.
                    </p>
                </div>

                {/* Job Description */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="job-desc" className="font-bold mb-4 block dark:text-white text-white">
                        Job Description
                    </Label>
                    <Textarea
                        id="job-desc"
                        placeholder="Paste job description here."
                        className="border-2 dark:border-yellow-500 w-full"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground text-center mt-2">
                        <span className="font-bold">Note:</span> Used to tailor your resume.
                    </p>
                </div>

                {/* Prompt */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="prompt" className="font-bold mb-4 block dark:text-white text-white">
                        Prompt
                    </Label>
                    <Input
                        id="prompt"
                        placeholder="E.g., Tailor my resume based on the job description."
                        className="border-2 dark:border-yellow-500 w-full"
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground text-center mt-2">
                        <span className="font-bold">Note:</span> Helps AI tailor your resume effectively.
                    </p>
                </div>

                {/* Button */}
                <Button
                    className="text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500 mt-4"
                    onClick={handleReceiveSuggestions}
                    disabled={isProcessing}
                >
                    {isProcessing ? "Processing..." : "Receive Suggestions"}
                </Button>

                {/* Results Container */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label className="font-bold mb-4 block dark:text-white text-white">Results</Label>
                    {results ? (
                        <Tabs defaultValue="resume" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="resume">Tailored Resume</TabsTrigger>
                                <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
                            </TabsList>
                            <TabsContent value="resume">
                                <ReactQuill
                                    value={tailoredResumeContent}
                                    onChange={(content) => {
                                        setTailoredResumeContent(content);
                                        saveContentDebounced(results.tailoredResumeKey, content);
                                    }}
                                    className="min-h-[300px] bg-white dark:bg-gray-800 text-black dark:text-white"
                                />
                            </TabsContent>
                            <TabsContent value="cover-letter">
                                <ReactQuill
                                    value={coverLetterContent}
                                    onChange={(content) => {
                                        setCoverLetterContent(content);
                                        saveContentDebounced(results.coverLetterKey, content);
                                    }}
                                    className="min-h-[300px] bg-white dark:bg-gray-800 text-black dark:text-white"
                                />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <p className="text-center text-white">
                            Click &quot;Receive Suggestions&quot; to see your tailored resume and cover letter.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeTutor;