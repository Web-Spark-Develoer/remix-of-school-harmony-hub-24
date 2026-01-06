import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Download, Eye, GraduationCap, Loader2, ChevronRight } from "lucide-react";

interface Term {
  id: string;
  name: string;
}

interface Grade {
  continuous_assessment: number | null;
  exam_score: number | null;
  total_score: number | null;
  letter_grade: string | null;
  remark: string | null;
  subjects: { name: string } | null;
}

interface TermResult {
  gpa: number | null;
  class_position: number | null;
  class_size: number | null;
  teacher_comment: string | null;
  principal_comment: string | null;
}

const StudentReports = () => {
  const { toast } = useToast();
  const { studentData } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [termResult, setTermResult] = useState<TermResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const { data } = await supabase
          .from("terms")
          .select("id, name")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setTerms(data);
          setSelectedTerm(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  useEffect(() => {
    const fetchGradesForTerm = async () => {
      if (!studentData?.id || !selectedTerm) return;

      try {
        const { data: gradesData } = await supabase
          .from("grades")
          .select(`
            continuous_assessment, exam_score, total_score, letter_grade, remark,
            subjects (name)
          `)
          .eq("student_id", studentData.id)
          .eq("term_id", selectedTerm);

        if (gradesData) setGrades(gradesData);

        const { data: result } = await supabase
          .from("term_results")
          .select(`gpa, class_position, class_size, teacher_comment, principal_comment`)
          .eq("student_id", studentData.id)
          .eq("term_id", selectedTerm)
          .eq("is_published", true)
          .maybeSingle();

        setTermResult(result);
      } catch (error) {
        console.error("Error fetching grades:", error);
      }
    };

    fetchGradesForTerm();
  }, [studentData?.id, selectedTerm]);

  const generatePDF = () => {
    if (!studentData) return;
    
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const selectedTermName = terms.find(t => t.id === selectedTerm)?.name || "Term";
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("JARRENG VILLAGE SCHOOLS", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Niamina East District, The Gambia", pageWidth / 2, 28, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("TERM REPORT", pageWidth / 2, 40, { align: "center" });
      
      doc.setDrawColor(19, 127, 236);
      doc.setLineWidth(0.5);
      doc.line(20, 45, pageWidth - 20, 45);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Student Information", 20, 55);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Student ID: ${studentData.student_id}`, 20, 63);
      doc.text(`Student Name: ${studentData.first_name} ${studentData.last_name}`, 20, 70);
      doc.text(`Term: ${selectedTermName}`, 20, 77);
      
      doc.setFont("helvetica", "bold");
      doc.text("ACADEMIC RECORDS", 20, 91);
      
      if (grades.length > 0) {
        autoTable(doc, {
          startY: 96,
          head: [["Subject", "CA", "Exam", "Total", "Grade", "Remark"]],
          body: grades.map(row => [
            row.subjects?.name || "N/A",
            (row.continuous_assessment || 0).toString(),
            (row.exam_score || 0).toString(),
            (row.total_score || 0).toString(),
            row.letter_grade || "N/A",
            row.remark || "N/A",
          ]),
          headStyles: { fillColor: [19, 127, 236], textColor: [255, 255, 255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 15, halign: "center" },
            2: { cellWidth: 15, halign: "center" },
            3: { cellWidth: 15, halign: "center" },
            4: { cellWidth: 15, halign: "center" },
            5: { cellWidth: 35, halign: "left" },
          },
        });
        
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        
        if (termResult) {
          doc.setFont("helvetica", "bold");
          doc.text(`GPA: ${termResult.gpa?.toFixed(2) || "N/A"}`, 20, finalY);
          doc.text(`Class Position: ${termResult.class_position || "N/A"} out of ${termResult.class_size || "N/A"}`, 80, finalY);
          
          if (termResult.teacher_comment) {
            doc.text("Class Teacher's Comments:", 20, finalY + 15);
            doc.setFont("helvetica", "normal");
            doc.text(termResult.teacher_comment, 75, finalY + 15);
          }
        }
      } else {
        doc.setFont("helvetica", "normal");
        doc.text("No grades available for this term.", 20, 96);
      }
      
      doc.setFontSize(8);
      doc.text("Thank You For Being Part Of Jarreng Village Schools", pageWidth / 2, 280, { align: "center" });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 286, { align: "center" });
      
      doc.save(`Term_Report_${studentData.student_id}_${studentData.first_name}_${studentData.last_name}.pdf`);
      
      toast({
        title: "Report Downloaded!",
        description: "Your term report has been saved as a PDF.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const studentName = studentData 
    ? `${studentData.first_name} ${studentData.last_name}`.toUpperCase()
    : "STUDENT";

  const getGradeColor = (grade: string | null) => {
    switch(grade) {
      case 'A': return 'text-success';
      case 'B': return 'text-primary';
      case 'C': return 'text-warning';
      default: return 'text-destructive';
    }
  };

  return (
    <StudentLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">Term Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Download your academic reports
          </p>
        </div>

        {/* Report Selection */}
        <Card className="rounded-2xl shadow-card animate-fade-up animation-delay-100">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Select Report</h2>
                <p className="text-sm text-muted-foreground">Choose a term to view or download</p>
              </div>
            </div>
            
            {loading ? (
              <Skeleton className="h-12 w-full rounded-xl" />
            ) : (
              <>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={generatePDF} 
                  disabled={isGenerating || grades.length === 0}
                  className="w-full h-12 rounded-xl bg-gradient-primary shadow-glow"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF Report
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="rounded-2xl shadow-card overflow-hidden animate-fade-up animation-delay-200">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Report Preview</h2>
          </div>
          
          <CardContent className="p-0">
            {/* Preview Header */}
            <div className="bg-gradient-primary text-primary-foreground p-5">
              <h3 className="text-lg font-bold text-center">JARRENG VILLAGE SCHOOLS</h3>
              <p className="text-center opacity-80 text-xs mt-1">Niamina East District, The Gambia</p>
              <p className="text-center font-semibold mt-3 text-sm">TERM REPORT</p>
            </div>
            
            {/* Student Info */}
            <div className="p-4 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="ml-1 font-semibold text-foreground">
                    {studentData?.student_id || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-1 font-semibold text-foreground">{studentName}</span>
                </div>
              </div>
            </div>

            {/* Grades Preview */}
            {grades.length > 0 ? (
              <div className="divide-y divide-border">
                {grades.slice(0, 4).map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium text-foreground">
                      {row.subjects?.name || "N/A"}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {row.total_score || 0}%
                      </span>
                      <span className={`text-sm font-bold ${getGradeColor(row.letter_grade)}`}>
                        {row.letter_grade || "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
                {grades.length > 4 && (
                  <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30">
                    ... and {grades.length - 4} more subjects
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No grades available for this term</p>
              </div>
            )}

            {/* Summary */}
            {termResult && (
              <div className="p-4 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">GPA:</span>
                  <span className="font-bold text-primary text-lg">
                    {termResult.gpa?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Position:</span>
                  <span className="font-bold text-warning text-lg">
                    {termResult.class_position || "N/A"}/{termResult.class_size || "?"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcript Link */}
        <Card className="rounded-2xl shadow-card animate-fade-up animation-delay-300">
          <CardContent className="p-4">
            <Link to="/student/transcript" className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-xl">
                <GraduationCap className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Full Transcript</p>
                <p className="text-sm text-muted-foreground">
                  View complete academic history
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentReports;
