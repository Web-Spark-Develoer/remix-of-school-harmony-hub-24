import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Shield, Edit, ChevronRight } from "lucide-react";

const StudentSettings = () => {
  const { studentData, user } = useAuth();

  const studentInitials = studentData
    ? `${studentData.first_name?.[0] || ''}${studentData.last_name?.[0] || ''}`
    : "ST";

  const studentName = studentData 
    ? `${studentData.first_name} ${studentData.last_name}`
    : "Student";

  return (
    <StudentLayout title="Profile">
      <div className="space-y-6 max-w-2xl">
        {/* Profile Header */}
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account settings
          </p>
        </div>

        {/* Profile Card */}
        <Card className="rounded-2xl shadow-card overflow-hidden animate-fade-up animation-delay-100">
          <div className="bg-gradient-primary p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-primary-foreground/30">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-2xl font-bold">
                  {studentInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-primary-foreground">
                <h2 className="text-xl font-bold">{studentName}</h2>
                <p className="text-primary-foreground/70">{studentData?.student_id || "Student"}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 rounded-xl">
                <Edit className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted rounded-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email || studentData?.email || "Not set"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-muted rounded-xl">
              <div className="p-2 bg-success/10 rounded-lg">
                <Phone className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{studentData?.phone || "Not provided"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-muted rounded-xl">
              <div className="p-2 bg-warning/10 rounded-lg">
                <MapPin className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium text-foreground">{studentData?.address || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card className="rounded-2xl shadow-card animate-fade-up animation-delay-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple/10 rounded-xl">
                <User className="w-5 h-5 text-purple" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Guardian Information</h3>
                <p className="text-sm text-muted-foreground">Parent/Guardian contact details</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">{studentData?.guardian_name || "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">{studentData?.guardian_phone || "Not provided"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="rounded-2xl shadow-card animate-fade-up animation-delay-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-destructive/10 rounded-xl">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground">Manage your account security</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                <div>
                  <p className="font-medium text-foreground text-left">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your password</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                <div>
                  <p className="font-medium text-foreground text-left">Account Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Info Note */}
        <p className="text-sm text-center text-muted-foreground animate-fade-up animation-delay-400">
          Contact your school administrator to update your personal information.
        </p>
      </div>
    </StudentLayout>
  );
};

export default StudentSettings;
