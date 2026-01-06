import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Calendar, 
  User,
  LogOut,
  GraduationCap,
  Menu,
  Bell,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { icon: Home, label: "Home", href: "/student" },
  { icon: BookOpen, label: "Grades", href: "/student/grades" },
  { icon: FileText, label: "Reports", href: "/student/reports" },
  { icon: Calendar, label: "Schedule", href: "/student/schedule" },
  { icon: User, label: "Profile", href: "/student/settings" },
];

export const StudentLayout = ({ children, title }: StudentLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, studentData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const studentName = studentData 
    ? `${studentData.first_name} ${studentData.last_name}`
    : "Student";

  const studentInitials = studentData
    ? `${studentData.first_name?.[0] || ''}${studentData.last_name?.[0] || ''}`
    : "ST";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - Modern Glass Design */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border/50 safe-top">
        <div className="flex items-center justify-between px-4 h-16">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">{title || "EduPortal"}</span>
          </div>
          
          <button className="p-2 -mr-2 rounded-xl hover:bg-muted transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 border-r-0">
          <SheetHeader className="p-6 bg-gradient-primary text-primary-foreground">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-primary-foreground/30">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-lg font-bold">
                  {studentInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <SheetTitle className="text-primary-foreground font-bold truncate">
                  {studentName}
                </SheetTitle>
                <p className="text-primary-foreground/70 text-sm truncate">
                  {studentData?.student_id || "Student"}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-8rem)]">
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
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl py-3"
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
        <aside className="w-72 bg-card border-r border-border flex flex-col shrink-0">
          {/* Logo & User */}
          <div className="p-6 bg-gradient-primary text-primary-foreground">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">EduPortal</span>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="border-2 border-primary-foreground/30">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold">
                  {studentInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary-foreground truncate">{studentName}</p>
                <p className="text-sm text-primary-foreground/70 truncate">
                  {studentData?.student_id || "Student"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
              Menu
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 lg:p-8 max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden pt-16 pb-20">
        <div className="p-4">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Modern Floating Design */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-card rounded-2xl shadow-lg border border-border/50 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 rounded-xl",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
