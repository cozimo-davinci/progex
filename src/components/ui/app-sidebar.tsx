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
import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react';

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
        title: "Inbox",
        href: "/inbox",
        description: "Inbox page",
        icon: Inbox
    },
    {
        title: "Search",
        href: "/search",
        description: "Search page",
        icon: Search
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
