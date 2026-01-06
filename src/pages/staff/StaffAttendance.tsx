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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, X, Clock, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ClassData {
  id: string;
  name: string;
  grade_level: number;
  school_type: string | null;
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface AttendanceRecord {
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
}

interface ScheduleData {
  class_id: string;
  class_name: string;
  subject_name: string;
  start_time: string;
  end_time: string;
}

const StaffAttendance = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSchoolType, setSelectedSchoolType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord["status"]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch classes and today's schedule
  useEffect(() => {
    const fetchInitialData = async () => {
      const [classesRes, scheduleRes] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, grade_level, school_type")
          .order("grade_level"),
        supabase
          .from("schedules")
          .select(`
            class_id,
            start_time,
            end_time,
            classes (name),
            subjects (name)
          `)
          .eq("day_of_week", new Date().getDay())
          .order("start_time"),
      ]);

      if (classesRes.data) setClasses(classesRes.data);
      
      if (scheduleRes.data) {
        setTodaySchedule(scheduleRes.data.map((s: any) => ({
          class_id: s.class_id,
          class_name: s.classes?.name || "Unknown",
          subject_name: s.subjects?.name || "Unknown",
          start_time: s.start_time?.slice(0, 5) || "",
          end_time: s.end_time?.slice(0, 5) || "",
        })));
      }
    };

    fetchInitialData();
  }, []);

  // Filter classes by school type
  const filteredClasses = selectedSchoolType
    ? classes.filter(c => c.school_type === selectedSchoolType)
    : classes;

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendance({});
      return;
    }

    const fetchStudentsAndAttendance = async () => {
      setIsLoading(true);

      // Fetch students in the class
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_id")
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("last_name");

      if (studentError) {
        console.error("Error fetching students:", studentError);
        setIsLoading(false);
        return;
      }

      setStudents(studentData || []);

      // Fetch existing attendance for the date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);

      if (attendanceError) {
        console.error("Error fetching attendance:", attendanceError);
      }

      // Build attendance map
      const attendanceMap: Record<string, AttendanceRecord["status"]> = {};
      attendanceData?.forEach((record) => {
        attendanceMap[record.student_id] = record.status as AttendanceRecord["status"];
      });

      setAttendance(attendanceMap);
      setIsLoading(false);
    };

    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceRecord["status"]) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, AttendanceRecord["status"]> = {};
    students.forEach((student) => {
      newAttendance[student.id] = "present";
    });
    setAttendance(newAttendance);
  };

  const saveAttendance = async () => {
    if (!selectedClass || Object.keys(attendance).length === 0) {
      toast({
        title: "Error",
        description: "Please select a class and mark attendance",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Delete existing attendance for this class and date
      await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);

      // Insert new attendance records
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        date: selectedDate,
        status,
      }));

      const { error } = await supabase.from("attendance").insert(records);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return <Badge className="bg-success text-success-foreground">Present</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return <Badge className="bg-warning text-warning-foreground">Late</Badge>;
      case "excused":
        return <Badge variant="secondary">Excused</Badge>;
      default:
        return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter((s) => s === "present").length,
    absent: Object.values(attendance).filter((s) => s === "absent").length,
    late: Object.values(attendance).filter((s) => s === "late").length,
    excused: Object.values(attendance).filter((s) => s === "excused").length,
  };

  return (
    <StaffLayout title="Attendance">
      <div className="space-y-6">
        {/* Today's Schedule Quick Select */}
        {todaySchedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {todaySchedule.map((schedule, idx) => (
                  <Button
                    key={idx}
                    variant={selectedClass === schedule.class_id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const cls = classes.find(c => c.id === schedule.class_id);
                      if (cls) {
                        setSelectedSchoolType(cls.school_type || "");
                        setSelectedClass(schedule.class_id);
                      }
                    }}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {schedule.start_time} - {schedule.class_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  School
                </label>
                <Select value={selectedSchoolType} onValueChange={(v) => {
                  setSelectedSchoolType(v);
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
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Class
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedSchoolType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
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
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        {selectedClass && students.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-success">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-warning">{stats.late}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{stats.excused}</p>
                <p className="text-sm text-muted-foreground">Excused</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance List */}
        {selectedClass && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Student Attendance</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark All Present
                </Button>
                <Button onClick={saveAttendance} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading students...
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found in this class
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.student_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(attendance[student.id])}
                        <div className="flex gap-1">
                          <Button
                            variant={attendance[student.id] === "present" ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStatusChange(student.id, "present")}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={attendance[student.id] === "absent" ? "destructive" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStatusChange(student.id, "absent")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={attendance[student.id] === "late" ? "secondary" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStatusChange(student.id, "late")}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={attendance[student.id] === "excused" ? "secondary" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStatusChange(student.id, "excused")}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedClass && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select a Class
              </h3>
              <p className="text-muted-foreground">
                Choose a school and class above to start marking attendance
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffAttendance;