import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, BarChart3, Trophy, BookOpen, History, ChevronDown } from "lucide-react";

interface Grade {
  id: string;
  continuous_assessment: number | null;
  exam_score: number | null;
  total_score: number | null;
  letter_grade: string | null;
  remark: string | null;
  subjects: { name: string } | null;
  terms: { id: string; name: string } | null;
}

interface TermResult {
  gpa: number | null;
  class_position: number | null;
  class_size: number | null;
  terms: { id: string; name: string } | null;
}

interface GroupedGrades {
  [termId: string]: {
    termName: string;
    grades: Grade[];
    gpa: number | null;
  };
}

const StudentGrades = () => {
  const { studentData } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTermId, setCurrentTermId] = useState<string | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentData?.id) return;

      try {
        const { data: gradesData } = await supabase
          .from("grades")
          .select(`
            id, continuous_assessment, exam_score, total_score, letter_grade, remark,
            subjects (name), terms (id, name)
          `)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false });

        if (gradesData) setGrades(gradesData);

        const { data: results } = await supabase
          .from("term_results")
          .select(`gpa, class_position, class_size, terms (id, name)`)
          .eq("student_id", studentData.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (results) setTermResults(results);

        const { data: currentTerm } = await supabase
          .from("terms")
          .select("id")
          .eq("is_current", true)
          .maybeSingle();

        if (currentTerm) setCurrentTermId(currentTerm.id);
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [studentData?.id]);

  const groupedGrades: GroupedGrades = grades.reduce((acc, grade) => {
    const termId = grade.terms?.id || "unknown";
    const termName = grade.terms?.name || "Unknown Term";
    
    if (!acc[termId]) {
      const termResult = termResults.find(tr => tr.terms?.id === termId);
      acc[termId] = { termName, grades: [], gpa: termResult?.gpa || null };
    }
    acc[termId].grades.push(grade);
    return acc;
  }, {} as GroupedGrades);

  const currentTermResult = termResults[0];
  const cumulativeGpa = termResults.length > 0
    ? termResults.reduce((sum, tr) => sum + (tr.gpa || 0), 0) / termResults.length
    : null;

  const currentTermGrades = currentTermId ? groupedGrades[currentTermId] : null;
  const previousTerms = Object.entries(groupedGrades).filter(([id]) => id !== currentTermId);

  const getGradeColor = (grade: string | null) => {
    switch(grade) {
      case 'A': return 'bg-success text-success-foreground';
      case 'B': return 'bg-primary text-primary-foreground';
      case 'C': return 'bg-warning text-warning-foreground';
      default: return 'bg-destructive text-destructive-foreground';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedGrades(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return (
    <StudentLayout title="My Grades">
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">My Grades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View your academic performance
          </p>
        </div>

        {/* GPA Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 animate-fade-up animation-delay-100">
            <Card className="bg-gradient-primary text-primary-foreground rounded-2xl border-0">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-xs opacity-80">Term GPA</p>
                <p className="text-2xl font-bold">
                  {currentTermResult?.gpa?.toFixed(2) || "N/A"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-5 h-5 mx-auto mb-1 text-success" />
                <p className="text-xs text-muted-foreground">CGPA</p>
                <p className="text-2xl font-bold text-foreground">
                  {cumulativeGpa?.toFixed(2) || "N/A"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-4 text-center">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-warning" />
                <p className="text-xs text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold text-foreground">
                  {currentTermResult?.class_position || "N/A"}
                  {currentTermResult?.class_size && (
                    <span className="text-sm text-muted-foreground font-normal">/{currentTermResult.class_size}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grades Tabs */}
        <Tabs defaultValue="current" className="animate-fade-up animation-delay-200">
          <TabsList className="w-full grid grid-cols-2 rounded-2xl bg-muted p-1 h-12">
            <TabsTrigger value="current" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Current Term
            </TabsTrigger>
            <TabsTrigger value="previous" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Previous Terms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            {loading ? (
              <Card className="rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </CardContent>
              </Card>
            ) : currentTermGrades?.grades.length ? (
              <div className="space-y-3">
                {currentTermGrades.grades.map((grade) => (
                  <Card 
                    key={grade.id} 
                    className={`rounded-2xl shadow-card overflow-hidden transition-all duration-200 ${
                      grade.letter_grade === "F" ? "border-destructive/30" : ""
                    }`}
                  >
                    <CardContent className="p-0">
                      <button 
                        onClick={() => toggleExpand(grade.id)}
                        className="w-full p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">
                              {grade.subjects?.name || "Unknown Subject"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total: {grade.total_score || 0}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${getGradeColor(grade.letter_grade)}`}>
                            {grade.letter_grade || "N/A"}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                            expandedGrades.includes(grade.id) ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>
                      
                      {expandedGrades.includes(grade.id) && (
                        <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3 bg-muted rounded-xl">
                              <p className="text-xs text-muted-foreground">CA Score</p>
                              <p className="font-bold text-foreground">{grade.continuous_assessment || 0}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-xl">
                              <p className="text-xs text-muted-foreground">Exam</p>
                              <p className="font-bold text-foreground">{grade.exam_score || 0}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl">
                              <p className="text-xs text-primary">Total</p>
                              <p className="font-bold text-primary">{grade.total_score || 0}</p>
                            </div>
                          </div>
                          {grade.remark && (
                            <p className={`text-sm mt-3 ${
                              grade.letter_grade === "F" ? "text-destructive" : "text-muted-foreground"
                            }`}>
                              {grade.remark}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {/* Term GPA Summary */}
                {currentTermGrades.gpa && (
                  <Card className="rounded-2xl bg-gradient-primary text-primary-foreground border-0">
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="font-semibold">Term GPA</span>
                      <span className="text-2xl font-bold">
                        {currentTermGrades.gpa.toFixed(2)}
                      </span>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No grades available for current term</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="previous" className="mt-4 space-y-4">
            {loading ? (
              <Card className="rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </CardContent>
              </Card>
            ) : previousTerms.length > 0 ? (
              previousTerms.map(([termId, termData]) => (
                <Card key={termId} className="rounded-2xl shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{termData.termName}</span>
                      </div>
                      {termData.gpa && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-xl text-sm font-bold">
                          GPA: {termData.gpa.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {termData.grades.map((grade) => (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted"
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {grade.subjects?.name || "Unknown Subject"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total: {grade.total_score || 0}%
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getGradeColor(grade.letter_grade)}`}>
                            {grade.letter_grade || "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="p-8 text-center">
                  <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No previous term grades available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
};

export default StudentGrades;
