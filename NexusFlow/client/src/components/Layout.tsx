import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  Users, 
  Calendar, 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Settings,
  Network,
  Plus,
  UserCog,
  Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: userCommunities } = useQuery({
    queryKey: ["/api/users/communities"],
    retry: false,
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadNotifications = notifications?.filter((n: any) => !n.isRead)?.length || 0;

  const navItems = [
    { path: "/", icon: Home, label: "Feed", testId: "nav-feed" },
    { path: "/communities", icon: Users, label: "Communities", testId: "nav-communities" },
    { path: "/events", icon: Calendar, label: "Events", testId: "nav-events" },
  ];

  const adminNavItems = [];
  if (user?.role === "admin") {
    adminNavItems.push({ path: "/admin", icon: Shield, label: "Admin", testId: "nav-admin" });
  }
  if (user?.role === "staff" || user?.role === "admin") {
    adminNavItems.push({ path: "/staff", icon: UserCog, label: "Staff", testId: "nav-staff" });
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "staff": return "secondary";
      case "community_lead": return "default";
      case "volunteer": return "outline";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "staff": return "Staff";
      case "community_lead": return "Community Lead";
      case "volunteer": return "Volunteer";
      default: return "User";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Network className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Nexus Network</span>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search communities, events, people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-global-search"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Navigation and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-2">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={location === item.path ? "default" : "ghost"}
                      size="sm"
                      className="h-9"
                      data-testid={item.testId}
                    >
                      <item.icon className="h-4 w-4" />
                    </Button>
                  </Link>
                ))}

                {adminNavItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={location === item.path ? "default" : "ghost"}
                      size="sm"
                      className="h-9"
                      data-testid={item.testId}
                    >
                      <item.icon className="h-4 w-4" />
                    </Button>
                  </Link>
                ))}

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative h-9" data-testid="button-notifications">
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </nav>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none" data-testid="text-user-menu-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-menu-email">
                      {user?.email}
                    </p>
                    <Badge variant={getRoleColor(user?.role || "user")} className="w-fit mt-1">
                      {getRoleLabel(user?.role || "user")}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" data-testid="link-profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/api/logout'} data-testid="button-logout">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="h-9"
                data-testid="button-theme-toggle"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3 space-y-6 hidden lg:block">
            {/* User Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-2xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg" data-testid="text-sidebar-user-name">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    {getRoleLabel(user?.role || "user")}
                  </p>
                  <Badge variant={getRoleColor(user?.role || "user")}>
                    {getRoleLabel(user?.role || "user")}
                  </Badge>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Communities</span>
                    <span className="font-semibold" data-testid="text-sidebar-communities-count">
                      {userCommunities?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    size="sm"
                    data-testid="button-quick-create-post"
                  >
                    <Plus className="mr-3 h-4 w-4" />
                    Create Post
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    size="sm"
                    data-testid="button-quick-create-event"
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    Create Event
                  </Button>
                  <Link href="/communities">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      size="sm"
                      data-testid="button-quick-manage-communities"
                    >
                      <Users className="mr-3 h-4 w-4" />
                      Manage Communities
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* My Communities */}
            {userCommunities && userCommunities.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">My Communities</h4>
                  <div className="space-y-3">
                    {userCommunities.slice(0, 5).map((community: any, index: number) => (
                      <div key={community.id} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-chart-${(index % 5) + 1} text-white`}>
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" data-testid={`text-sidebar-community-${community.id}`}>
                            {community.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getRoleLabel(community.role)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {community.memberCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={location === item.path ? "default" : "ghost"}
                size="sm"
                className="flex flex-col items-center p-2 h-auto"
                data-testid={`mobile-${item.testId}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            </Link>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center p-2 h-auto relative"
            data-testid="mobile-notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="text-xs mt-1">Notifications</span>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <Link href="/profile">
            <Button
              variant={location === "/profile" ? "default" : "ghost"}
              size="sm"
              className="flex flex-col items-center p-2 h-auto"
              data-testid="mobile-profile"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
