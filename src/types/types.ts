// src/types.ts
export interface JobApplication {
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