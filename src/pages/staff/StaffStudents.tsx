import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { InlineEmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  status: string | null;
  class_name: string | null;
  programme_name: string | null;
}

const StaffStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [programmeFilter, setProgrammeFilter] = useState("all");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from("students")
          .select(`
            id,
            student_id,
            first_name,
            last_name,
            email,
            status,
            classes (name),
            programmes (name)
          `)
          .order("last_name");

        if (error) throw error;

        const formatted: Student[] = (data || []).map((s: any) => ({
          id: s.id,
          student_id: s.student_id,
          first_name: s.first_name,
          last_name: s.last_name,
          email: s.email,
          status: s.status || "active",
          class_name: s.classes?.name || null,
          programme_name: s.programmes?.name || null,
        }));

        setStudents(formatted);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const classes = [...new Set(students.map((s) => s.class_name).filter(Boolean))];
  const programmes = [...new Set(students.map((s) => s.programme_name).filter(Boolean))];

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id.includes(searchQuery);
    const matchesClass = classFilter === "all" || student.class_name === classFilter;
    const matchesProgramme = programmeFilter === "all" || student.programme_name === programmeFilter;
    return matchesSearch && matchesClass && matchesProgramme;
  });

  const activeCount = students.filter((s) => s.status === "active").length;

  return (
    <StaffLayout title="Students">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Students</h2>
            <p className="text-muted-foreground text-sm">Manage and view all enrolled students</p>
          </div>
          <Badge variant="secondary" className="text-lg py-2 px-4 w-fit">
            <span className="material-symbols-outlined mr-2">groups</span>
            {students.length} Students
          </Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground material-symbols-outlined">search</span>
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls} value={cls!}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Programmes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programmes</SelectItem>
                    {programmes.map((prog) => (
                      <SelectItem key={prog} value={prog!}>{prog}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Student Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><TableSkeleton rows={6} /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-6">
                <InlineEmptyState icon={Users} title="No Students Found" description="No students match your search criteria" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Class</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Programme</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{student.student_id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {student.first_name.charAt(0)}
                            </div>
                            <span className="font-medium text-foreground">{student.first_name} {student.last_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{student.class_name || "-"}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{student.programme_name || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={student.status === "active" ? "default" : "secondary"}>
                            {student.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm">
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{programmes.length}</p>
              <p className="text-sm text-muted-foreground">Programmes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffStudents;
