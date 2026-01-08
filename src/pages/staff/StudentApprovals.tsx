import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

interface PendingStudent {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  created_at: string;
  approval_status: string;
  class?: { name: string } | null;
}

const StudentApprovals = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  // Rejection dialog
  const [rejectingStudent, setRejectingStudent] = useState<PendingStudent | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [activeTab]);

  const fetchStudents = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from("students")
      .select("*, class:classes(name)")
      .order("created_at", { ascending: false });
    
    if (activeTab === "pending") {
      query = query.eq("approval_status", "pending");
    } else if (activeTab === "approved") {
      query = query.eq("approval_status", "approved");
    } else if (activeTab === "rejected") {
      query = query.eq("approval_status", "rejected");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching students:", error);
    } else {
      setStudents(data || []);
    }
    
    setIsLoading(false);
  };

  const handleApprove = async (student: PendingStudent) => {
    try {
      const { error } = await supabase
        .from("students")
        .update({
          approval_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          status: "active",
        })
        .eq("id", student.id);

      if (error) throw error;

      toast({
        title: "Student Approved",
        description: `${student.first_name} ${student.last_name} has been approved and can now access the portal.`,
      });

      fetchStudents();
    } catch (error: any) {
      console.error("Error approving student:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve student",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectingStudent) return;

    try {
      const { error } = await supabase
        .from("students")
        .update({
          approval_status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason || "No reason provided",
          status: "inactive",
        })
        .eq("id", rejectingStudent.id);

      if (error) throw error;

      toast({
        title: "Student Rejected",
        description: `${rejectingStudent.first_name} ${rejectingStudent.last_name} has been rejected.`,
      });

      setRejectingStudent(null);
      setRejectionReason("");
      fetchStudents();
    } catch (error: any) {
      console.error("Error rejecting student:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject student",
        variant: "destructive",
      });
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      searchQuery === "" ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = students.filter(s => s.approval_status === "pending").length;

  return (
    <StaffLayout title="Student Approvals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Student Approvals</h2>
            <p className="text-muted-foreground text-sm">
              Review and approve new student registrations
            </p>
          </div>
          {activeTab === "pending" && pendingCount > 0 && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "pending" && "Pending Approvals"}
                  {activeTab === "approved" && "Approved Students"}
                  {activeTab === "rejected" && "Rejected Students"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={5} />
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No {activeTab} students found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{student.email || "No email"}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="outline">{student.student_id}</Badge>
                              {student.gender && (
                                <Badge variant="secondary">{student.gender}</Badge>
                              )}
                              {student.class?.name && (
                                <Badge variant="secondary">{student.class.name}</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {student.guardian_name && (
                                <span>Guardian: {student.guardian_name}</span>
                              )}
                              {student.guardian_phone && (
                                <span className="ml-2">| Phone: {student.guardian_phone}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Registered: {new Date(student.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {activeTab === "pending" && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(student)}
                              className="bg-success hover:bg-success/90"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectingStudent(student)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {activeTab === "approved" && (
                          <Badge className="bg-success/10 text-success border-success/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        
                        {activeTab === "rejected" && (
                          <div className="text-right">
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </Badge>
                            {(student as any).rejection_reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Reason: {(student as any).rejection_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={!!rejectingStudent} onOpenChange={(open) => !open && setRejectingStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Are you sure you want to reject{" "}
                <span className="font-semibold text-foreground">
                  {rejectingStudent?.first_name} {rejectingStudent?.last_name}
                </span>
                ?
              </p>
              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Reason for Rejection</Label>
                <Textarea
                  id="rejection_reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleReject}>
                Reject Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StaffLayout>
  );
};

export default StudentApprovals;