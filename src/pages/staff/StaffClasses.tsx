import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, BookOpen, ClipboardCheck, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";

interface ClassData {
  id: string;
  name: string;
  grade_level: number;
  section: string;
  capacity: number | null;
  student_count: number;
}

const StaffClasses = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(`id, name, grade_level, section, capacity`)
        .order("grade_level");

      if (classError) {
        console.error("Error fetching classes:", classError);
        setIsLoading(false);
        return;
      }

      const classesWithCounts = await Promise.all(
        (classData || []).map(async (cls) => {
          const { count } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id)
            .eq("status", "active");

          return { ...cls, student_count: count || 0 };
        })
      );

      setClasses(classesWithCounts);
      setIsLoading(false);
    };

    fetchClasses();
  }, []);

  if (isLoading) {
    return (
      <StaffLayout title="Classes">
        <DashboardSkeleton />
      </StaffLayout>
    );
  }

  return (
    <StaffLayout title="Classes">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Total Classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">
                {classes.reduce((sum, cls) => sum + cls.student_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">
                {new Set(classes.map((c) => c.grade_level)).size}
              </p>
              <p className="text-sm text-muted-foreground">Grade Levels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">
                {Math.round(
                  classes.reduce((sum, cls) => sum + cls.student_count, 0) /
                    Math.max(classes.length, 1)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Avg. Class Size</p>
            </CardContent>
          </Card>
        </div>

        {/* Class Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Section {cls.section}
                    </p>
                  </div>
                  <Badge variant="secondary">Grade {cls.grade_level}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {cls.student_count} / {cls.capacity || "∞"} Students
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link to={`/staff/students?class=${cls.id}`}>
                      <Users className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link to={`/staff/attendance?class=${cls.id}`}>
                      <ClipboardCheck className="w-4 h-4 mr-1" />
                      Attend
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link to={`/staff/gradebook?class=${cls.id}`}>
                      <FileText className="w-4 h-4 mr-1" />
                      Grades
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {classes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Classes Found
              </h3>
              <p className="text-muted-foreground">
                Classes will appear here once they are set up in the system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffClasses;
