import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, GraduationCap, TrendingUp, Award } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TermGrades {
  term: string;
  gpa: number;
  subjects: { subject: string; grade: string; score: number }[];
}

const StudentTranscript = () => {
  const { studentData } = useAuth();
  const [allTermsGrades, setAllTermsGrades] = useState<TermGrades[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTranscriptData = async () => {
      if (!studentData?.id) return;

      try {
        // Fetch all grades for this student grouped by term
        const { data: gradesData } = await supabase
          .from("grades")
          .select(`
            total_score, letter_grade,
            terms (name),
            subjects (name)
          `)
          .eq("student_id", studentData.id)
          .order("created_at");

        // Group by term
        const termMap: Record<string, TermGrades> = {};
        
        gradesData?.forEach((g: any) => {
          const termName = g.terms?.name || "Unknown Term";
          if (!termMap[termName]) {
            termMap[termName] = {
              term: termName,
              gpa: 0,
              subjects: [],
            };
          }
          termMap[termName].subjects.push({
            subject: g.subjects?.name || "Unknown",
            grade: g.letter_grade || "N/A",
            score: g.total_score || 0,
          });
        });

        // Calculate GPA for each term
        Object.values(termMap).forEach((term) => {
          const totalPoints = term.subjects.reduce((sum, s) => {
            const gradePoints: Record<string, number> = {
              'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
              'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0
            };
            return sum + (gradePoints[s.grade] || 0);
          }, 0);
          term.gpa = term.subjects.length > 0 ? totalPoints / term.subjects.length : 0;
        });

        setAllTermsGrades(Object.values(termMap));
      } catch (error) {
        console.error("Error fetching transcript:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranscriptData();
  }, [studentData?.id]);

  // Calculate CGPA
  const cgpa = allTermsGrades.length > 0 
    ? (allTermsGrades.reduce((sum, term) => sum + term.gpa, 0) / allTermsGrades.length).toFixed(2)
    : "0.00";

  const studentName = studentData 
    ? `${studentData.first_name} ${studentData.last_name}`.toUpperCase()
    : "STUDENT";

  if (isLoading) {
    return (
      <StudentLayout title="Transcript">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Transcript">
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">Academic Transcript</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete academic history
          </p>
        </div>

        {/* Important Notice */}
        <Alert className="animate-fade-up animation-delay-100 border-warning/50 bg-warning/5">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> Full transcripts are only available upon graduation. 
            For official transcript requests, please contact the school registrar's office.
          </AlertDescription>
        </Alert>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up animation-delay-200">
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-4 text-center">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-primary">{cgpa}</p>
              <p className="text-xs text-muted-foreground">CGPA</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-3xl font-bold text-foreground">{allTermsGrades.length}</p>
              <p className="text-xs text-muted-foreground">Terms</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-3xl font-bold text-foreground">
                {allTermsGrades.reduce((sum, t) => sum + t.subjects.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-4 text-center">
              <Badge variant="secondary" className="text-sm">
                In Progress
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Info */}
        <Card className="rounded-2xl shadow-card animate-fade-up animation-delay-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {studentData?.first_name?.charAt(0) || "S"}
                </span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">{studentName}</h2>
                <p className="text-sm text-muted-foreground">
                  Student ID: {studentData?.student_id || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Term Records */}
        <Card className="rounded-2xl shadow-card overflow-hidden animate-fade-up animation-delay-400">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="material-symbols-outlined text-primary">history_edu</span>
              Academic History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {allTermsGrades.length === 0 ? (
              <div className="p-8 text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No academic records available yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allTermsGrades.map((term, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-foreground">{term.term}</span>
                      <Badge variant="outline" className="font-bold">
                        GPA: {term.gpa.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {term.subjects.map((subject, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground truncate">{subject.subject}</p>
                          <p className={`text-lg font-bold ${
                            subject.grade.startsWith("A") ? "text-success" :
                            subject.grade.startsWith("B") ? "text-primary" :
                            subject.grade.startsWith("C") ? "text-warning" :
                            "text-destructive"
                          }`}>
                            {subject.grade}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Download Notice */}
        <Card className="rounded-2xl shadow-card bg-muted/30 animate-fade-up animation-delay-500">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">
              To request an official transcript, please visit the registrar's office or contact the school administration.
            </p>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentTranscript;