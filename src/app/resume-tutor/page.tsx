"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import debounce from "lodash/debounce";
import TipTapEditor from "@components/ui/TipTapEditor";
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface JobApplication {
    id: string;
    resumeKey: string;
    tailoredResumeKey: string;
    coverLetterKey: string;
    jobDescription: string;
    tailoredResumeContent: string;
    coverLetterContent: string;
    originalResumeUrl?: string;
    companyName?: string;
    position?: string;
}

interface PreviousResume {
    key: string;
    name: string;
}

interface PastApplication {
    id: string;
    resumeKey: string;
    companyName: string;
    position: string;
    tailoredResumeKey: string;
    coverLetterKey: string;
}

const ResumeTutor = () => {
    const resultsRef = useRef<HTMLDivElement>(null);
    const [resumeKey, setResumeKey] = useState<string | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [prompt, setPrompt] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [position, setPosition] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
    const [previousResumes, setPreviousResumes] = useState<PreviousResume[]>([]);
    const [pastApplications, setPastApplications] = useState<PastApplication[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloadType, setDownloadType] = useState<'resume' | 'cover-letter' | null>(null);

    // Fetch previous resumes and past applications on mount
    useEffect(() => {
        const fetchPreviousResumes = async () => {
            try {
                const response = await fetch("/api/user-resumes");
                if (response.ok) {
                    const { resumes } = await response.json();
                    setPreviousResumes(resumes || []);
                } else {
                    console.error('Failed to fetch resumes:', await response.text());
                }
            } catch (error) {
                console.error("Error fetching previous resumes:", error);
            }
        };

        const fetchPastApplications = async () => {
            try {
                const response = await fetch("/api/user-job-postings");
                if (response.ok) {
                    const { applications } = await response.json();
                    setPastApplications(applications || []);
                    const loadedApplications = await Promise.all(
                        (applications || []).map(async (app: PastApplication) => {
                            const [resumeRes, coverRes, signedUrlRes] = await Promise.all([
                                fetch(`/api/s3-content?key=${app.tailoredResumeKey}`),
                                fetch(`/api/s3-content?key=${app.coverLetterKey}`),
                                fetch(`/api/get-signed-url?key=${app.resumeKey}`),
                            ]);
                            const resumeData = await resumeRes.json();
                            const coverData = await coverRes.json();
                            const signedUrlData = await signedUrlRes.json();
                            return {
                                id: app.id,
                                resumeKey: app.resumeKey,
                                tailoredResumeKey: app.tailoredResumeKey,
                                coverLetterKey: app.coverLetterKey,
                                jobDescription: "",
                                tailoredResumeContent: resumeData.content || "",
                                coverLetterContent: coverData.content || "",
                                originalResumeUrl: signedUrlData.url,
                                companyName: app.companyName,
                                position: app.position,
                            };
                        })
                    );
                    setApplications(loadedApplications);
                } else {
                    console.error('Failed to fetch applications:', await response.text());
                }
            } catch (error) {
                console.error("Error fetching past applications:", error);
            }
        };

        fetchPreviousResumes();
        fetchPastApplications();
    }, []);

    const saveContent = async (key: string, content: string) => {
        try {
            const response = await fetch("/api/editor-saves", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, content }),
            });
            if (!response.ok) throw new Error("Failed to save content");
            toast.success("Content saved successfully");
        } catch (error) {
            toast.error("Error saving content");
            console.error("Error:", error);
        }
    };
    const saveContentDebounced = useMemo(() => debounce(saveContent, 3000), []);

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
                const signedUrlRes = await fetch(`/api/get-signed-url?key=${key}`);
                const { url } = await signedUrlRes.json();
                const tempID = uuidv4();
                setApplications(prev => [...prev, {
                    id: tempID,
                    resumeKey: key,
                    tailoredResumeKey: "",
                    coverLetterKey: "",
                    jobDescription: "",
                    tailoredResumeContent: "",
                    coverLetterContent: "",
                    originalResumeUrl: url,
                }]);
                setSelectedApplication(tempID);
                const resumesResponse = await fetch("/api/user-resumes");
                if (resumesResponse.ok) {
                    const { resumes } = await resumesResponse.json();
                    setPreviousResumes(resumes);
                }
            }
        } catch (error) {
            console.error("Error uploading resume:", error);
        }
    };

    const handleReceiveSuggestions = async () => {
        if (!resumeKey || !jobDescription || !companyName || !position) {
            alert("Please provide all required fields");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch("/api/ai-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeKey, jobDescription, prompt, companyName, position }),
            });
            if (response.ok) {
                const { resumeKey: returnedResumeKey, tailoredResumeKey, coverLetterKey, id } = await response.json();
                const resumeRes = await fetch(`/api/s3-content?key=${tailoredResumeKey}`);
                const { content: resumeContent } = await resumeRes.json();
                const coverRes = await fetch(`/api/s3-content?key=${coverLetterKey}`);
                const { content: coverContent } = await coverRes.json();

                setApplications(prev => {
                    const updated = prev.map(app =>
                        app.resumeKey === returnedResumeKey
                            ? { ...app, id, tailoredResumeKey, coverLetterKey, jobDescription, tailoredResumeContent: resumeContent || "", coverLetterContent: coverContent || "", companyName, position }
                            : app
                    );
                    return updated;
                });
                setSelectedApplication(id);

                const applicationsResponse = await fetch("/api/user-job-postings");
                if (applicationsResponse.ok) {
                    const { applications: updatedApps } = await applicationsResponse.json();
                    setPastApplications(updatedApps);
                }
            }
        } catch (error) {
            console.error("Error generating documents:", error);
        } finally {
            setIsProcessing(false);
            setJobDescription("");
            setPrompt("");
            setCompanyName("");
            setPosition("");
        }
    };

    const handleDownload = async (format: 'pdf' | 'docx') => {
        if (!downloadType || !currentApp) return;

        const key = downloadType === 'resume' ? currentApp.tailoredResumeKey : currentApp.coverLetterKey;
        if (!key) {
            toast.error('Document not available');
            return;
        }

        try {
            const response = await fetch('/api/download-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, format }),
            });

            if (!response.ok) {
                throw new Error('Failed to download document');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${currentApp.companyName}-${currentApp.position}-${downloadType}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`Downloaded ${downloadType} as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Error downloading document:', error);
            toast.error('Failed to download document');
        } finally {
            setIsModalOpen(false);
            setDownloadType(null);
        }
    };

    const currentApp = applications.find(app => app.id === selectedApplication);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 rounded-lg relative border-t-4 dark:border-t-yellow-500 border-t-black" style={{ backgroundImage: "url('/images/resume-background-picture.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>
            <div className="relative z-10 w-full max-w-lg">
                <h1 className="text-3xl dark:text-white text-white text-center font-bold">Welcome to Resume Tutor</h1>

                {/* Past Documents Section */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label className="text-xl font-bold mb-4 block dark:text-white text-white">Your Past Documents</Label>
                    {previousResumes.length > 0 && (
                        <div className="mb-4">
                            <Label htmlFor="previous-resumes" className="text-lg font-semibold mb-2 block dark:text-white text-white">Select Previous Initial Resume</Label>
                            <select
                                id="previous-resumes"
                                value={resumeKey || ""}
                                onChange={(e) => {
                                    const selectedKey = e.target.value;
                                    setResumeKey(selectedKey);
                                    const selectedResume = previousResumes.find(resume => resume.key === selectedKey);
                                    if (selectedResume) {
                                        fetch(`/api/get-signed-url?key=${selectedKey}`)
                                            .then(res => res.json())
                                            .then(data => {
                                                const existingApp = applications.find(app => app.resumeKey === selectedKey);
                                                if (!existingApp) {
                                                    setApplications(prev => [...prev, {
                                                        id: "",
                                                        resumeKey: selectedKey,
                                                        tailoredResumeKey: "",
                                                        coverLetterKey: "",
                                                        jobDescription: "",
                                                        tailoredResumeContent: "",
                                                        coverLetterContent: "",
                                                        originalResumeUrl: data.url,
                                                    }]);
                                                }
                                                setSelectedApplication(selectedKey);
                                            });
                                    }
                                }}
                                className="w-full p-2 bg-slate-900 text-white border-2 dark:border-yellow-500 rounded-md"
                            >
                                <option value="">Select a resume</option>
                                {previousResumes.map(resume => (
                                    <option key={resume.key} value={resume.key}>
                                        {resume.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {pastApplications.length > 0 && (
                        <div className="bg-black rounded-lg shadow-sm py-2 px-2 shadow-white">
                            <Label className="text-lg font-semibold mb-2 block dark:text-white text-white">Past Tailored Applications</Label>
                            <ul className="list-disc pl-5 text-white">
                                {pastApplications.map(app => (
                                    <li key={`${app.id}-${app.resumeKey}-${app.companyName}-${app.position}`}>
                                        {app.companyName} - {app.position}
                                        <Button
                                            variant="outline"
                                            className="ml-20 text-yellow-500 mt-2 mb-1 dark:border-white justify-end"
                                            onClick={() => {
                                                setSelectedApplication(app.id);
                                                setTimeout(() => {
                                                    if (resultsRef.current) {
                                                        resultsRef.current.scrollIntoView({ behavior: "smooth" });
                                                    }
                                                }, 300);
                                            }}
                                        >
                                            View
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Resume Upload */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="resume-upload" className="text-xl font-bold mb-4 block dark:text-white text-white">Upload New Resume</Label>
                    <Input id="resume-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="dark:border-purple-500" />
                    <p className="text-sm text-muted-foreground text-center mt-2"><span className="font-bold">Note:</span> Supported formats: PDF, DOC, DOCX.</p>
                </div>
                {/* Job Description */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="job-desc" className="text-xl font-bold mb-4 block dark:text-white text-white">Job Description</Label>
                    <Textarea id="job-desc" placeholder="Paste job description here." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="dark:border-purple-500" />
                </div>
                {/* Company Name */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="company-name" className="text-xl font-bold mb-4 block dark:text-white text-white">Company Name</Label>
                    <Input id="company-name" placeholder="Enter company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="dark:border-purple-500" />
                </div>
                {/* Position */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="position" className="text-xl font-bold mb-4 block dark:text-white text-white">Position</Label>
                    <Input id="position" placeholder="Enter position" value={position} onChange={(e) => setPosition(e.target.value)} className="dark:border-purple-500" />
                </div>
                {/* Prompt */}
                <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label htmlFor="prompt" className="text-xl font-bold mb-4 block dark:text-white text-white">Prompt</Label>
                    <Input id="prompt" placeholder="E.g., Tailor my resume based on the job description." value={prompt} onChange={(e) => setPrompt(e.target.value)} className="dark:border-purple-500" />
                </div>
                {/* Button */}
                <Button
                    className="mt-4 text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                    onClick={handleReceiveSuggestions}
                    disabled={isProcessing}
                >
                    {isProcessing ? "Processing..." : "Receive Suggestions"}
                </Button>
                {/* Application Selection */}
                {applications.length > 0 && (
                    <div className="mt-10">
                        <Label className="text-2xl font-bold mb-4 block dark:text-white text-white">Select Application</Label>
                        <select
                            value={selectedApplication || ""}
                            onChange={(e) => setSelectedApplication(e.target.value)}
                            className="w-full p-2 bg-slate-900 text-white border-2 dark:border-yellow-500 rounded-md"
                        >
                            <option value="">Select an application</option>
                            {applications.map(app => (
                                <option key={app.id} value={app.id}>
                                    {app.companyName && app.position ? `${app.companyName} - ${app.position}` : `Resume: ${app.resumeKey.split('/').pop()}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            {/* Results */}
            {currentApp && (
                <div ref={resultsRef} className="relative z-10 w-full h-screen md:w-4/5 mt-10 bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                    <Label className="text-xl font-bold mb-4 block dark:text-white text-white">Results</Label>
                    <div className="flex justify-end space-x-4 mb-4">
                        <Dialog open={isModalOpen && downloadType === 'resume'} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => setDownloadType('resume')}
                                    disabled={!currentApp.tailoredResumeKey}
                                    className="text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                                >
                                    Download Tailored Resume
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Choose Download Format for Resume</DialogTitle>
                                </DialogHeader>
                                <div className="flex justify-around mt-4">
                                    <Button onClick={() => handleDownload('pdf')}>PDF</Button>
                                    <Button onClick={() => handleDownload('docx')}>DOCX</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isModalOpen && downloadType === 'cover-letter'} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => setDownloadType('cover-letter')}
                                    disabled={!currentApp.coverLetterKey}
                                    className="text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                                >
                                    Download Cover Letter
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Choose Download Format for Cover Letter</DialogTitle>
                                </DialogHeader>
                                <div className="flex justify-around mt-4">
                                    <Button onClick={() => handleDownload('pdf')}>PDF</Button>
                                    <Button onClick={() => handleDownload('docx')}>DOCX</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Tabs defaultValue="original" className="w-full h-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="original">Original Resume</TabsTrigger>
                            <TabsTrigger value="resume" disabled={!currentApp.tailoredResumeKey}>Tailored Resume</TabsTrigger>
                            <TabsTrigger value="cover-letter" disabled={!currentApp.coverLetterKey}>Cover Letter</TabsTrigger>
                        </TabsList>
                        <div className="h-[calc(100%-4rem)] overflow-y-auto">
                            <TabsContent value="original" className="h-full">
                                {currentApp.originalResumeUrl ? (
                                    <iframe src={currentApp.originalResumeUrl} className="w-full h-full mt-4 border-2 dark:border-purple-500 border-yellow-500 rounded-lg mr-4" />
                                ) : (
                                    <p className="text-white">Original resume not available.</p>
                                )}
                            </TabsContent>
                            <TabsContent value="resume" className="h-full">
                                <TipTapEditor
                                    value={currentApp.tailoredResumeContent}
                                    onChange={(content) => {
                                        setApplications(prev =>
                                            prev.map(app =>
                                                app.resumeKey === currentApp.resumeKey ? { ...app, tailoredResumeContent: content } : app
                                            )
                                        );
                                        saveContentDebounced(currentApp.tailoredResumeKey, content);
                                    }}
                                />
                            </TabsContent>
                            <TabsContent value="cover-letter" className="h-full">
                                <TipTapEditor
                                    value={currentApp.coverLetterContent}
                                    onChange={(content) => {
                                        setApplications(prev =>
                                            prev.map(app =>
                                                app.resumeKey === currentApp.resumeKey ? { ...app, coverLetterContent: content } : app
                                            )
                                        );
                                        saveContentDebounced(currentApp.coverLetterKey, content);
                                    }}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            )}
        </div>
    );
};

export default ResumeTutor;