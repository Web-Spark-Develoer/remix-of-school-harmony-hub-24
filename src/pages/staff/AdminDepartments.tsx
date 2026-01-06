import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Building2, Users } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

interface Department {
  id: string;
  name: string;
  description: string | null;
  head_teacher_id: string | null;
  head_teacher?: { first_name: string; last_name: string } | null;
  teacher_count?: number;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

const AdminDepartments = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    head_teacher_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [deptRes, teachersRes] = await Promise.all([
      supabase
        .from("departments")
        .select("*, head_teacher:teachers!departments_head_teacher_id_fkey(first_name, last_name)")
        .order("name"),
      supabase
        .from("teachers")
        .select("id, first_name, last_name, department_id")
        .eq("status", "active")
        .order("last_name"),
    ]);

    if (deptRes.data && teachersRes.data) {
      // Count teachers per department
      const deptsWithCounts = deptRes.data.map(dept => ({
        ...dept,
        teacher_count: teachersRes.data.filter(t => t.department_id === dept.id).length
      }));
      setDepartments(deptsWithCounts);
    }

    if (teachersRes.data) {
      setTeachers(teachersRes.data.map(t => ({ id: t.id, first_name: t.first_name, last_name: t.last_name })));
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", head_teacher_id: "" });
    setEditingDept(null);
  };

  const handleAddDepartment = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Department name is required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("departments").insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        head_teacher_id: formData.head_teacher_id || null,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Department created successfully" });
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error adding department:", error);
      toast({ title: "Error", description: error.message || "Failed to create department", variant: "destructive" });
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDept) return;

    try {
      const { error } = await supabase
        .from("departments")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          head_teacher_id: formData.head_teacher_id || null,
        })
        .eq("id", editingDept.id);

      if (error) throw error;

      toast({ title: "Success", description: "Department updated successfully" });
      setEditingDept(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error updating department:", error);
      toast({ title: "Error", description: error.message || "Failed to update department", variant: "destructive" });
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (!confirm(`Are you sure you want to delete the ${dept.name} department?`)) return;

    try {
      // First remove department from all teachers
      await supabase
        .from("teachers")
        .update({ department_id: null })
        .eq("department_id", dept.id);

      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", dept.id);

      if (error) throw error;

      toast({ title: "Success", description: "Department deleted successfully" });
      fetchData();
    } catch (error: any) {
      console.error("Error deleting department:", error);
      toast({ title: "Error", description: error.message || "Failed to delete department", variant: "destructive" });
    }
  };

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      head_teacher_id: dept.head_teacher_id || "",
    });
  };

  return (
    <StaffLayout title="Manage Departments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Manage Departments</h2>
            <p className="text-muted-foreground text-sm">Organize teachers into departments (Art, Science, Commerce, etc.)</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Science, Arts, Commerce"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the department"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="head_teacher">Head of Department</Label>
                  <Select
                    value={formData.head_teacher_id}
                    onValueChange={(value) => setFormData({ ...formData, head_teacher_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select head teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}
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
                <Button onClick={handleAddDepartment}>Create Department</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">{departments.length}</p>
              <p className="text-sm text-muted-foreground">Total Departments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">{teachers.length}</p>
              <p className="text-sm text-muted-foreground">Total Teachers</p>
            </CardContent>
          </Card>
        </div>

        {/* Departments Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full">
              <TableSkeleton rows={3} />
            </div>
          ) : departments.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Departments Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create departments to organize your teachers
                </p>
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Department
                </Button>
              </CardContent>
            </Card>
          ) : (
            departments.map((dept) => (
              <Card key={dept.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        {dept.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {dept.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{dept.teacher_count || 0} Teachers</span>
                  </div>
                  
                  {dept.head_teacher && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        HOD: {dept.head_teacher.first_name} {dept.head_teacher.last_name}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(dept)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteDepartment(dept)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Department Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_head_teacher">Head of Department</Label>
                <Select
                  value={formData.head_teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, head_teacher_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select head teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
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
              <Button onClick={handleUpdateDepartment}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StaffLayout>
  );
};

export default AdminDepartments;
