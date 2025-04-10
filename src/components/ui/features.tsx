import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VenetianMaskIcon, GraduationCapIcon, ScrollIcon } from 'lucide-react';
import { ReactNode } from 'react';

export default function Features() {
    return (
        <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Built to cover your needs</h2>
                    <p className="mt-4 uppercase text-xl font-semibold">Explore. Try. Apply.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 md:mt-16 text-center">
                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <ScrollIcon size={24} aria-hidden />
                            </CardDecorator>
                            <h3 className="mt-6 font-medium">Application Tracker</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                Advanced tool to track your applications and change their statuses seamlessly.
                                Have a clear overview of your job applications and their current status.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <GraduationCapIcon className="size-6" aria-hidden />
                            </CardDecorator>
                            <h3 className="mt-6 font-medium">Resume AI-Tutor</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="mt-3 text-sm">
                                Seasoned AI-agent with an expertise in tailoring your resumes and composing effective cover letters.
                                Tailored to your needs, it ensures your resume is a perfect fit.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <VenetianMaskIcon className="size-6" aria-hidden />
                            </CardDecorator>
                            <h3 className="mt-6 font-medium">AI Interviewer</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="mt-3 text-sm">
                                AI tool that helps you to prepare for your interviews in a live setting.
                                It provides feedback on your answers and helps you to improve your interview skills.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] group-hover:bg-gradient-to-r group-hover:from-gray-100 group-hover:to-gray-200 dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-gradient-to-r dark:group-hover:from-gray-200 dark:group-hover:to-gray-300 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]
    dark:group-hover:rounded-full rounded-full">
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div aria-hidden className="bg-radial to-slate-400/75 absolute inset-0 from-transparent rounded-lg" />
        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">{children}</div>
    </div>
);