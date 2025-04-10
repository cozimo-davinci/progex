import { Cpu, Zap } from "lucide-react";
import Image from "next/image";

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <h2 className="z-10 max-w-2xl text-4xl font-medium lg:text-5xl">
                    The Progex ecosystem brings together our reliable tools.
                </h2>
                <div className="relative">
                    <div className="relative z-10 space-y-4 md:w-1/2">
                        <p className="text-body ml-5">
                            Progex is evolving to be more than just the job application tracker.{" "}
                            <span className="text-title font-medium">It tries to become your helpful assistant</span> — in your endeavor of becoming best version of yourself.
                        </p>
                        <p className="ml-5">
                            It creates an user-friendly environemnts that helps you to achieve the highest effectivness
                            in your job search and interview preparation.
                        </p>

                        <div className="grid grid-cols-2 gap-5 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4 ml-5" />
                                    <h3 className="text-sm font-medium">Fast</h3>
                                </div>
                                <p className="text-muted-foreground text-sm ml-5">It compose your documents in less than a minute.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">Powerful</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Provides comprehensive documents analysis.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 h-fit md:absolute md:-inset-y-12 md:inset-x-0 md:mt-0">
                        <div className="border-border/50 relative rounded-2xl border border-dotted p-2 shadow-lg shadow-zinc-950/10">
                            <div className="relative w-full h-full">
                                <Image
                                    src="/images/analytics-home.jpg"
                                    className="hidden rounded-[12px] dark:block shadow w-full h-auto"
                                    alt="payments illustration dark"
                                    width={1207}
                                    height={929}
                                />
                                {/* Gradient overlay with dynamic height */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-black/100 via-black/100 to-transparent rounded-[12px] sm:from-black/70 sm:via-black/30 md:from-black/60 md:via-black/20 lg:from-black/100 lg:via-black/50"
                                />
                            </div>

                            <Image
                                src="/images/analytics-home.jpg"
                                className="rounded-[12px] shadow dark:hidden w-full h-auto"
                                alt="payments illustration light"
                                width={1207}
                                height={929}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}