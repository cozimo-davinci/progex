"use client";

import * as React from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/components/lib/utils";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "@/components/ui/dark-mode";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { createSupabaseClient } from "../../app/lib/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    FanIcon,
    ScrollIcon,
    BookIcon,
    PenIcon,
    DraftingCompassIcon,
} from "lucide-react";

const components = [
    {
        title: "Job Applications Tracker",
        href: "/dashboard",
        description: "Advanced table with all job applications you need to track.",
    },
    {
        title: "AI Resume Tutor",
        href: "/resume-tutor",
        description: "AI Tutor that helps effectively tailor your resume for certain jobs. It also includes credibility analysis of your resume.",
    },
    {
        title: "AI Interviewer",
        href: "/interview-ai",
        description: "Coming Soon.",
    },
];

export function NavigationMenuDemo() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [gettingStartedOpen, setGettingStartedOpen] = React.useState(false);
    const [somethingElseOpen, setSomethingElseOpen] = React.useState(false);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);

    const router = useRouter();
    const supabase = createSupabaseClient();

    // Initialize session and auth state
    React.useEffect(() => {
        const checkSession = async () => {
            const sessionString = localStorage.getItem('sb-auth-session');
            if (!sessionString) {
                setIsLoggedIn(false);
                return;
            }

            const sessionData = JSON.parse(sessionString);
            const currentTime = Math.floor(Date.now() / 1000);

            // Refresh session if expired
            if (currentTime >= sessionData.expires_at) {
                const { data: refreshedSession, error } = await supabase.auth.refreshSession({
                    refresh_token: sessionData.refresh_token,
                });

                if (error || !refreshedSession.session) {
                    localStorage.removeItem('sb-auth-session');
                    setIsLoggedIn(false);
                    return;
                }

                const newSessionData = {
                    access_token: refreshedSession.session.access_token,
                    refresh_token: refreshedSession.session.refresh_token,
                    expires_at: refreshedSession.session.expires_at,
                    expires_in: refreshedSession.session.expires_in,
                };

                localStorage.setItem('sb-auth-session', JSON.stringify(newSessionData));
            }

            setIsLoggedIn(true);
        };

        checkSession();
    }, [supabase]);

    // Detect scroll position
    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Logout function
    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Logout failed");
            }

            // Clear localStorage
            localStorage.removeItem('sb-auth-session');
            setIsLoggedIn(false);
            toast.success("Logout successful!", { description: "See you soon!" });
            setTimeout(() => {
                router.push("/login");
            }, 150);
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Logout failed. Please try again.", {
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
            });
        }
    };

    return (
        <NavigationMenu
            className={cn(
                "fixed top-2 left-64 w-full z-20 px-6 transition-all duration-300",
                isScrolled ? "bg-background/50 rounded-2xl border backdrop-blur-lg" : "bg-transparent",
                "flex flex-col md:flex-row md:items-center md:justify-between h-12 mx-auto md:ml-96 sm:ml-80"
            )}
            style={{
                background: isScrolled ? undefined : "radial-gradient(125% 125% at 50% 100%, transparent 0%, var(--color-background) 75%)",
            }}
        >
            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center justify-between w-full">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="border-2 border-black dark:border-white">
                            <Icons.menu className="h-6 w-6" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <div className="p-4">
                            <h2 className="sr-only">Navigation Menu</h2>
                            <NavigationMenuList className="flex flex-col gap-2">
                                <NavigationMenuItem>
                                    <Collapsible open={gettingStartedOpen} onOpenChange={setGettingStartedOpen}>
                                        <CollapsibleTrigger className={cn(navigationMenuTriggerStyle(), "w-full justify-between")}>
                                            Getting started
                                            <span>{gettingStartedOpen ? "▼" : "▶"}</span>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="ml-4">
                                            <ul className="grid gap-2">
                                                <li className="row-span-3">
                                                    <NavigationMenuLink asChild>
                                                        <Link
                                                            className="flex w-full select-none flex-col rounded-md p-2 no-underline hover:bg-muted focus:shadow-md"
                                                            href="/"
                                                        >
                                                            <Icons.rocket className="h-6 w-6" />
                                                            <div className="mt-2 text-sm font-medium">shadcn/ui</div>
                                                            <p className="text-xs leading-tight text-muted-foreground">
                                                                Beautifully designed components built with Radix UI and Tailwind CSS.
                                                            </p>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                </li>
                                                <ListItem href="/docs" title="Introduction" icon={<FanIcon color="white" size={16} />}>
                                                    Re-usable components built using Radix UI and Tailwind CSS.
                                                </ListItem>
                                                <ListItem href="/docs/installation" title="Installation" icon={<ScrollIcon color="white" size={16} />}>
                                                    How to install dependencies and structure your app.
                                                </ListItem>
                                                <ListItem href="/docs/primitives/typography" title="Typography" icon={<ScrollIcon color="white" size={16} />}>
                                                    Styles for headings, paragraphs, lists...etc
                                                </ListItem>
                                            </ul>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Collapsible open={somethingElseOpen} onOpenChange={setSomethingElseOpen}>
                                        <CollapsibleTrigger className={cn(navigationMenuTriggerStyle(), "w-full justify-between")}>
                                            Something else
                                            <span>{somethingElseOpen ? "▼" : "▶"}</span>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="ml-4">
                                            <ul className="grid gap-2">
                                                {components.map((component) => (
                                                    <ListItem key={component.title} title={component.title} href={component.href}>
                                                        {component.description}
                                                    </ListItem>
                                                ))}
                                            </ul>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link href="/dashboard" className={navigationMenuTriggerStyle()}>
                                            Dashboard
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                {isLoggedIn ? (
                                    <NavigationMenuItem>
                                        <NavigationMenuLink onClick={handleLogout} className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}>
                                            Logout
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                ) : (
                                    <>
                                        <NavigationMenuItem>
                                            <NavigationMenuLink asChild>
                                                <Link href="/login" className={navigationMenuTriggerStyle()}>
                                                    Log In
                                                </Link>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                        <NavigationMenuItem>
                                            <NavigationMenuLink asChild>
                                                <Link href="/signup" className={navigationMenuTriggerStyle()}>
                                                    Sign Up
                                                </Link>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                    </>
                                )}
                            </NavigationMenuList>
                        </div>
                    </SheetContent>
                </Sheet>
                <ModeToggle />
            </div>

            {/* Desktop Menu */}
            <div className="hidden justify-end md:flex md:items-center md:w-full">
                <NavigationMenuList className="flex flex-row gap-2 items-center">
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                <li className="row-span-3">
                                    <NavigationMenuLink asChild>
                                        <Link
                                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                            href="/"
                                        >
                                            <Icons.rocket className="h-6 w-6" />
                                            <div className="mb-2 mt-4 text-lg font-medium">Home</div>
                                            <p className="text-sm leading-tight text-muted-foreground">
                                                Return to Home Page
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <ListItem href="/about-us" title="About Us" icon={<BookIcon color="white" size={20} />}>
                                    Our mission and purpose
                                </ListItem>
                                <ListItem href="/contact-us" title="Contact Us" icon={<PenIcon color="white" size={20} />}>
                                    Contact Form for any queries or questions
                                </ListItem>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                {components.map((component) => (
                                    <ListItem
                                        key={component.title}
                                        title={component.title}
                                        href={component.href}
                                        icon={<DraftingCompassIcon color="white" size={20} />}
                                    >
                                        {component.description}
                                    </ListItem>
                                ))}
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                            <Link href="/dashboard" className={navigationMenuTriggerStyle()}>
                                Dashboard
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    {isLoggedIn ? (
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                onClick={handleLogout}
                                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                            >
                                Logout
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ) : (
                        <>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/login" className={navigationMenuTriggerStyle()}>
                                        Log In
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/signup" className={navigationMenuTriggerStyle()}>
                                        Sign Up
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </>
                    )}
                </NavigationMenuList>
                <ModeToggle />
            </div>
        </NavigationMenu>
    );
}

const ListItem = React.forwardRef<
    HTMLAnchorElement,
    { className?: string; title: string; children: React.ReactNode; href: string; icon?: React.ReactNode }
>(({ className, title, children, href, icon }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    href={href}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                >
                    <div className="flex items-center space-x-2">
                        {icon && <span>{icon}</span>}
                        <div className="text-sm font-medium leading-none">{title}</div>
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
                </a>
            </NavigationMenuLink>
        </li>
    );
});
ListItem.displayName = "ListItem";