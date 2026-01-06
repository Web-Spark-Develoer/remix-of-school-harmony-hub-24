import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MobileHeaderProps {
  title?: string;
  onMenuClick: () => void;
  notifications?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export const MobileHeader = ({
  title = "EduPortal",
  onMenuClick,
  notifications = 0,
  showSearch = false,
  searchPlaceholder = "Search...",
}: MobileHeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
          {!searchOpen && (
            <h1 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <>
              {searchOpen ? (
                <Input
                  type="search"
                  placeholder={searchPlaceholder}
                  className="w-48 h-9"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notifications > 9 ? "9+" : notifications}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
