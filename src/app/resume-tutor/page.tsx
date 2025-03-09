"use client";
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from '@/components/ui/label';

const ResumeTutor = () => {

    return (
        <div className="mt-4">
            <h1 className="text-xl dark:text-white
             text-black justify-center text-center
             ">
                Welcome to Resume Tutor
            </h1>

            <div className="ml-6 mt-10 max-w-lg gap-1.5 bg-slate-900 border-2 rounded-md dark:border-yellow-500 py-4 px-4">
                <Label htmlFor="message" className="font-bold mb-2">Upload Your Resume</Label>

            </div>

            <div className="grid ml-6 mt-10 max-w-lg gap-1.5 bg-slate-900 border-2 rounded-md dark:border-yellow-500 py-4 px-4 w-4/6
            ">
                <Label htmlFor="message" className="font-bold mb-2">Job Description</Label>
                <Textarea placeholder="Paste job description here." id="message"
                    className="border-2 dark:border-yellow-500 " />
                <p className="text-sm text-muted-foreground">
                    <span className="font-bold">Note:</span> The job description you send here, will be used in tailoring your resume.
                </p>
            </div>
        </div>
    )
}


export default ResumeTutor;