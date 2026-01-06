import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Award,
  Clock,
  ChevronRight,
  BarChart3,
  GraduationCap
} from "lucide-react";

interface Grade {
  id: string;
  total_score: number | null;
  letter_grade: string | null;
  subjects: { name: string } | null;
}

interface TermResult {
  gpa: number | null;
  class_position: number | null;
  class_size: number | null;
  terms: { name: string } | null;
}

const StudentDashboard = () => {
  const { studentData } = useAuth();
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [termResult, setTermResult] = useState<TermResult | null>(null);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentData?.id) return;

      try {
        const { data: grades } = await supabase
          .from("grades")
          .select(`id, total_score, letter_grade, subjects (name)`)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (grades) setRecentGrades(grades);

        const { data: result } = await supabase
          .from("term_results")
          .select(`gpa, class_position, class_size, terms (name)`)
          .eq("student_id", studentData.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (result) setTermResult(result);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentData?.id]);

  const upcomingClasses = [
    { time: "08:00", subject: "English Language", room: "Room 101", color: "bg-gradient-primary" },
    { time: "10:00", subject: "Mathematics", room: "Room 204", color: "bg-gradient-purple" },
    { time: "12:00", subject: "History", room: "Room 108", color: "bg-gradient-orange" },
  ];

  const quickActions = [
    { icon: BookOpen, label: "Grades", href: "/student/grades", color: "bg-primary/10 text-primary" },
    { icon: FileText, label: "Reports", href: "/student/reports", color: "bg-success/10 text-success" },
    { icon: Calendar, label: "Schedule", href: "/student/schedule", color: "bg-orange/10 text-orange" },
    { icon: GraduationCap, label: "Transcript", href: "/student/transcript", color: "bg-purple/10 text-purple" },
  ];

  const getGradeColor = (grade: string | null) => {
    switch(grade) {
      case 'A': return 'text-success bg-success/10';
      case 'B': return 'text-primary bg-primary/10';
      case 'C': return 'text-warning bg-warning/10';
      default: return 'text-destructive bg-destructive/10';
    }
  };

  return (
    <StudentLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="animate-fade-up">
          <p className="text-muted-foreground text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1">
            {studentData?.first_name || "Student"} 👋
          </h1>
        </div>

        {/* Stats Cards - Modern Grid */}
        <div className="grid grid-cols-2 gap-3 animate-fade-up animation-delay-100">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              {/* GPA Card */}
              <Card className="bg-gradient-primary text-primary-foreground rounded-2xl border-0 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-primary-foreground/70 text-xs font-medium">Term GPA</p>
                      <p className="text-3xl font-bold mt-1">
                        {termResult?.gpa?.toFixed(2) || "N/A"}
                      </p>
                    </div>
                    <div className="p-2 bg-primary-foreground/20 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={termResult?.gpa ? (termResult.gpa / 4) * 100 : 0} className="h-1.5 bg-primary-foreground/20" />
                  </div>
                </CardContent>
              </Card>

              {/* Rank Card */}
              <Card className="bg-card rounded-2xl shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">Class Rank</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {termResult?.class_position || "N/A"}
                        {termResult?.class_size && (
                          <span className="text-sm text-muted-foreground font-normal">/{termResult.class_size}</span>
                        )}
                      </p>
                    </div>
                    <div className="p-2 bg-warning/10 rounded-xl">
                      <Award className="w-5 h-5 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CGPA Card */}
              <Card className="bg-card rounded-2xl shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">Cumulative GPA</p>
                      <p className="text-3xl font-bold text-foreground mt-1">3.06</p>
                    </div>
                    <div className="p-2 bg-success/10 rounded-xl">
                      <BarChart3 className="w-5 h-5 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Term Card */}
              <Card className="bg-card rounded-2xl shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">Current Term</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {termResult?.terms?.name || "Term 1"}
                      </p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-up animation-delay-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={action.href}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card shadow-card hover:shadow-lg transition-all duration-200 card-interactive">
                  <div className={`p-3 rounded-xl ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="animate-fade-up animation-delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Today's Schedule
            </h2>
            <Link to="/student/schedule">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {upcomingClasses.map((cls, idx) => (
              <Card 
                key={idx} 
                className={`rounded-2xl border-0 overflow-hidden transition-all duration-200 ${
                  idx === 0 ? 'shadow-glow' : 'shadow-card'
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 ${cls.color}`}></div>
                    <div className="flex-1 p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${cls.color} flex items-center justify-center shrink-0`}>
                        <span className="text-primary-foreground font-bold text-sm">{cls.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{cls.subject}</p>
                        <p className="text-sm text-muted-foreground">{cls.room}</p>
                      </div>
                      {idx === 0 && (
                        <span className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                          Now
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="animate-fade-up animation-delay-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Recent Grades
            </h2>
            <Link to="/student/grades">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-0 divide-y divide-border">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : recentGrades.length > 0 ? (
                recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {grade.subjects?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">{grade.total_score || 0}%</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${getGradeColor(grade.letter_grade)}`}>
                      {grade.letter_grade || "N/A"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No grades available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
