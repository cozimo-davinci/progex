import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Calendar, Home, GraduationCap, Fan, Settings } from 'lucide-react';

const menuItems = [
    {
        title: "Home",
        href: "/",
        description: "Home page",
        icon: Home
    },
    {
        title: "Calendar",
        href: "/calendar",
        description: "Calendar page",
        icon: Calendar
    },
    {
        title: "Resume Tutor",
        href: "/resume-tutor",
        description: "Resume Tutor Page",
        icon: GraduationCap
    },
    {
        title: "AI Interviewer",
        href: "/search",
        description: "AI Interview page",
        icon: Fan
    },
    {
        title: "Settings",
        href: "/settings",
        description: "Settings page",
        icon: Settings
    },
]


export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Dashboard Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.href}>
                                            <item.icon className="mr-2 h-4 w-4" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
