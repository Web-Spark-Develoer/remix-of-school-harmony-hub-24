import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Apply from "./pages/Apply";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentGrades from "./pages/student/StudentGrades";
import StudentReports from "./pages/student/StudentReports";
import StudentTranscript from "./pages/student/StudentTranscript";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentSettings from "./pages/student/StudentSettings";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffGradebook from "./pages/staff/StaffGradebook";
import StaffAdmissions from "./pages/staff/StaffAdmissions";
import StaffStudents from "./pages/staff/StaffStudents";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffClasses from "./pages/staff/StaffClasses";
import StaffReports from "./pages/staff/StaffReports";
import AdminStudentUpload from "./pages/staff/AdminStudentUpload";
import AdminUsers from "./pages/staff/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/apply" element={<Apply />} />
            
            {/* Student Portal */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/grades" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentGrades />
              </ProtectedRoute>
            } />
            <Route path="/student/reports" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentReports />
              </ProtectedRoute>
            } />
            <Route path="/student/transcript" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentTranscript />
              </ProtectedRoute>
            } />
            <Route path="/student/schedule" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentSchedule />
              </ProtectedRoute>
            } />
            <Route path="/student/settings" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentSettings />
              </ProtectedRoute>
            } />
            
            {/* Staff/Admin Portal */}
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <StaffDashboard />
              </ProtectedRoute>
            } />
            <Route path="/staff/gradebook" element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <StaffGradebook />
              </ProtectedRoute>
            } />
            <Route path="/staff/admissions" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StaffAdmissions />
              </ProtectedRoute>
            } />
            <Route path="/staff/students" element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <StaffStudents />
              </ProtectedRoute>
            } />
            <Route path="/staff/attendance" element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <StaffAttendance />
              </ProtectedRoute>
            } />
            <Route path="/staff/classes" element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <StaffClasses />
              </ProtectedRoute>
            } />
            <Route path="/staff/reports" element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <StaffReports />
              </ProtectedRoute>
            } />
            <Route path="/staff/admin/students" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminStudentUpload />
              </ProtectedRoute>
            } />
            <Route path="/staff/admin/users" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
