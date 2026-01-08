import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, BookOpen, Users, GraduationCap } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

interface ClassData {
  id: string;
  name: string;
  grade_level: number;
  section: string;
  capacity: number | null;
  school_type: string | null;
  specialization: string | null;
  academic_year_id: string;
  student_count?: number;
}

interface AcademicYear {
  id: string;
  name: string;
  is_current: boolean | null;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

const schoolTypes = [
  { value: "upper_basic", label: "Upper Basic School" },
  { value: "senior_secondary", label: "Senior Secondary School" },
];

const gradeLevels = [
  { value: 7, label: "Grade 7", school: "upper_basic" },
  { value: 8, label: "Grade 8", school: "upper_basic" },
  { value: 9, label: "Grade 9", school: "upper_basic" },
  { value: 10, label: "Grade 10", school: "senior_secondary" },
  { value: 11, label: "Grade 11", school: "senior_secondary" },
  { value: 12, label: "Grade 12", school: "senior_secondary" },
];

const AdminClasses = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    grade_level: "",
    section: "",
    capacity: "50",
    school_type: "",
    specialization: "",
    academic_year_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [classesRes, yearsRes, teachersRes] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .order("grade_level")
        .order("section"),
      supabase.from("academic_years").select("id, name, is_current").order("start_date", { ascending: false }),
      supabase.from("teachers").select("id, first_name, last_name").eq("status", "active"),
    ]);

    if (yearsRes.data) {
      setAcademicYears(yearsRes.data);
      // Set default academic year to current
      const currentYear = yearsRes.data.find(y => y.is_current);
      if (currentYear) {
        setFormData(prev => ({ ...prev, academic_year_id: currentYear.id }));
      }
    }

    if (teachersRes.data) setTeachers(teachersRes.data);

    if (classesRes.data) {
      // Get student counts for each class
      const classesWithCounts = await Promise.all(
        classesRes.data.map(async (cls) => {
          const { count } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id)
            .eq("status", "active");
          return { ...cls, student_count: count || 0 };
        })
      );
      setClasses(classesWithCounts);
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    const currentYear = academicYears.find(y => y.is_current);
    setFormData({
      name: "",
      grade_level: "",
      section: "",
      capacity: "50",
      school_type: "",
      specialization: "",
      academic_year_id: currentYear?.id || "",
    });
    setEditingClass(null);
  };

  const handleAddClass = async () => {
    if (!formData.name || !formData.school_type || !formData.academic_year_id) {
      toast({ title: "Error", description: "Please fill in class name, school type, and academic year", variant: "destructive" });
      return;
    }

    try {
      // Extract grade level from the class name (e.g., "7A" -> 7, "10A1" -> 10)
      const gradeMatch = formData.name.match(/^(\d+)/);
      const gradeLevel = gradeMatch ? parseInt(gradeMatch[1]) : 7;
      
      // Extract section from the class name (e.g., "7A" -> "A", "10A1" -> "A1")
      const sectionMatch = formData.name.match(/^\d+(.+)$/);
      const section = sectionMatch ? sectionMatch[1] : "A";
      
      const { error } = await supabase.from("classes").insert({
        name: formData.name,
        grade_level: gradeLevel,
        section: section,
        capacity: parseInt(formData.capacity) || 50,
        school_type: formData.school_type,
        specialization: formData.specialization || null,
        academic_year_id: formData.academic_year_id,
      });

      if (error) throw error;

      toast({ title: "Success", description: `${formData.name} created successfully` });
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error adding class:", error);
      toast({ title: "Error", description: error.message || "Failed to create class", variant: "destructive" });
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    try {
      // Extract grade level from the class name
      const gradeMatch = formData.name.match(/^(\d+)/);
      const gradeLevel = gradeMatch ? parseInt(gradeMatch[1]) : editingClass.grade_level;
      
      // Extract section from the class name
      const sectionMatch = formData.name.match(/^\d+(.+)$/);
      const section = sectionMatch ? sectionMatch[1] : editingClass.section;
      
      const { error } = await supabase
        .from("classes")
        .update({
          name: formData.name,
          grade_level: gradeLevel,
          section: section,
          capacity: parseInt(formData.capacity) || 50,
          school_type: formData.school_type || null,
          specialization: formData.specialization || null,
        })
        .eq("id", editingClass.id);

      if (error) throw error;

      toast({ title: "Success", description: "Class updated successfully" });
      setEditingClass(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast({ title: "Error", description: error.message || "Failed to update class", variant: "destructive" });
    }
  };

  const handleDeleteClass = async (cls: ClassData) => {
    if (cls.student_count && cls.student_count > 0) {
      toast({ 
        title: "Cannot Delete", 
        description: `This class has ${cls.student_count} students. Remove students first.`, 
        variant: "destructive" 
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${cls.name}?`)) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", cls.id);

      if (error) throw error;

      toast({ title: "Success", description: "Class deleted successfully" });
      fetchData();
    } catch (error: any) {
      console.error("Error deleting class:", error);
      toast({ title: "Error", description: error.message || "Failed to delete class", variant: "destructive" });
    }
  };

  const openEditDialog = (cls: ClassData) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      grade_level: cls.grade_level.toString(),
      section: cls.section,
      capacity: cls.capacity?.toString() || "50",
      school_type: cls.school_type || "",
      specialization: cls.specialization || "",
      academic_year_id: cls.academic_year_id,
    });
  };

  const filteredClasses = classes.filter(c => {
    const matchesSchool = selectedSchoolFilter === "all" || c.school_type === selectedSchoolFilter;
    const matchesGrade = selectedGradeFilter === "all" || c.grade_level.toString() === selectedGradeFilter;
    return matchesSchool && matchesGrade;
  });

  // Group classes by grade level
  const classesGrouped = filteredClasses.reduce((acc, cls) => {
    const key = cls.grade_level;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cls);
    return acc;
  }, {} as Record<number, ClassData[]>);

  return (
    <StaffLayout title="Manage Classes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Manage Classes</h2>
            <p className="text-muted-foreground text-sm">Create and manage class sections (e.g. 7A-G, 8A-G, etc.)</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="school_type">School *</Label>
                  <Select
                    value={formData.school_type}
                    onValueChange={(value) => setFormData({ ...formData, school_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolTypes.map((school) => (
                        <SelectItem key={school.value} value={school.value}>
                          {school.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_name">Class Name *</Label>
                  <Input
                    id="class_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. 7A, 8B, 10A1, 12C2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the grade number followed by section (e.g., 7A, 8G, 10A1, 12C2)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select
                      value={formData.specialization}
                      onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="Art">Art</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Commerce">Commerce</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year *</Label>
                  <Select
                    value={formData.academic_year_id}
                    onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name} {year.is_current && "(Current)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddClass}>Create Class</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>School:</Label>
            <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schoolTypes.map((school) => (
                  <SelectItem key={school.value} value={school.value}>
                    {school.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Grade:</Label>
            <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value.toString()}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
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
                {classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">
                {new Set(classes.map(c => c.grade_level)).size}
              </p>
              <p className="text-sm text-muted-foreground">Grade Levels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">
                {Math.round(classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0) / Math.max(classes.length, 1))}
              </p>
              <p className="text-sm text-muted-foreground">Avg. Class Size</p>
            </CardContent>
          </Card>
        </div>

        {/* Classes by Grade */}
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : Object.keys(classesGrouped).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Classes Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create classes to start organizing students
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(classesGrouped)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([grade, gradeClasses]) => (
              <Card key={grade}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Grade {grade}
                    <Badge variant="secondary">{gradeClasses.length} sections</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {gradeClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{cls.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{cls.student_count || 0} / {cls.capacity || "∞"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(cls)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClass(cls)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_school_type">School</Label>
                <Select
                  value={formData.school_type}
                  onValueChange={(value) => setFormData({ ...formData, school_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolTypes.map((school) => (
                      <SelectItem key={school.value} value={school.value}>
                        {school.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_name">Class Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 7A, 10A1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_capacity">Capacity</Label>
                  <Input
                    id="edit_capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_specialization">Specialization</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="Art">Art</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Commerce">Commerce</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdateClass}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StaffLayout>
  );
};

export default AdminClasses;
