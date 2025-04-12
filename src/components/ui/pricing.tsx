import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DnaIcon } from 'lucide-react';

export default function Pricing() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">Pricing that Scales with You</h1>
                    <p>
                        Progex is offering help for the students in their endaevour of looking for a job based on their custom needs.
                    </p>
                </div>

                <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-medium">Tier 1: Small Institutions</CardTitle>
                            <span className="my-3 block text-2xl font-semibold">$15,000 / year</span>
                            <CardDescription className="text-sm">College or universities with fewer than 1,000 students</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {['Job Application Tracker (basic version)',
                                    'Resume AI-Tutor (standard resume tailoring and cover letter generation)',
                                    'Email and Chat Support',
                                    'Standard Security features (single sing-on, data encryption etc.)'
                                ].map(
                                    (item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <DnaIcon className="size-5" />
                                            {item}
                                        </li>
                                    )
                                )}
                            </ul>
                        </CardContent>

                        <CardFooter className="mt-auto">
                            <Button asChild variant="outline" className="w-full">
                                <Link href="">Get Started</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="relative">
                        {/* Fixed gradient utility */}
                        <span
                            className="absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full bg-gradient-to-br from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5"
                        >
                            Popular
                        </span>

                        <div className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-medium">Tier 2: Medium Institutions</CardTitle>
                                <span className="my-3 block text-2xl font-semibold">$30,000 / year</span>
                                <CardDescription className="text-sm">Institutions with 1,000 to 5,000 students.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <hr className="border-dashed" />
                                <ul className="list-outside space-y-3 text-sm">
                                    {[
                                        'Everything in Tier 1',
                                        'Advanced Application Tracker',
                                        'Resume AI-Tutor with Credibility Analysis and Keyword Optimization',
                                        'Priority support (24/7 availability)',
                                        'Custom Integrations (with student information systems)',
                                        'Up to 2 custom analytics report per month',
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <DnaIcon className="size-5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href="">Get Started</Link>
                                </Button>
                            </CardFooter>
                        </div>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-medium">Tier 3: Large Institutions</CardTitle>
                            <span className="my-3 block text-2xl font-semibold">$50,000 / year</span>
                            <CardDescription className="text-sm">Universities with more than 5,000 students</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {[
                                    'Everything in Tier 2',
                                    'AI Interviewer (live interview practice with AI feedback)',
                                    'Dedicated account manager and premium support',
                                    'Full customization options',
                                    'Unlimited custom reports',
                                    'Access to all advanced AI tools'

                                ].map(
                                    (item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <DnaIcon className="size-5" />
                                            {item}
                                        </li>
                                    )
                                )}
                            </ul>
                        </CardContent>

                        <CardFooter className="mt-auto">
                            <Button asChild variant="outline" className="w-full">
                                <Link href="">Get Started</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-medium">Optional Add-Ons</CardTitle>
                            <span className="my-3 block text-2xl font-semibold">Price $: Custom</span>
                            <CardDescription className="text-sm">Custom solutions per request</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {[
                                    'Custom Development',
                                    'Training and Onboarding',
                                    'Premium Support',
                                ].map(
                                    (item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <DnaIcon className="size-5" />
                                            {item}
                                        </li>
                                    )
                                )}
                            </ul>
                        </CardContent>

                        <CardFooter className="mt-auto">
                            <Button asChild variant="outline" className="w-full">
                                <Link href="">Contact Sales</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>
    );
}