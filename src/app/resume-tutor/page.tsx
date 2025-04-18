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
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ScrollText } from "lucide-react";
import { BriefcaseBusiness, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CombinedLoadingAnimation from "@/components/ui/loading-dots"; // Import the loading component

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

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
    credibilityScore?: number;
    missingKeywords?: string[];
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
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
    const [downloadType, setDownloadType] = useState<'resume' | 'cover-letter' | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true); // New state for loading

    // Credibility tab states
    const [credibilitySelectedAppId, setCredibilitySelectedAppId] = useState<string | null>(null);
    const [newJobDescription, setNewJobDescription] = useState("");
    const [reAnalysisResult, setReAnalysisResult] = useState<{ score: number; missingKeywords: string[] } | null>(null);
    const [isInitialAnalysisProcessing, setIsInitialAnalysisProcessing] = useState(false);
    const [isReAnalysisProcessing, setIsReAnalysisProcessing] = useState(false);

    // Framer motion states
    const [showScrollTop, setShowScrollTop] = useState(false);

    const credibilitySelectedApp = applications.find(app => app.id === credibilitySelectedAppId);

    // Scroll Detection Logic
    const checkScrollTop = () => {
        if (window.scrollY > 200) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", checkScrollTop);
        return () => window.removeEventListener("scroll", checkScrollTop);
    }, []);

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Reset re-analysis state when the selected application changes
    useEffect(() => {
        setReAnalysisResult(null);
        setNewJobDescription("");
    }, [credibilitySelectedAppId]);

    // Fetch previous resumes and past applications on mount
    useEffect(() => {
        const fetchData = async () => {
            setIsDataLoading(true); // Start loading

            try {
                // Fetch previous resumes
                const resumeResponse = await fetch("/api/user-resumes");
                if (resumeResponse.ok) {
                    const { resumes } = await resumeResponse.json();
                    setPreviousResumes(resumes || []);
                } else {
                    console.error('Failed to fetch resumes:', await resumeResponse.text());
                }

                // Fetch past applications and their documents
                const applicationsResponse = await fetch("/api/user-job-postings");
                if (applicationsResponse.ok) {
                    const { applications: fetchedApplications } = await applicationsResponse.json();
                    setPastApplications(fetchedApplications || []);

                    // Fetch documents for all applications in parallel
                    const loadedApplications = await Promise.all(
                        (fetchedApplications || []).map(async (app: PastApplication) => {
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
                    console.error('Failed to fetch applications:', await applicationsResponse.text());
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsDataLoading(false); // Stop loading once all data is fetched
            }
        };

        fetchData();
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
            setIsDownloadModalOpen(false);
            setDownloadType(null);
        }
    };

    const handleAnalyzeCredibility = async () => {
        if (!credibilitySelectedApp || !credibilitySelectedApp.tailoredResumeKey || !credibilitySelectedApp.jobDescription) {
            toast.error("Missing tailored resume or job description");
            return;
        }

        setIsInitialAnalysisProcessing(true);
        try {
            const response = await fetch("/api/credibility-analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeContent: credibilitySelectedApp.tailoredResumeContent,
                    jobDescription: credibilitySelectedApp.jobDescription,
                    applicationId: credibilitySelectedApp.id,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("Response not OK:", response.status, text);
                throw new Error("Failed to analyze credibility");
            }

            const data = await response.json();
            console.log("Received data:", data);
            setApplications((prev) =>
                prev.map((app) =>
                    app.id === credibilitySelectedApp.id ? { ...app, credibilityScore: data.score, missingKeywords: data.missingKeywords } : app
                )
            );
            toast.success("Credibility analysis completed");
        } catch (error) {
            console.error("Error analyzing credibility:", error);
            if (error instanceof Error) {
                toast.error(error.message || "Failed to analyze credibility");
            } else {
                toast.error("Failed to analyze credibility");
            }
        } finally {
            setIsInitialAnalysisProcessing(false);
        }
    };

    const handleReAnalyze = async () => {
        if (!credibilitySelectedApp || !credibilitySelectedApp.tailoredResumeKey) {
            toast.error("Missing tailored resume");
            return;
        }

        setIsReAnalysisProcessing(true);
        try {
            const response = await fetch("/api/re-analyze-credibility", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeContent: credibilitySelectedApp.tailoredResumeContent,
                    applicationId: credibilitySelectedApp.id,
                    newJobDescription: newJobDescription,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to re-analyze credibility");
            }

            const { score, missingKeywords } = await response.json();
            setReAnalysisResult({ score, missingKeywords });
            toast.success("Re-analysis completed");
        } catch (error) {
            console.error("Error re-analyzing credibility:", error);
            if (error instanceof Error) {
                toast.error(error.message || "Failed to re-analyze credibility");
            } else {
                toast.error("Failed to re-analyze credibility");
            }
        } finally {
            setIsReAnalysisProcessing(false);
        }
    };

    const currentApp = applications.find(app => app.id === selectedApplication);

    // Render the loading animation while data is being fetched
    if (isDataLoading) {
        return <CombinedLoadingAnimation />;
    }

    return (
        <div
            className="min-h-screen mt-20 flex flex-col items-center justify-center p-4 rounded-lg relative border-t-4 dark:border-t-yellow-500 border-t-black"
            style={{
                backgroundImage: "url('/images/resume-background-picture.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>
            <div className="relative z-10 w-full max-w-7xl">
                <h1 className="text-3xl dark:text-white text-white text-center font-bold">Welcome to Resume Tutor</h1>
                <Tabs defaultValue="ai-tutor" className="w-full mt-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ai-tutor">AI-Tutor</TabsTrigger>
                        <TabsTrigger value="credibility">Credibility</TabsTrigger>
                    </TabsList>

                    {/* AI-Tutor Tab: Existing Content */}
                    <TabsContent value="ai-tutor">
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
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-lg shadow-black/50 border border-gray-700">
                                    <Label className="text-lg font-semibold mb-4 block text-white">Past Tailored Applications</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {pastApplications.map((app) => (
                                            <div
                                                key={`${app.id}-${app.resumeKey}-${app.companyName}-${app.position}`}
                                                className={`bg-gray-800 rounded-xl p-4 shadow-md border border-gray-600 hover:bg-slate-900 transition-all duration-200 flex flex-col justify-between h-48 hover:cursor-pointer *
                                                    ${selectedApplication === app.id ? "border-2 border-yellow-500" : ""} `}
                                            >
                                                <BriefcaseBusiness className="text-orange-500" />
                                                <div className="flex-grow flex items-center justify-center">
                                                    <h3 className="text-white font-semibold text-center text-lg">
                                                        {app.companyName} - {app.position}
                                                    </h3>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="w-full text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-gray-900 transition-colors duration-200"
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
                                            </div>
                                        ))}
                                    </div>
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
                        {/* Results */}
                        {currentApp && (
                            <div
                                ref={resultsRef}
                                className="relative z-10 w-full h-auto mt-10 bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4 overflow-y-auto"
                            >
                                <Label className="text-xl font-bold mb-4 block dark:text-white text-white">Results</Label>
                                <div className="flex justify-end space-x-4 mb-4">
                                    {/* Download Tailored Resume Modal */}
                                    <Dialog open={isDownloadModalOpen && downloadType === 'resume'} onOpenChange={setIsDownloadModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                onClick={() => {
                                                    setDownloadType('resume');
                                                    setIsDownloadModalOpen(true);
                                                }}
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

                                    {/* Download Cover Letter Modal */}
                                    <Dialog open={isDownloadModalOpen && downloadType === 'cover-letter'} onOpenChange={setIsDownloadModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                onClick={() => {
                                                    setDownloadType('cover-letter');
                                                    setIsDownloadModalOpen(true);
                                                }}
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
                                    <div className="h-auto">
                                        <TabsContent value="original" className="max-h-screen overflow-y-auto">
                                            {currentApp.originalResumeUrl ? (
                                                <>
                                                    <iframe
                                                        src={currentApp.originalResumeUrl}
                                                        className="w-full h-auto max-h-[50vh] mt-4 border-2 dark:border-purple-500 border-yellow-500 rounded-lg mr-4"
                                                        style={{ maxWidth: '100%', overflow: 'auto' }}
                                                    />
                                                    <Dialog open={isExpandModalOpen} onOpenChange={setIsExpandModalOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                onClick={() => setIsExpandModalOpen(true)}
                                                                className="mt-2 text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                                                            >
                                                                Expand Original Resume
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-6xl h-4/5 p-2 flex flex-col">
                                                            <DialogHeader className="p-2">
                                                                <DialogTitle>Original Resume</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="flex-grow">
                                                                <iframe
                                                                    src={currentApp.originalResumeUrl}
                                                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                                                />
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </>
                                            ) : (
                                                <p className="text-white">Original resume not available.</p>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="resume" className="h-auto overflow-y-auto">
                                            <TipTapEditor
                                                value={currentApp.tailoredResumeContent}
                                                onChange={(content) => {
                                                    setApplications((prev) =>
                                                        prev.map((app) =>
                                                            app.resumeKey === currentApp.resumeKey ? { ...app, tailoredResumeContent: content } : app
                                                        )
                                                    );
                                                    saveContentDebounced(currentApp.tailoredResumeKey, content);
                                                }}
                                                style={{ width: '100%', maxWidth: '100%', height: 'auto', overflowY: 'auto' }}
                                            />
                                        </TabsContent>
                                        <TabsContent value="cover-letter" className="h-auto overflow-y-auto">
                                            <TipTapEditor
                                                value={currentApp.coverLetterContent}
                                                onChange={(content) => {
                                                    setApplications((prev) =>
                                                        prev.map((app) =>
                                                            app.resumeKey === currentApp.resumeKey ? { ...app, coverLetterContent: content } : app
                                                        )
                                                    );
                                                    saveContentDebounced(currentApp.coverLetterKey, content);
                                                }}
                                                style={{ width: '100%', maxWidth: '100%', height: 'auto', overflowY: 'auto' }}
                                            />
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        )}
                    </TabsContent>

                    {/* Credibility Tab */}
                    <TabsContent value="credibility">
                        <div className="mt-10 w-full bg-slate-900 bg-opacity-90 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                            <h2 className="text-2xl font-bold text-white">Credibility Analysis</h2>
                            <Label className="text-lg font-semibold text-white mt-4 block">Select Application</Label>
                            <select
                                value={credibilitySelectedAppId || ""}
                                onChange={(e) => setCredibilitySelectedAppId(e.target.value)}
                                className="w-full p-2 bg-slate-900 text-white border-2 dark:border-yellow-500 rounded-md"
                            >
                                <option value="">Select an application</option>
                                {pastApplications.map(app => (
                                    <option key={app.id} value={app.id}>
                                        {app.companyName} - {app.position}
                                    </option>
                                ))}
                            </select>

                            {credibilitySelectedApp && (
                                <div className="mt-4">
                                    {/* Initial Analysis Section */}
                                    {credibilitySelectedApp.credibilityScore !== undefined && credibilitySelectedApp.missingKeywords ? (
                                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-lg shadow-black/50 border border-gray-700">
                                            <h3 className="text-xl font-bold text-white mb-4">Original Analysis</h3>
                                            <div className="flex items-center justify-center h-72">
                                                <div className="relative w-48 h-48">
                                                    <Pie
                                                        data={{
                                                            labels: ['Score', 'Missing'],
                                                            datasets: [{
                                                                data: [credibilitySelectedApp.credibilityScore, 100 - credibilitySelectedApp.credibilityScore],
                                                                backgroundColor: ['#22c55e', '#4b5563'],
                                                                borderColor: ['#fc03d3', '#d121b4'],
                                                                borderWidth: 3,
                                                            }],
                                                        }}
                                                        options={{
                                                            plugins: {
                                                                legend: { display: false },
                                                                tooltip: {
                                                                    enabled: true,
                                                                    backgroundColor: '#1e3a8a',
                                                                    titleColor: '#ffffff',
                                                                    bodyColor: '#e5e7eb',
                                                                    borderColor: '#22c55e',
                                                                    borderWidth: 3,
                                                                },
                                                            },
                                                            animation: {
                                                                animateScale: true,
                                                                animateRotate: true,
                                                            },
                                                            cutout: '60%',
                                                        }}
                                                        className="drop-shadow-lg"
                                                    />
                                                </div>
                                                <div className="ml-6 flex items-center">
                                                    <p className="text-3xl font-extrabold text-white bg-black rounded-full px-6 py-3 shadow-md">
                                                        {credibilitySelectedApp.credibilityScore}%
                                                    </p>
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-semibold text-white mt-6 mb-2">Missing Keywords:</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                {credibilitySelectedApp.missingKeywords.map((keyword, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-black text-white rounded-lg p-3 shadow-md shadow-black border border-gray-600 hover:bg-gray-700 transition-colors duration-200 text-center flex items-center justify-center space-x-2"
                                                    >
                                                        <ScrollText className="text-red-700" />
                                                        <span className="font-bold">{keyword}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Initial Analysis</h3>
                                            <Textarea
                                                value={credibilitySelectedApp.jobDescription}
                                                onChange={(e) => {
                                                    setApplications((prev) =>
                                                        prev.map((app) =>
                                                            app.id === credibilitySelectedApp.id ? { ...app, jobDescription: e.target.value } : app
                                                        )
                                                    );
                                                }}
                                                placeholder="Paste job description here for initial analysis"
                                                className="dark:border-purple-500 mt-2"
                                            />
                                            <Button
                                                onClick={handleAnalyzeCredibility}
                                                disabled={isInitialAnalysisProcessing || !credibilitySelectedApp.jobDescription}
                                                className="mt-2 text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                                            >
                                                {isInitialAnalysisProcessing ? "Analyzing..." : "Analyze Credibility"}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Re-analysis Section */}
                                    <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-lg shadow-black/50 border border-gray-700">
                                        <h3 className="text-xl font-bold text-white mb-4">Re-analyze with Job Description</h3>
                                        <Textarea
                                            value={newJobDescription}
                                            onChange={(e) => setNewJobDescription(e.target.value)}
                                            placeholder="Paste new job description here or leave empty to use cached one"
                                            className="dark:border-purple-500 mt-2 bg-gray-800 text-white placeholder-gray-400 rounded-md p-3"
                                        />
                                        <Button
                                            onClick={handleReAnalyze}
                                            disabled={isReAnalysisProcessing}
                                            className="mt-2 text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
                                        >
                                            {isReAnalysisProcessing ? "Re-analyzing..." : "Re-analyze"}
                                        </Button>
                                    </div>

                                    {/* Re-analysis Result */}
                                    {reAnalysisResult && (
                                        <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-lg shadow-black/50 border border-gray-700">
                                            <h3 className="text-xl font-bold text-white mb-4">Re-analysis Result</h3>
                                            <div className="flex items-center justify-center h-72">
                                                <div className="relative w-48 h-48">
                                                    <Pie
                                                        data={{
                                                            labels: ['Score', 'Missing'],
                                                            datasets: [{
                                                                data: [reAnalysisResult.score, 100 - reAnalysisResult.score],
                                                                backgroundColor: ['#22c55e', '#4b5563'],
                                                                borderColor: ['#fc03d3', '#d121b4'],
                                                                borderWidth: 3,
                                                            }],
                                                        }}
                                                        options={{
                                                            plugins: {
                                                                legend: { display: false },
                                                                tooltip: {
                                                                    enabled: true,
                                                                    backgroundColor: '#1e3a8a',
                                                                    titleColor: '#ffffff',
                                                                    bodyColor: '#e5e7eb',
                                                                    borderColor: '#22c55e',
                                                                    borderWidth: 3,
                                                                },
                                                            },
                                                            animation: {
                                                                animateScale: true,
                                                                animateRotate: true,
                                                            },
                                                            cutout: '60%',
                                                        }}
                                                        className="drop-shadow-lg"
                                                    />
                                                </div>
                                                <div className="ml-6 flex items-center">
                                                    <p className="text-3xl font-extrabold text-white bg-black rounded-full px-6 py-3 shadow-md">
                                                        {reAnalysisResult.score}%
                                                    </p>
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-semibold text-white mt-6 mb-2">Missing Keywords:</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                {reAnalysisResult.missingKeywords.map((keyword, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-black text-white rounded-lg p-3 shadow-md shadow-black border border-gray-600 hover:bg-gray-700 transition-colors duration-200 text-center flex items-center justify-center space-x-2"
                                                    >
                                                        <ScrollText className="text-red-700" />
                                                        <span className="font-bold">{keyword}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Display Resumes */}
                                    <div>
                                        <div className="mt-6">
                                            <h3 className="text-lg font-semibold text-white">Tailored Resume</h3>
                                            <TipTapEditor
                                                value={credibilitySelectedApp.tailoredResumeContent}
                                                editable={false}
                                                onChange={() => { }}
                                                style={{ width: '100%', height: '700px', overflowY: 'auto' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            {/* Scroll Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 p-3 bg-black font-bold text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-200 z-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ArrowUp className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResumeTutor;