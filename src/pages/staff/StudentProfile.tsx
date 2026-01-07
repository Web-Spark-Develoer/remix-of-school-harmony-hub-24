import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { ArrowLeft, Save, User, BookOpen, ClipboardCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentDetails {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  status: string | null;
  class_id: string | null;
  programme_id: string | null;
  admission_date: string | null;
}

interface GradeRecord {
  id: string;
  subject_name: string;
  term_name: string;
  continuous_assessment: number | null;
  exam_score: number | null;
  total_score: number | null;
  letter_grade: string | null;
  remark: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  class_name: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface ProgrammeOption {
  id: string;
  name: string;
}

const StudentProfile = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState<Partial<StudentDetails>>({});

  useEffect(() => {
    if (!studentId) return;
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchStudent(),
      fetchGrades(),
      fetchAttendance(),
      fetchClasses(),
      fetchProgrammes(),
    ]);
    setIsLoading(false);
  };

  const fetchStudent = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching student:", error);
      return;
    }
    if (data) {
      setStudent(data as StudentDetails);
      setFormData(data as StudentDetails);
    }
  };

  const fetchGrades = async () => {
    const { data, error } = await supabase
      .from("grades")
      .select(`
        id,
        continuous_assessment,
        exam_score,
        total_score,
        letter_grade,
        remark,
        subjects (name),
        terms (name)
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching grades:", error);
      return;
    }
    const formatted: GradeRecord[] = (data || []).map((g: any) => ({
      id: g.id,
      subject_name: g.subjects?.name || "Unknown",
      term_name: g.terms?.name || "Unknown",
      continuous_assessment: g.continuous_assessment,
      exam_score: g.exam_score,
      total_score: g.total_score,
      letter_grade: g.letter_grade,
      remark: g.remark,
    }));
    setGrades(formatted);
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        id,
        date,
        status,
        notes,
        classes (name)
      `)
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching attendance:", error);
      return;
    }
    const formatted: AttendanceRecord[] = (data || []).map((a: any) => ({
      id: a.id,
      date: a.date,
      status: a.status,
      notes: a.notes,
      class_name: a.classes?.name || "-",
    }));
    setAttendance(formatted);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("id, name").order("name");
    setClasses((data || []) as ClassOption[]);
  };

  const fetchProgrammes = async () => {
    const { data } = await supabase.from("programmes").select("id, name").order("name");
    setProgrammes((data || []) as ProgrammeOption[]);
  };

  const handleSave = async () => {
    if (!studentId) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("students")
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        guardian_name: formData.guardian_name,
        guardian_phone: formData.guardian_phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        status: formData.status,
        class_id: formData.class_id,
        programme_id: formData.programme_id,
      })
      .eq("id", studentId);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update student details.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Student details updated." });
    setEditMode(false);
    fetchStudent();
  };

  const getInitials = () => {
    if (!student) return "?";
    return `${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`.toUpperCase();
  };

  const attendanceStats = {
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
  };

  if (isLoading) {
    return (
      <StaffLayout title="Student Profile">
        <div className="p-6">
          <TableSkeleton rows={8} />
        </div>
      </StaffLayout>
    );
  }

  if (!student) {
    return (
      <StaffLayout title="Student Profile">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Student not found.</p>
          <Button variant="link" onClick={() => navigate("/staff/students")}>
            Back to Students
          </Button>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout title="Student Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/staff/students")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-16 h-16">
              <AvatarImage src="" alt={`${student.first_name} ${student.last_name}`} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-muted-foreground">{student.student_id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="grades" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Grades ({grades.length})
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Attendance ({attendance.length})
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      {editMode ? (
                        <Input
                          value={formData.first_name || ""}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-foreground">{student.first_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      {editMode ? (
                        <Input
                          value={formData.last_name || ""}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-foreground">{student.last_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    {editMode ? (
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    ) : (
                      <p className="text-foreground">{student.email || "-"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    {editMode ? (
                      <Input
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-foreground">{student.phone || "-"}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      {editMode ? (
                        <Select
                          value={formData.gender || ""}
                          onValueChange={(v) => setFormData({ ...formData, gender: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-foreground">{student.gender || "-"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      {editMode ? (
                        <Input
                          type="date"
                          value={formData.date_of_birth || ""}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        />
                      ) : (
                        <p className="text-foreground">{student.date_of_birth || "-"}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    {editMode ? (
                      <Input
                        value={formData.address || ""}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    ) : (
                      <p className="text-foreground">{student.address || "-"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    {editMode ? (
                      <Select
                        value={formData.class_id || "none"}
                        onValueChange={(v) => setFormData({ ...formData, class_id: v === "none" ? null : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Class</SelectItem>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-foreground">
                        {classes.find((c) => c.id === student.class_id)?.name || "-"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Programme</Label>
                    {editMode ? (
                      <Select
                        value={formData.programme_id || "none"}
                        onValueChange={(v) => setFormData({ ...formData, programme_id: v === "none" ? null : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select programme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Programme</SelectItem>
                          {programmes.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-foreground">
                        {programmes.find((p) => p.id === student.programme_id)?.name || "-"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    {editMode ? (
                      <Select
                        value={formData.status || "active"}
                        onValueChange={(v) => setFormData({ ...formData, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="graduated">Graduated</SelectItem>
                          <SelectItem value="transferred">Transferred</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={student.status === "active" ? "default" : "secondary"}>
                        {student.status}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Admission Date</Label>
                    <p className="text-foreground">{student.admission_date || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Guardian Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Guardian Name</Label>
                    {editMode ? (
                      <Input
                        value={formData.guardian_name || ""}
                        onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      />
                    ) : (
                      <p className="text-foreground">{student.guardian_name || "-"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Guardian Phone</Label>
                    {editMode ? (
                      <Input
                        value={formData.guardian_phone || ""}
                        onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      />
                    ) : (
                      <p className="text-foreground">{student.guardian_phone || "-"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {grades.length === 0 ? (
                  <p className="p-6 text-muted-foreground text-center">No grades recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Subject</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Term</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">CA</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Exam</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Total</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Grade</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((g) => (
                          <tr key={g.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-4 text-sm">{g.subject_name}</td>
                            <td className="py-3 px-4 text-sm">{g.term_name}</td>
                            <td className="py-3 px-4 text-sm text-center">{g.continuous_assessment ?? "-"}</td>
                            <td className="py-3 px-4 text-sm text-center">{g.exam_score ?? "-"}</td>
                            <td className="py-3 px-4 text-sm text-center font-medium">{g.total_score ?? "-"}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge>{g.letter_grade || "-"}</Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-center text-muted-foreground">{g.remark || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="mt-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{attendanceStats.present}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{attendanceStats.absent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{attendanceStats.late}</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Attendance History (Last 50 Records)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {attendance.length === 0 ? (
                  <p className="p-6 text-muted-foreground text-center">No attendance records found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Class</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((a) => (
                          <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-4 text-sm">{a.date}</td>
                            <td className="py-3 px-4 text-sm">{a.class_name}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={
                                  a.status === "present"
                                    ? "default"
                                    : a.status === "absent"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {a.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{a.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StaffLayout>
  );
};

export default StudentProfile;
