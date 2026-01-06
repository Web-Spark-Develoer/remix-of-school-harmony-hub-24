import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { InlineEmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";

interface Application {
  id: string;
  application_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  applying_for_grade: number;
  programme: string;
  previous_school: string;
  created_at: string;
  status: "pending" | "accepted" | "rejected";
  generated_student_id: string | null;
}

const StaffAdmissions = () => {
  const { toast } = useToast();
  const { teacherData } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({ title: "Error", description: "Failed to load applications", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (application: Application) => {
    setProcessingId(application.id);
    try {
      const studentId = `${new Date().getFullYear()}${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

      // Update application status
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "accepted",
          generated_student_id: studentId,
          reviewed_at: new Date().toISOString(),
          reviewed_by: teacherData?.id || null,
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      // Create student record
      const { error: studentError } = await supabase.from("students").insert({
        student_id: studentId,
        first_name: application.first_name,
        last_name: application.last_name,
        email: application.email,
        phone: application.phone,
        status: "active",
      });

      if (studentError) throw studentError;

      toast({
        title: "Application Accepted!",
        description: `${application.first_name} ${application.last_name} admitted. Student ID: ${studentId}`,
      });

      fetchApplications();
    } catch (error) {
      console.error("Error accepting application:", error);
      toast({ title: "Error", description: "Failed to accept application", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (application: Application, reason = "Does not meet requirements") => {
    setProcessingId(application.id);
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: teacherData?.id || null,
        })
        .eq("id", application.id);

      if (error) throw error;

      toast({
        title: "Application Rejected",
        description: `${application.first_name} ${application.last_name}'s application has been rejected.`,
      });

      fetchApplications();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast({ title: "Error", description: "Failed to reject application", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingApplications = applications.filter((a) => a.status === "pending");
  const processedApplications = applications.filter((a) => a.status !== "pending");

  const filteredPending = pendingApplications.filter(
    (app) =>
      `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.application_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <StaffLayout title="Admissions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Admissions Management</h2>
            <p className="text-muted-foreground text-sm">Review and process student applications</p>
          </div>
          <Badge variant="secondary" className="text-lg py-2 px-4 w-fit">
            <span className="material-symbols-outlined mr-2 text-warning">pending</span>
            {pendingApplications.length} Pending
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <span className="material-symbols-outlined text-warning text-2xl">pending</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingApplications.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <span className="material-symbols-outlined text-success text-2xl">check_circle</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {processedApplications.filter((a) => a.status === "accepted").length}
                </p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <span className="material-symbols-outlined text-destructive text-2xl">cancel</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {processedApplications.filter((a) => a.status === "rejected").length}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">pending</span>
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="processed" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">done_all</span>
              Processed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground material-symbols-outlined">search</span>
              <Input
                placeholder="Search by name or application ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <TableSkeleton rows={3} />
            ) : filteredPending.length === 0 ? (
              <InlineEmptyState icon={FileText} title="No Pending Applications" description="All applications have been processed" />
            ) : (
              <div className="space-y-4">
                {filteredPending.map((app) => (
                  <Card key={app.id} className="card-hover-subtle">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {app.first_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{app.first_name} {app.last_name}</h3>
                              <p className="text-sm text-muted-foreground">{app.application_id}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Applying For</p>
                              <p className="text-sm font-medium text-foreground">Grade {app.applying_for_grade}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Programme</p>
                              <p className="text-sm font-medium text-foreground">{app.programme}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Previous School</p>
                              <p className="text-sm font-medium text-foreground truncate">{app.previous_school}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Applied</p>
                              <p className="text-sm font-medium text-foreground">{formatDate(app.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleReject(app)}
                            disabled={processingId === app.id}
                          >
                            <span className="material-symbols-outlined mr-1 text-sm">close</span>
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleAccept(app)}
                            disabled={processingId === app.id}
                          >
                            <span className="material-symbols-outlined mr-1 text-sm">check</span>
                            Accept
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processed" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6"><TableSkeleton rows={5} /></div>
                ) : processedApplications.length === 0 ? (
                  <div className="p-6">
                    <InlineEmptyState icon={FileText} title="No Processed Applications" description="No applications have been reviewed yet" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Application ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Grade</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedApplications.map((app) => (
                          <tr key={app.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{app.application_id}</td>
                            <td className="py-3 px-4 font-medium text-foreground">{app.first_name} {app.last_name}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">Grade {app.applying_for_grade}</td>
                            <td className="py-3 px-4">
                              <Badge variant={app.status === "accepted" ? "default" : "destructive"}>{app.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-sm font-mono">
                              {app.status === "accepted" ? app.generated_student_id : "-"}
                            </td>
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

export default StaffAdmissions;
