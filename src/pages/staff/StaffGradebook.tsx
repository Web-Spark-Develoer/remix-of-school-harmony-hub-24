import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { InlineEmptyState } from "@/components/ui/empty-state";
import { BookOpen, Search } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  school_type: string | null;
  grade_level: number;
  specialization: string | null;
}

interface Subject {
  id: string;
  name: string;
}

interface StudentGrade {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  ca: number | null;
  exam: number | null;
  grade_id?: string;
}

interface Term {
  id: string;
  name: string;
}

const StaffGradebook = () => {
  const { toast } = useToast();
  const { teacherData } = useAuth();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [students, setStudents] = useState<StudentGrade[]>([]);
  
  // Filters
  const [schoolType, setSchoolType] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  
  const [grades, setGrades] = useState<Record<string, { ca: number | null; exam: number | null; grade_id?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      const [classesRes, subjectsRes, termsRes] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, school_type, grade_level, specialization")
          .order("grade_level"),
        supabase
          .from("subjects")
          .select("id, name")
          .order("name"),
        supabase
          .from("terms")
          .select("id, name")
          .order("term_number"),
      ]);

      if (classesRes.data) setClasses(classesRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (termsRes.data) {
        setTerms(termsRes.data);
        if (termsRes.data.length > 0) {
          setSelectedTerm(termsRes.data[termsRes.data.length - 1].id);
        }
      }

      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  // Filter classes by school type
  const filteredClasses = schoolType
    ? classes.filter(c => c.school_type === schoolType)
    : classes;

  // Fetch students and grades when class/term/subject changes
  useEffect(() => {
    if (!selectedClass || !selectedTerm || !selectedSubject) {
      setStudents([]);
      setGrades({});
      return;
    }

    const fetchStudentsAndGrades = async () => {
      setIsLoading(true);

      // Fetch students in this class
      const { data: studentData } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_id")
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("last_name");

      if (!studentData || studentData.length === 0) {
        setStudents([]);
        setGrades({});
        setIsLoading(false);
        return;
      }

      // Fetch existing grades
      const { data: gradeData } = await supabase
        .from("grades")
        .select("id, student_id, continuous_assessment, exam_score")
        .eq("class_id", selectedClass)
        .eq("subject_id", selectedSubject)
        .eq("term_id", selectedTerm);

      const gradeMap: Record<string, { ca: number | null; exam: number | null; grade_id?: string }> = {};
      gradeData?.forEach((g) => {
        gradeMap[g.student_id] = {
          ca: g.continuous_assessment,
          exam: g.exam_score,
          grade_id: g.id,
        };
      });

      const studentGrades: StudentGrade[] = studentData.map((s) => ({
        id: s.id,
        student_id: s.id,
        student_name: `${s.first_name} ${s.last_name}`,
        student_code: s.student_id,
        ca: gradeMap[s.id]?.ca || null,
        exam: gradeMap[s.id]?.exam || null,
        grade_id: gradeMap[s.id]?.grade_id,
      }));

      setStudents(studentGrades);
      setGrades(gradeMap);
      setIsLoading(false);
    };

    fetchStudentsAndGrades();
  }, [selectedClass, selectedTerm, selectedSubject]);

  // Filter students by search
  const filteredStudents = studentSearch
    ? students.filter(s => 
        s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.student_code.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students;

  const updateGrade = (studentId: string, field: "ca" | "exam", value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: numValue },
    }));
  };

  const calculateTotal = (studentId: string): number | string => {
    const grade = grades[studentId];
    if (!grade || grade.exam === null) return "-";
    return (grade.ca || 0) + (grade.exam || 0);
  };

  const calculateLetterGrade = (total: number | string): string => {
    if (total === "-") return "-";
    const t = typeof total === "string" ? parseFloat(total) : total;
    if (t >= 80) return "A";
    if (t >= 75) return "A-";
    if (t >= 70) return "B+";
    if (t >= 65) return "B";
    if (t >= 60) return "B-";
    if (t >= 55) return "C+";
    if (t >= 50) return "C";
    if (t >= 45) return "C-";
    if (t >= 40) return "D";
    return "F";
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedTerm || !selectedSubject) {
      toast({ title: "Error", description: "Please select school, class, subject and term", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      for (const student of students) {
        const grade = grades[student.id];
        if (!grade) continue;

        const gradeRecord = {
          student_id: student.id,
          class_id: selectedClass,
          subject_id: selectedSubject,
          term_id: selectedTerm,
          continuous_assessment: grade.ca,
          exam_score: grade.exam,
          status: "draft" as const,
          entered_by: teacherData?.id || null,
        };

        if (grade.grade_id) {
          await supabase.from("grades").update(gradeRecord).eq("id", grade.grade_id);
        } else if (grade.ca !== null || grade.exam !== null) {
          await supabase.from("grades").insert(gradeRecord);
        }
      }

      toast({ title: "Saved!", description: "Grades have been saved as draft." });
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({ title: "Error", description: "Failed to save grades", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    await handleSave();
    
    if (!selectedClass || !selectedSubject) return;

    try {
      await supabase
        .from("grades")
        .update({ status: "submitted" })
        .eq("class_id", selectedClass)
        .eq("subject_id", selectedSubject)
        .eq("term_id", selectedTerm)
        .eq("status", "draft");

      toast({ title: "Submitted!", description: "Grades submitted for admin approval." });
    } catch (error) {
      console.error("Error submitting grades:", error);
      toast({ title: "Error", description: "Failed to submit grades", variant: "destructive" });
    }
  };

  return (
    <StaffLayout title="Gradebook">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Grade Entry</h2>
            <p className="text-muted-foreground text-sm">Upload student grades by class and subject</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave} disabled={isSaving || !selectedClass || !selectedSubject}>
              <span className="material-symbols-outlined mr-2 text-lg">save</span>
              Save Draft
            </Button>
            <Button onClick={handleSubmitForApproval} disabled={isSaving || !selectedClass || !selectedSubject}>
              <span className="material-symbols-outlined mr-2 text-lg">send</span>
              Submit
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* School Type */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">School</label>
                <Select value={schoolType} onValueChange={(v) => {
                  setSchoolType(v);
                  setSelectedClass("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upper_basic">Upper Basic School</SelectItem>
                    <SelectItem value="senior_secondary">Senior Secondary School</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Class */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!schoolType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subj) => (
                      <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Term */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Search */}
            {selectedClass && selectedSubject && (
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name or ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Grade Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={6} />
            ) : !selectedClass || !selectedSubject ? (
              <InlineEmptyState icon={BookOpen} title="Select Class & Subject" description="Choose a school, class and subject above to view and enter grades" />
            ) : filteredStudents.length === 0 ? (
              <InlineEmptyState icon={BookOpen} title="No Students" description={studentSearch ? "No students match your search" : "No students found in this class"} />
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-24">CA (30)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-24">Exam (70)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-20">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-20">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const total = calculateTotal(student.id);
                      const letterGrade = calculateLetterGrade(total);
                      return (
                        <tr key={student.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4">
                            <p className="font-medium text-foreground">{student.student_name}</p>
                            <p className="text-xs text-muted-foreground">{student.student_code}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              value={grades[student.id]?.ca ?? ""}
                              onChange={(e) => updateGrade(student.id, "ca", e.target.value)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              max="70"
                              value={grades[student.id]?.exam ?? ""}
                              onChange={(e) => updateGrade(student.id, "exam", e.target.value)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-foreground">{total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              letterGrade === "A" || letterGrade === "A-" ? "bg-success/10 text-success" :
                              letterGrade.startsWith("B") ? "bg-primary/10 text-primary" :
                              letterGrade.startsWith("C") ? "bg-warning/10 text-warning" :
                              letterGrade === "F" ? "bg-destructive/10 text-destructive" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {letterGrade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default StaffGradebook;