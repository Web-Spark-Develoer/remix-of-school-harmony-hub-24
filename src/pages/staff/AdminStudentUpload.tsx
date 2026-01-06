import { useState, useRef } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ParsedStudent {
  first_name: string;
  last_name: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
  class_name?: string;
}

const AdminStudentUpload = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      
      const students: ParsedStudent[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2 && values[0]) {
          const student: ParsedStudent = {
            first_name: values[headers.indexOf('first_name')] || values[0] || '',
            last_name: values[headers.indexOf('last_name')] || values[1] || '',
            email: values[headers.indexOf('email')] || undefined,
            gender: values[headers.indexOf('gender')] || undefined,
            date_of_birth: values[headers.indexOf('date_of_birth')] || values[headers.indexOf('dob')] || undefined,
            guardian_name: values[headers.indexOf('guardian_name')] || values[headers.indexOf('parent_name')] || undefined,
            guardian_phone: values[headers.indexOf('guardian_phone')] || values[headers.indexOf('parent_phone')] || undefined,
            class_name: values[headers.indexOf('class')] || values[headers.indexOf('class_name')] || undefined,
          };
          students.push(student);
        }
      }
      
      setParsedData(students);
      toast({
        title: "File Parsed",
        description: `Found ${students.length} students in the file`,
      });
    };
    reader.readAsText(file);
  };

  const uploadStudents = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    // Fetch classes for mapping
    const { data: classesData } = await supabase.from("classes").select("id, name");
    const classMap = new Map(classesData?.map(c => [c.name.toLowerCase(), c.id]) || []);

    for (let i = 0; i < parsedData.length; i++) {
      const student = parsedData[i];
      
      try {
        // Generate student ID
        const studentId = `STU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
        
        // Find class ID if class name provided
        let classId = null;
        if (student.class_name) {
          classId = classMap.get(student.class_name.toLowerCase()) || null;
        }

        const { error } = await supabase.from("students").insert({
          student_id: studentId,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email || null,
          gender: student.gender || null,
          date_of_birth: student.date_of_birth || null,
          guardian_name: student.guardian_name || null,
          guardian_phone: student.guardian_phone || null,
          class_id: classId,
          status: 'active',
        });

        if (error) throw error;
        success++;
      } catch (error) {
        console.error("Error uploading student:", student, error);
        failed++;
      }

      setProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setUploadResults({ success, failed });
    setIsUploading(false);
    
    toast({
      title: "Upload Complete",
      description: `Successfully added ${success} students. ${failed > 0 ? `${failed} failed.` : ''}`,
    });
  };

  const downloadTemplate = () => {
    const template = "first_name,last_name,email,gender,date_of_birth,guardian_name,guardian_phone,class_name\nJohn,Doe,john@example.com,male,2010-05-15,Jane Doe,+220123456789,Grade 7A";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StaffLayout title="Bulk Student Upload">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Bulk Student Upload</h2>
          <p className="text-muted-foreground text-sm">Upload multiple students at once using a CSV file</p>
        </div>

        {/* Template Download */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Download Template</h3>
                <p className="text-sm text-muted-foreground">
                  Use this template to format your student data correctly
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Select a CSV file containing student data. The file should include columns for first_name, last_name, and optionally email, gender, date_of_birth, guardian_name, guardian_phone, and class_name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{parsedData.length} students found</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Click to select a CSV file or drag and drop</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {parsedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({parsedData.length} students)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">First Name</th>
                      <th className="text-left py-2 px-3">Last Name</th>
                      <th className="text-left py-2 px-3">Class</th>
                      <th className="text-left py-2 px-3">Guardian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((student, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-2 px-3">{student.first_name}</td>
                        <td className="py-2 px-3">{student.last_name}</td>
                        <td className="py-2 px-3">{student.class_name || "-"}</td>
                        <td className="py-2 px-3">{student.guardian_name || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    ... and {parsedData.length - 10} more students
                  </p>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading... {progress}%
                  </p>
                </div>
              )}

              {/* Results */}
              {!isUploading && uploadResults.success > 0 && (
                <div className="mt-4 flex items-center gap-4 justify-center">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span>{uploadResults.success} successful</span>
                  </div>
                  {uploadResults.failed > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <span>{uploadResults.failed} failed</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={uploadStudents} 
                  disabled={isUploading}
                  className="bg-gradient-primary"
                >
                  {isUploading ? "Uploading..." : `Upload ${parsedData.length} Students`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
};

export default AdminStudentUpload;