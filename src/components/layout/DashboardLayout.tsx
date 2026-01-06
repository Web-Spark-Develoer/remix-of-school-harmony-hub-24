import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "student" | "teacher" | "admin";
  userName: string;
  userSubtitle: string;
  headerTitle?: string;
  searchPlaceholder?: string;
  headerActions?: ReactNode;
  notifications?: number;
}

const studentNavItems = [
  { icon: "dashboard", label: "Dashboard", href: "/student" },
  { icon: "grade", label: "My Grades", href: "/student/grades" },
  { icon: "library_books", label: "My Classes", href: "/student/classes" },
  { icon: "calendar_today", label: "Schedule", href: "/student/schedule" },
  { icon: "description", label: "Reports", href: "/student/reports" },
  { icon: "chat", label: "Messages", href: "/student/messages" },
];

const teacherNavItems = [
  { icon: "dashboard", label: "Dashboard", href: "/staff" },
  { icon: "group", label: "Students", href: "/staff/students" },
  { icon: "book", label: "Classes", href: "/staff/classes" },
  { icon: "edit_note", label: "Gradebook", href: "/staff/gradebook" },
  { icon: "analytics", label: "Reports", href: "/staff/reports" },
  { icon: "chat", label: "Messages", href: "/staff/messages" },
];

const adminNavItems = [
  { icon: "dashboard", label: "Dashboard", href: "/staff" },
  { icon: "person_add", label: "Admissions", href: "/staff/admissions" },
  { icon: "group", label: "Students", href: "/staff/students" },
  { icon: "school", label: "Teachers", href: "/staff/teachers" },
  { icon: "book", label: "Classes", href: "/staff/classes" },
  { icon: "edit_note", label: "Gradebook", href: "/staff/gradebook" },
  { icon: "analytics", label: "Reports", href: "/staff/reports" },
  { icon: "settings", label: "System", href: "/staff/system" },
];

export const DashboardLayout = ({
  children,
  userType,
  userName,
  userSubtitle,
  headerTitle,
  searchPlaceholder,
  headerActions,
  notifications,
}: DashboardLayoutProps) => {
  const navigate = useNavigate();

  const navItems = 
    userType === "student" 
      ? studentNavItems 
      : userType === "admin" 
        ? adminNavItems 
        : teacherNavItems;

  const handleLogout = () => {
    // For now, just navigate to home
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar
          navItems={navItems}
          userType={userType}
          userName={userName}
          userSubtitle={userSubtitle}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          title={headerTitle}
          searchPlaceholder={searchPlaceholder}
          actions={headerActions}
          notifications={notifications}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
          {children}
        </div>
      </main>
    </div>
  );
};
