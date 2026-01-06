import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Shield, UserPlus, Search } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  can_add_admins: boolean;
  can_manage_students: boolean;
  can_upload_bulk_data: boolean;
  can_approve_grades: boolean;
  can_manage_teachers: boolean;
}

interface Teacher {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  status: string | null;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [canManageAdmins, setCanManageAdmins] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      // Check if current user can add admins
      const { data: permissions } = await supabase
        .from("admin_permissions")
        .select("can_add_admins")
        .eq("user_id", user.id)
        .maybeSingle();

      setCanManageAdmins(permissions?.can_add_admins || false);

      // Fetch all teachers
      const { data: teachersData } = await supabase
        .from("teachers")
        .select("id, user_id, first_name, last_name, email, status")
        .eq("status", "active")
        .order("last_name");

      setTeachers(teachersData || []);

      // Fetch admin permissions
      const { data: adminData } = await supabase
        .from("admin_permissions")
        .select("*");

      if (adminData && teachersData) {
        const adminUsers: AdminUser[] = adminData.map((admin) => {
          const teacher = teachersData.find((t) => t.user_id === admin.user_id);
          return {
            id: admin.id,
            user_id: admin.user_id,
            email: teacher?.email || "Unknown",
            first_name: teacher?.first_name || "Unknown",
            last_name: teacher?.last_name || "",
            can_add_admins: admin.can_add_admins,
            can_manage_students: admin.can_manage_students,
            can_upload_bulk_data: admin.can_upload_bulk_data,
            can_approve_grades: admin.can_approve_grades,
            can_manage_teachers: admin.can_manage_teachers,
          };
        });
        setAdmins(adminUsers);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePermission = async (adminId: string, field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from("admin_permissions")
        .update({ [field]: value })
        .eq("id", adminId);

      if (error) throw error;

      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === adminId ? { ...admin, [field]: value } : admin
        )
      );

      toast({ title: "Updated", description: "Permission updated successfully" });
    } catch (error) {
      console.error("Error updating permission:", error);
      toast({ title: "Error", description: "Failed to update permission", variant: "destructive" });
    }
  };

  const grantAdminAccess = async (teacher: Teacher) => {
    if (!teacher.user_id) {
      toast({
        title: "Cannot Grant Access",
        description: "This teacher doesn't have a linked user account",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("admin_permissions").insert({
        user_id: teacher.user_id,
        can_add_admins: false,
        can_manage_students: true,
        can_upload_bulk_data: true,
        can_approve_grades: true,
        can_manage_teachers: false,
      });

      if (error) throw error;

      toast({ title: "Success", description: `Admin access granted to ${teacher.first_name} ${teacher.last_name}` });
      fetchData();
    } catch (error) {
      console.error("Error granting admin access:", error);
      toast({ title: "Error", description: "Failed to grant admin access", variant: "destructive" });
    }
  };

  const revokeAdminAccess = async (adminId: string, adminName: string) => {
    try {
      const { error } = await supabase
        .from("admin_permissions")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      setAdmins((prev) => prev.filter((a) => a.id !== adminId));
      toast({ title: "Success", description: `Admin access revoked from ${adminName}` });
    } catch (error) {
      console.error("Error revoking admin access:", error);
      toast({ title: "Error", description: "Failed to revoke admin access", variant: "destructive" });
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      !admins.some((a) => a.user_id === teacher.user_id) &&
      (searchQuery === "" ||
        `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <StaffLayout title="Admin Management">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Admin Management</h2>
          <p className="text-muted-foreground text-sm">Manage administrator permissions and access</p>
        </div>

        {/* Current Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Current Administrators ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={3} />
            ) : admins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No administrators configured
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {admin.first_name} {admin.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                      {admin.can_add_admins && (
                        <Badge className="bg-primary">Super Admin</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Manage Students</span>
                        <Switch
                          checked={admin.can_manage_students}
                          onCheckedChange={(v) => updatePermission(admin.id, "can_manage_students", v)}
                          disabled={!canManageAdmins}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Bulk Upload</span>
                        <Switch
                          checked={admin.can_upload_bulk_data}
                          onCheckedChange={(v) => updatePermission(admin.id, "can_upload_bulk_data", v)}
                          disabled={!canManageAdmins}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Approve Grades</span>
                        <Switch
                          checked={admin.can_approve_grades}
                          onCheckedChange={(v) => updatePermission(admin.id, "can_approve_grades", v)}
                          disabled={!canManageAdmins}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Manage Teachers</span>
                        <Switch
                          checked={admin.can_manage_teachers}
                          onCheckedChange={(v) => updatePermission(admin.id, "can_manage_teachers", v)}
                          disabled={!canManageAdmins}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Add Admins</span>
                        <Switch
                          checked={admin.can_add_admins}
                          onCheckedChange={(v) => updatePermission(admin.id, "can_add_admins", v)}
                          disabled={!canManageAdmins}
                        />
                      </div>
                    </div>

                    {canManageAdmins && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeAdminAccess(admin.id, `${admin.first_name} ${admin.last_name}`)}
                        >
                          Revoke Admin Access
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add New Admin */}
        {canManageAdmins && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-success" />
                Grant Admin Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredTeachers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No teachers match your search" : "All teachers are already administrators"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTeachers.slice(0, 5).map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {teacher.first_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {teacher.first_name} {teacher.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => grantAdminAccess(teacher)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Grant Access
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!canManageAdmins && (
          <Card>
            <CardContent className="py-8 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Super Admin Access Required
              </h3>
              <p className="text-muted-foreground">
                You need Super Admin privileges to add or remove other administrators.
                Contact your system administrator.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
};

export default AdminUsers;