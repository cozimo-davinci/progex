'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, GraduationCapIcon, Brain, NotebookTabsIcon, Package } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type FAQItem = {
    id: string;
    icon: 'clock' | 'credit-card' | 'truck' | 'globe' | 'package';
    question: string;
    answer: string;
};

// Map icons to their components
const iconMap = {
    clock: Clock,
    'credit-card': GraduationCapIcon,
    truck: Brain,
    globe: NotebookTabsIcon,
    package: Package,
};

const FAQsThree = React.memo(function FAQsThree() {
    const faqItems: FAQItem[] = [
        {
            id: 'item-1',
            icon: 'clock',
            question: 'What are your business hours?',
            answer: 'Our customer service team is available Monday through Friday from 9:00 AM to 8:00 PM EST, and weekends from 10:00 AM to 6:00 PM EST. During holidays, hours may vary and will be posted on our website.',
        },
        {
            id: 'item-2',
            icon: 'credit-card',
            question: 'What is a Resume Tutor?',
            answer: 'It a smart AI Agent that helps you to tailor your resumes and compose the cover letters specifically for the job. Additionally, it has a Credibility Analysis feature that shows your credibility level for that selected job. Specifically, it also provides missing keywords, that can help your resume to stand out.',
        },
        {
            id: 'item-3',
            icon: 'truck',
            question: 'What is an AI Interviewer?',
            answer: 'This feature will be coming soon.',
        },
        {
            id: 'item-4',
            icon: 'globe',
            question: 'What is a job application tracker?',
            answer: 'This feature keeps track your job applications in a nicely designed table instead of using Excel Sheets. It also has AI application feature that helps you to add your applications just by pasting a link to the job site. Additionally, you can export all your records in the CSV format or Import your already existent applications in CSV format.',
        },
        // {
        //     id: 'item-5',
        //     icon: 'package',
        //     question: '',
        //     answer: "",
        // },
    ];

    return (
        <section className="bg-muted dark:bg-background py-20">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <div className="flex flex-col gap-10 md:flex-row md:gap-16">
                    <div className="md:w-1/3">
                        <div className="sticky top-20">
                            <h2 className="mt-4 text-3xl font-bold">Frequently Asked Questions</h2>
                            <p className="text-muted-foreground mt-4">
                                Can&apos;t find what you&apos;re looking for? Contact our{' '}
                                <Link href="/contact-us" className="text-primary font-medium hover:underline">
                                    customer support team
                                </Link>
                            </p>
                        </div>
                    </div>
                    <div className="md:w-2/3">
                        <Accordion type="single" collapsible className="w-full space-y-2">
                            {faqItems.map((item) => {
                                const IconComponent = iconMap[item.icon];
                                return (
                                    <AccordionItem
                                        key={item.id}
                                        value={item.id}
                                        className="bg-background shadow-xs rounded-lg border px-4 last:border-b"
                                    >
                                        <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-6">
                                                    <IconComponent className="m-auto size-4" />
                                                </div>
                                                <span className="text-base">{item.question}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-5">
                                            <div className="px-9">
                                                <p className="text-base">{item.answer}</p>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
});

export default FAQsThree;