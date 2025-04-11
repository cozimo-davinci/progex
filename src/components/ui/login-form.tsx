"use client";
import type React from "react";
import { cn } from "@/components/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // Import the correct client

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize Supabase client directly
    const supabase = createClientComponentClient();

    useEffect(() => {
        setIsLoading(false); // No complex initialization needed
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include", // Ensure cookies are included
            });

            const data = await response.json();
            if (!response.ok) {
                console.error("Login error:", data.error);
                setError(data.error);
                toast.error("Login failed!", {
                    description: "Something went wrong, please try again!",
                });
            } else {
                console.log("Login response:", data);

                // The login API sets the session cookies; verify the session
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                console.log("Session data after login:", sessionData);
                console.log("Session error after login:", sessionError);

                if (sessionError) throw sessionError;
                if (!sessionData.session) {
                    console.warn("No session detected after login, attempting refresh...");
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                    console.log("Refreshed session data:", refreshData);
                    console.log("Refreshed session error:", refreshError);
                    if (refreshError) throw refreshError;
                    if (!refreshData.session) {
                        toast.error("Session not detected!", { description: "Please try again or contact support." });
                        return;
                    }
                }

                toast.success("Login successful!", { description: "Welcome back!" });
                setTimeout(() => {
                    router.push("/dashboard");
                }, 500);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An unexpected error occurred");
            toast.error("Login failed!", {
                description: "An unexpected error occurred. Please contact customer support.",
            });
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={cn("flex flex-col gap-6 w-full md:w-3/5 max-w-3xl mx-auto", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleLogin}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                                <p className="text-balance text-muted-foreground">Login to your Progex account</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <a href="#" className="ml-auto text-sm underline-offset-2 hover:underline">
                                        Forgot your password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-200"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.54-1.36 2.76-3.15 3.54-5.25C21.37 6.11 17.1 3 12 3c-1.73 0-3.36.44-4.78 1.2l2.16 2.16C10.74 6.13 11.35 7 12 7zM2 4.27l2.28 2.28C2.94 7.91 1.85 9.61 1.06 11.5 2.63 15.89 6.9 19 12 19c1.73 0 3.36-.44 4.78-1.2l2.84 2.84 1.41-1.41L3.41 2.86 2 4.27zm5.11 5.11l1.94 1.94C9.03 11.55 9 11.77 9 12c0 1.66 1.34 3 3 3 .23 0 .45-.03.68-.05l1.94 1.94C13.77 16.97 12.9 17 12 17c-2.76 0-5-2.24-5-5 0-.9.03-1.77.11-2.62z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <Button variant="outline" className="w-full flex justify-center items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                    >
                                        <path d="M8 0a8 8 0 0 0-2.915 15.452c-.07-.633-.134-1.606.027-2.297.146-.625.938-3.977.938-3.977s-.239-.479-.239-1.187c0-1.113.645-1.943 1.448-1.943.682 0 1.012.512 1.012 1.127 0 .686-.437 1.712-.663 2.663-.188.796.4 1.446 1.185 1.446 1.422 0 2.515-1.5 2.515-3.664 0-1.915-1.377-3.254-3.342-3.254-2.276 0-3.612 1.707-3.612 3.471 0 .688.265 1.425.595 1.826a.24.24 0 0 1 .056.23c-.061.252-.196.796-.222.907-.035.146-.116.177-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A8 8 0 0 0 8 0" />
                                    </svg>
                                </Button>
                                <Button variant="outline" className="w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    <span className="sr-only">Login with Google</span>
                                </Button>
                                <Button variant="outline" className="w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path
                                            d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 01 1.088-.285z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    <span className="sr-only">Login with Meta</span>
                                </Button>
                            </div>
                            <div className="text-center text-sm">
                                Don’t have an account?{" "}
                                <a href="/signup" className="underline underline-offset-4">
                                    Sign up
                                </a>
                            </div>
                        </div>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <Image
                            src="/images/login-image.png"
                            alt="Login background"
                            layout="fill"
                            objectFit="cover"
                            className="dark:brightness-[0.9] dark:contrast-more:"
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                By clicking continue, you agree to our <a href="#">Terms of Service</a> and{" "}
                <a href="#">Privacy Policy</a>.
            </div>
        </div>
    );
}