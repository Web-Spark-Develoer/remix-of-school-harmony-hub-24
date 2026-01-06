import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  notifications?: number;
}

export const Header = ({
  title,
  showSearch = true,
  searchPlaceholder = "Search...",
  actions,
  notifications = 0,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 transition-colors z-10">
      {/* Mobile Menu */}
      <div className="flex items-center gap-4 md:hidden">
        <button className="text-muted-foreground hover:text-foreground">
          <span className="material-symbols-outlined">menu</span>
        </button>
        {title && <span className="font-bold text-lg text-foreground">{title}</span>}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="hidden md:flex flex-1 max-w-lg">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10 bg-secondary border-transparent focus:border-primary focus:bg-background"
            />
          </div>
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
          <span className="material-symbols-outlined">notifications</span>
          {notifications > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full ring-2 ring-card"></span>
          )}
        </button>

        {/* Custom Actions */}
        {actions}
      </div>
    </header>
  );
};
