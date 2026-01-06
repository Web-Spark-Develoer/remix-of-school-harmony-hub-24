import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MobileHeader } from "./MobileHeader";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardCheck,
  FileText,
  UserPlus,
  Settings,
  LogOut,
  GraduationCap,
  Search,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

const teacherNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/staff" },
  { icon: Users, label: "My Students", href: "/staff/students" },
  { icon: BookOpen, label: "My Classes", href: "/staff/classes" },
  { icon: ClipboardCheck, label: "Attendance", href: "/staff/attendance" },
  { icon: FileText, label: "Gradebook", href: "/staff/gradebook" },
  { icon: FileText, label: "Reports", href: "/staff/reports" },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/staff" },
  { icon: UserPlus, label: "Admissions", href: "/staff/admissions" },
  { icon: Users, label: "Students", href: "/staff/students" },
  { icon: BookOpen, label: "Classes", href: "/staff/classes" },
  { icon: ClipboardCheck, label: "Attendance", href: "/staff/attendance" },
  { icon: FileText, label: "Gradebook", href: "/staff/gradebook" },
  { icon: FileText, label: "Reports", href: "/staff/reports" },
];

const adminSettingsItems = [
  { icon: Users, label: "Manage Teachers", href: "/staff/admin/teachers" },
  { icon: BookOpen, label: "Manage Classes", href: "/staff/admin/classes" },
  { icon: Settings, label: "Departments", href: "/staff/admin/departments" },
  { icon: UserPlus, label: "Bulk Upload", href: "/staff/admin/students" },
  { icon: Settings, label: "Admin Users", href: "/staff/admin/users" },
];

export const StaffLayout = ({ 
  children, 
  title,
  showSearch = false,
  searchPlaceholder = "Search..."
}: StaffLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, teacherData, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const staffName = teacherData 
    ? `${teacherData.first_name} ${teacherData.last_name}`
    : "Staff";

  const staffInitials = teacherData
    ? `${teacherData.first_name[0]}${teacherData.last_name[0]}`
    : "ST";

  const navItems = userRole === "admin" ? adminNavItems : teacherNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileHeader 
        title={title || "Staff Portal"} 
        onMenuClick={() => setSidebarOpen(true)}
        showSearch={showSearch}
        searchPlaceholder={searchPlaceholder}
      />

      {/* Mobile Sidebar Drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <SheetTitle className="text-xl font-bold">EduPortal</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-5rem)]">
            {/* User Info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {staffInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{staffName}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {userRole || "Staff"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Admin Settings Section */}
              {userRole === "admin" && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Admin Settings
                  </p>
                  <div className="space-y-1">
                    {adminSettingsItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen w-full overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">EduPortal</span>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {staffInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{staffName}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {userRole || "Staff"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            
            {/* Admin Settings Section */}
            {userRole === "admin" && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Admin Settings
                </p>
                <div className="space-y-1">
                  {adminSettingsItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm",
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Header */}
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              {title && (
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-4">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder={searchPlaceholder}
                    className="pl-10 w-64"
                  />
                </div>
              )}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden">
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};
