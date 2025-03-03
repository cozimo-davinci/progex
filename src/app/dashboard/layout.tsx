import { AppSidebar } from "@components/ui/app-sidebar";
import { SidebarTrigger } from "@components/ui/sidebar";
import { SidebarProvider } from "@components/ui/sidebar";
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex">
            <SidebarProvider>
                <div className="fixed top-0 left-0 h-full w-64">
                    <AppSidebar />
                </div>
                <div className="ml-64 flex-1">
                    <SidebarTrigger />
                    {children}
                </div>
            </SidebarProvider>
        </div>
    );
}