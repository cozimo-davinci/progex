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
import { createSupabaseClient } from "../../../supabaseClient"; // Direct import
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    FanIcon,
    ScrollIcon,
    BookIcon,
    PenIcon,
    DraftingCompassIcon
} from "lucide-react";

const components = [
    {
        title: "Job Applications Tracker",
        href: "/dashboard",
        description: "Advanced table with the all job aplications you need to track.",
    },
    {
        title: "AI Resume Tutor",
        href: "/resume-tutor",
        description: "AI Tutor that helps to effectively tailore your resume for certain jobs. It also includes credibility analysis of  your resume.",
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
    const [supabase, setSupabase] = React.useState<ReturnType<typeof createSupabaseClient> | null>(null);

    const router = useRouter();

    // Initialize Supabase client and session
    React.useEffect(() => {
        try {
            const client = createSupabaseClient();
            setSupabase(client);

            // Initial session check
            const checkSession = async () => {
                const { data: { session } } = await client.auth.getSession();
                setIsLoggedIn(!!session);
                console.log("Initial session check:", session);
            };
            checkSession();

            // Subscribe to auth state changes
            const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
                setIsLoggedIn(!!session);
                console.log("Auth state change:", event, session);
            });

            // Cleanup subscription on unmount
            return () => {
                authListener.subscription.unsubscribe();
            };
        } catch (error) {
            console.error("Failed to initialize Supabase client:", error);
        }
    }, []);

    // Logout function
    const handleLogout = async () => {
        if (!supabase) {
            toast.error("Supabase not initialized. Please try again.");
            return;
        }

        try {
            // Call the server-side logout endpoint
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include", // Ensure cookies are sent and cleared
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Logout failed");
            }

            // Update local state
            setIsLoggedIn(false);
            toast.success("Logout successful!", { description: "See you soon!" });

            // Redirect after a short delay to ensure cookies are cleared
            setTimeout(() => {
                router.push("/");
            }, 500); // Increased delay to 500ms for reliability
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Logout failed. Please try again.", {
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
            });
        }
    };

    if (!supabase) {
        return <div>Loading...</div>; // Optional loading state while Supabase initializes
    }

    return (
        <NavigationMenu
            className={cn(
                "mt-4 mb-6 max-w-full border-none",
                "flex flex-col md:flex-row md:items-center md:justify-between h-12 mx-auto md:ml-96 sm:ml-80"
            )}
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
                                                <ListItem
                                                    href="/docs"
                                                    title="Introduction"
                                                    icon={<FanIcon color="white" size={16} />}
                                                >
                                                    Re-usable components built using Radix UI and Tailwind CSS.
                                                </ListItem>
                                                <ListItem
                                                    href="/docs/installation"
                                                    title="Installation"
                                                    icon={<ScrollIcon color="white" size={16} />}
                                                >
                                                    How to install dependencies and structure your app.
                                                </ListItem>
                                                <ListItem
                                                    href="/docs/primitives/typography"
                                                    title="Typography"
                                                    icon={<ScrollIcon color="white" size={16} />}
                                                >
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
                                    <Link href="/dashboard" legacyBehavior passHref>
                                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>Dashboard</NavigationMenuLink>
                                    </Link>
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
                                            <Link href="/login" legacyBehavior passHref>
                                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>Log In</NavigationMenuLink>
                                            </Link>
                                        </NavigationMenuItem>
                                        <NavigationMenuItem>
                                            <Link href="/signup" legacyBehavior passHref>
                                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>Sign Up</NavigationMenuLink>
                                            </Link>
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
                        <NavigationMenuContent >
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
                                <ListItem
                                    href="/about-us"
                                    title="About Us"
                                    icon={<BookIcon color="white" size={20} />}
                                >
                                    Our mission and purpose
                                </ListItem>
                                <ListItem
                                    href="/contact-us"
                                    title="Contact Us"
                                    icon={<PenIcon color="white" size={20} />}
                                >
                                    Contact Form for any queries or questions
                                </ListItem>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                        <NavigationMenuContent >
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
                        <Link href="/dashboard" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                Dashboard
                            </NavigationMenuLink>
                        </Link>
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
                                <Link href="/login" legacyBehavior passHref>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                        Log In
                                    </NavigationMenuLink>
                                </Link>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <Link href="/signup" legacyBehavior passHref>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                        Sign Up
                                    </NavigationMenuLink>
                                </Link>
                            </NavigationMenuItem>
                        </>
                    )}
                </NavigationMenuList>
                <ModeToggle />
            </div>
        </NavigationMenu>
    );
}

// Updated ListItem with correct TypeScript types
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