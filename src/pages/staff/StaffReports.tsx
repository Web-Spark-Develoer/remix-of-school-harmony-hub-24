import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Users, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ClassData {
  id: string;
  name: string;
}

interface TermData {
  id: string;
  name: string;
}

interface GradeStats {
  total_students: number;
  grades_entered: number;
  average_score: number;
  grade_distribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

const StaffReports = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [terms, setTerms] = useState<TermData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch classes and terms
  useEffect(() => {
    const fetchData = async () => {
      const [classRes, termRes] = await Promise.all([
        supabase.from("classes").select("id, name").order("grade_level"),
        supabase.from("terms").select("id, name").order("term_number"),
      ]);

      setClasses(classRes.data || []);
      setTerms(termRes.data || []);
    };

    fetchData();
  }, []);

  // Fetch stats when class and term are selected
  useEffect(() => {
    if (!selectedClass || !selectedTerm) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);

      // Get students in class
      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("class_id", selectedClass)
        .eq("status", "active");

      // Get grades for this class and term
      const { data: grades } = await supabase
        .from("grades")
        .select("total_score, letter_grade")
        .eq("class_id", selectedClass)
        .eq("term_id", selectedTerm);

      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      let totalScore = 0;

      grades?.forEach((g) => {
        totalScore += g.total_score || 0;
        const letter = g.letter_grade?.charAt(0) || "F";
        if (letter in gradeDistribution) {
          gradeDistribution[letter as keyof typeof gradeDistribution]++;
        }
      });

      setStats({
        total_students: studentCount || 0,
        grades_entered: grades?.length || 0,
        average_score: grades?.length ? Math.round(totalScore / grades.length) : 0,
        grade_distribution: gradeDistribution,
      });

      setIsLoading(false);
    };

    fetchStats();
  }, [selectedClass, selectedTerm]);

  return (
    <StaffLayout title="Reports">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Select Class
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Select Term
                </label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && !isLoading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Users className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {stats.total_students}
                  </p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <FileText className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {stats.grades_entered}
                  </p>
                  <p className="text-sm text-muted-foreground">Grades Entered</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  {stats.average_score >= 60 ? (
                    <TrendingUp className="w-8 h-8 mx-auto text-success mb-2" />
                  ) : (
                    <TrendingDown className="w-8 h-8 mx-auto text-destructive mb-2" />
                  )}
                  <p className="text-2xl font-bold text-foreground">
                    {stats.average_score}%
                  </p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="flex justify-center gap-1 mb-2">
                    <Badge className="bg-success text-success-foreground">A</Badge>
                    <Badge className="bg-primary text-primary-foreground">B</Badge>
                    <Badge className="bg-warning text-warning-foreground">C</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(
                      ((stats.grade_distribution.A + stats.grade_distribution.B) /
                        Math.max(stats.grades_entered, 1)) *
                        100
                    )}%
                  </p>
                  <p className="text-sm text-muted-foreground">Pass Rate (A-B)</p>
                </CardContent>
              </Card>
            </div>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.grade_distribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center gap-4">
                      <Badge
                        className={
                          grade === "A"
                            ? "bg-success text-success-foreground w-8 justify-center"
                            : grade === "B"
                            ? "bg-primary text-primary-foreground w-8 justify-center"
                            : grade === "C"
                            ? "bg-warning text-warning-foreground w-8 justify-center"
                            : grade === "D"
                            ? "bg-muted text-muted-foreground w-8 justify-center"
                            : "bg-destructive text-destructive-foreground w-8 justify-center"
                        }
                      >
                        {grade}
                      </Badge>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            grade === "A"
                              ? "bg-success"
                              : grade === "B"
                              ? "bg-primary"
                              : grade === "C"
                              ? "bg-warning"
                              : grade === "D"
                              ? "bg-muted-foreground"
                              : "bg-destructive"
                          }`}
                          style={{
                            width: `${
                              (count / Math.max(stats.grades_entered, 1)) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Button */}
            <div className="flex justify-end">
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl mr-3">progress_activity</span>
            <span className="text-muted-foreground">Loading report data...</span>
          </div>
        )}

        {!selectedClass || !selectedTerm ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select Filters
              </h3>
              <p className="text-muted-foreground">
                Choose a class and term above to view reports
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </StaffLayout>
  );
};

export default StaffReports;
