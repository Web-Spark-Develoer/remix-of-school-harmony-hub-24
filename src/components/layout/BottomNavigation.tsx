import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, FileText, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  href: string;
}

const studentNavItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/student" },
  { icon: BookOpen, label: "Grades", href: "/student/grades" },
  { icon: FileText, label: "Reports", href: "/student/reports" },
  { icon: Calendar, label: "Schedule", href: "/student/schedule" },
  { icon: User, label: "Profile", href: "/student/settings" },
];

export const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {studentNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
