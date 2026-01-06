import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  pendingGrades: number;
  newApplications: number;
}

interface UpcomingClass {
  time: string;
  className: string;
  subject: string;
  students: number;
}

const StaffDashboard = () => {
  const { teacherData, userRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userName = teacherData 
    ? `${teacherData.first_name} ${teacherData.last_name}`
    : "Staff Member";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch counts in parallel
        const [studentsRes, classesRes, gradesRes, applicationsRes] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("classes").select("id", { count: "exact", head: true }),
          supabase.from("grades").select("id", { count: "exact", head: true }).eq("status", "draft"),
          supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        ]);

        setStats({
          totalStudents: studentsRes.count || 0,
          totalClasses: classesRes.count || 0,
          pendingGrades: gradesRes.count || 0,
          newApplications: applicationsRes.count || 0,
        });

        // Fetch today's schedule
        const dayOfWeek = new Date().getDay();
        const { data: scheduleData } = await supabase
          .from("schedules")
          .select(`
            start_time,
            end_time,
            room,
            classes (name),
            subjects (name)
          `)
          .eq("day_of_week", dayOfWeek)
          .order("start_time")
          .limit(5);

        if (scheduleData && scheduleData.length > 0) {
          setUpcomingClasses(
            scheduleData.map((s: any) => ({
              time: s.start_time?.slice(0, 5) || "09:00",
              className: s.classes?.name || "Unknown",
              subject: s.subjects?.name || "Unknown",
              students: 30,
            }))
          );
        } else {
          // Fallback demo data
          setUpcomingClasses([
            { time: "09:00", className: "Grade 10A", subject: "Mathematics", students: 32 },
            { time: "11:00", className: "Grade 11B", subject: "Mathematics", students: 28 },
            { time: "14:00", className: "Grade 12A", subject: "Additional Math", students: 24 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <StaffLayout title="Dashboard">
        <DashboardSkeleton />
      </StaffLayout>
    );
  }

  const pendingTasks = [
    { task: "Upload Term 3 grades", due: "Due in 2 days", priority: "high" as const },
    { task: `Review ${stats?.newApplications || 0} applications`, due: "Due in 5 days", priority: "medium" as const },
    { task: "Generate class reports", due: "Due in 7 days", priority: "low" as const },
  ];

  return (
    <StaffLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Good Morning, {userName.split(" ")[0]} 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{currentDate}</span> • You have {upcomingClasses.length} classes today
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/staff/gradebook">
              <Button className="bg-gradient-primary">
                <span className="material-symbols-outlined mr-2">edit_note</span>
                Upload Grades
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="group" label="Total Students" value={stats?.totalStudents?.toString() || "0"} variant="primary" />
          <StatCard icon="book" label="Classes" value={stats?.totalClasses?.toString() || "0"} variant="success" />
          <StatCard icon="assignment" label="Pending Grades" value={stats?.pendingGrades?.toString() || "0"} variant="warning" />
          <StatCard icon="person_add" label="New Applications" value={stats?.newApplications?.toString() || "0"} variant="destructive" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "edit_note", label: "Upload Grades", href: "/staff/gradebook", color: "primary" },
            { icon: "person_add", label: "Admissions", href: "/staff/admissions", color: "success", adminOnly: true },
            { icon: "group", label: "Students", href: "/staff/students", color: "warning" },
            { icon: "fact_check", label: "Attendance", href: "/staff/attendance", color: "info" },
          ].filter(a => !a.adminOnly || userRole === "admin").map((action, idx) => (
            <Link key={idx} to={action.href}>
              <Card className="p-4 card-hover-subtle cursor-pointer group">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`p-3 rounded-lg bg-${action.color}/10 group-hover:bg-${action.color} transition-colors`}>
                    <span className={`material-symbols-outlined text-${action.color} group-hover:text-white text-2xl`}>
                      {action.icon}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Admin Quick Links */}
        {userRole === "admin" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                Admin Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { icon: "person_add", label: "Add Teachers", href: "/staff/admin/teachers" },
                  { icon: "class", label: "Manage Classes", href: "/staff/admin/classes" },
                  { icon: "domain", label: "Departments", href: "/staff/admin/departments" },
                  { icon: "upload_file", label: "Bulk Upload", href: "/staff/admin/students" },
                  { icon: "shield_person", label: "Admin Users", href: "/staff/admin/users" },
                ].map((item, idx) => (
                  <Link key={idx} to={item.href}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
                      <span className="material-symbols-outlined text-primary">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      idx === 0 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-secondary/50 border-border hover:bg-secondary"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center ${
                      idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="text-sm font-medium">{cls.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{cls.className} - {cls.subject}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {cls.students} students
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <span className="material-symbols-outlined mr-1 text-sm">visibility</span>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">pending_actions</span>
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.priority === "high" ? "bg-destructive" :
                      item.priority === "medium" ? "bg-warning" : "bg-success"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{item.task}</p>
                      <p className="text-xs text-muted-foreground">{item.due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
