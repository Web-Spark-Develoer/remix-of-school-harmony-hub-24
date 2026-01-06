import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
}

interface SidebarProps {
  navItems: NavItem[];
  userType: "student" | "teacher" | "admin";
  userName: string;
  userSubtitle: string;
  onLogout?: () => void;
}

export const Sidebar = ({ navItems, userType, userName, userSubtitle, onLogout }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full flex-shrink-0 transition-colors">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <span className="material-symbols-outlined text-primary text-2xl">school</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight text-foreground">EduPortal</h1>
          <p className="text-muted-foreground text-xs capitalize">{userType} Access</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className={cn("material-symbols-outlined", isActive && "filled")}>
                {item.icon}
              </span>
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-border">
        <Link
          to={`/${userType}/settings`}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-1"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium">Logout</span>
        </button>
        
        {/* User Info */}
        <div className="mt-4 flex items-center gap-3 px-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {userName.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">{userName}</span>
            <span className="text-xs text-muted-foreground truncate">{userSubtitle}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
