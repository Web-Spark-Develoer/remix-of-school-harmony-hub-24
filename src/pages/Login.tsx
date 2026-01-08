import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginErrors = { email?: string; password?: string };
type RegisterErrors = { firstName?: string; lastName?: string; email?: string; password?: string; confirmPassword?: string };

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user, userRole, isLoading: authLoading, approvalStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [userType, setUserType] = useState<"student" | "staff">("student");
  
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading && userRole) {
      setIsLoading(false);
      if (userRole === "student") {
        // Check if student is approved
        if (approvalStatus === "approved") {
          navigate("/student", { replace: true });
        } else if (approvalStatus === "pending") {
          toast({
            title: "Account Pending Approval",
            description: "Your account is awaiting admin approval. Please check back later.",
            variant: "destructive",
          });
        } else if (approvalStatus === "rejected") {
          toast({
            title: "Account Rejected",
            description: "Your registration was not approved. Please contact the school administration.",
            variant: "destructive",
          });
        }
      } else if (userRole === "teacher" || userRole === "admin") {
        navigate("/staff", { replace: true });
      }
    }
  }, [user, userRole, authLoading, navigate, approvalStatus]);

  const validateLoginForm = () => {
    try {
      loginSchema.parse(loginForm);
      setLoginErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: LoginErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginErrors] = err.message;
          }
        });
        setLoginErrors(fieldErrors);
      }
      return false;
    }
  };

  const validateRegisterForm = () => {
    try {
      registerSchema.parse(registerForm);
      setRegisterErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: RegisterErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterErrors] = err.message;
          }
        });
        setRegisterErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    setIsLoading(true);

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      setIsLoading(false);
      let message = "Invalid credentials. Please try again.";
      if (error.message?.includes("Invalid login")) {
        message = "Invalid email or password. Please check your credentials.";
      } else if (error.message?.includes("Email not confirmed")) {
        message = "Please verify your email before logging in.";
      }
      
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in. Redirecting...",
    });
    // Keep isLoading true - the useEffect will handle redirect once userRole is set
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setIsLoading(true);

    const role = userType === "staff" ? "teacher" : "student";
    
    const { error } = await signUp(registerForm.email, registerForm.password, {
      first_name: registerForm.firstName,
      last_name: registerForm.lastName,
      role: role,
    });

    setIsLoading(false);

    if (error) {
      let message = "Registration failed. Please try again.";
      if (error.message?.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Account created!",
      description: "You can now sign in with your credentials.",
    });
    
    // Switch to login mode after successful registration
    setAuthMode("login");
    setLoginForm({ email: registerForm.email, password: "" });
    setRegisterForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pattern-dots opacity-30" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
            </div>
            <span className="text-2xl font-bold text-foreground">EduPortal</span>
          </Link>
          <p className="text-muted-foreground mt-2">
            {authMode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{authMode === "login" ? "Welcome Back" : "Get Started"}</CardTitle>
            <CardDescription>
              {authMode === "login" 
                ? "Enter your credentials to continue" 
                : "Fill in your details to create an account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* User Type Tabs */}
            <Tabs value={userType} onValueChange={(v) => setUserType(v as "student" | "staff")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">person</span>
                  Student
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">badge</span>
                  Staff
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="mt-0">
                {authMode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentEmail">Email Address</Label>
                      <Input
                        id="studentEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className={loginErrors.email ? "border-destructive" : ""}
                      />
                      {loginErrors.email && <p className="text-xs text-destructive">{loginErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentPassword">Password</Label>
                      <Input
                        id="studentPassword"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className={loginErrors.password ? "border-destructive" : ""}
                      />
                      {loginErrors.password && <p className="text-xs text-destructive">{loginErrors.password}</p>}
                    </div>

                    <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined mr-2">login</span>
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                          className={registerErrors.firstName ? "border-destructive" : ""}
                        />
                        {registerErrors.firstName && <p className="text-xs text-destructive">{registerErrors.firstName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                          className={registerErrors.lastName ? "border-destructive" : ""}
                        />
                        {registerErrors.lastName && <p className="text-xs text-destructive">{registerErrors.lastName}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regEmail">Email Address</Label>
                      <Input
                        id="regEmail"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className={registerErrors.email ? "border-destructive" : ""}
                      />
                      {registerErrors.email && <p className="text-xs text-destructive">{registerErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password</Label>
                      <Input
                        id="regPassword"
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className={registerErrors.password ? "border-destructive" : ""}
                      />
                      {registerErrors.password && <p className="text-xs text-destructive">{registerErrors.password}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className={registerErrors.confirmPassword ? "border-destructive" : ""}
                      />
                      {registerErrors.confirmPassword && <p className="text-xs text-destructive">{registerErrors.confirmPassword}</p>}
                    </div>

                    <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                          Creating account...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined mr-2">person_add</span>
                          Create Account
                        </>
                      )}
                    </Button>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {authMode === "login" 
                      ? "Don't have an account? Register" 
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="staff" className="mt-0">
                {authMode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staffEmail">Email Address</Label>
                      <Input
                        id="staffEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className={loginErrors.email ? "border-destructive" : ""}
                      />
                      {loginErrors.email && <p className="text-xs text-destructive">{loginErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffPassword">Password</Label>
                      <Input
                        id="staffPassword"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className={loginErrors.password ? "border-destructive" : ""}
                      />
                      {loginErrors.password && <p className="text-xs text-destructive">{loginErrors.password}</p>}
                    </div>

                    <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined mr-2">login</span>
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="staffFirstName">First Name</Label>
                        <Input
                          id="staffFirstName"
                          type="text"
                          placeholder="Jane"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                          className={registerErrors.firstName ? "border-destructive" : ""}
                        />
                        {registerErrors.firstName && <p className="text-xs text-destructive">{registerErrors.firstName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="staffLastName">Last Name</Label>
                        <Input
                          id="staffLastName"
                          type="text"
                          placeholder="Smith"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                          className={registerErrors.lastName ? "border-destructive" : ""}
                        />
                        {registerErrors.lastName && <p className="text-xs text-destructive">{registerErrors.lastName}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffRegEmail">Email Address</Label>
                      <Input
                        id="staffRegEmail"
                        type="email"
                        placeholder="jane.smith@school.edu"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className={registerErrors.email ? "border-destructive" : ""}
                      />
                      {registerErrors.email && <p className="text-xs text-destructive">{registerErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffRegPassword">Password</Label>
                      <Input
                        id="staffRegPassword"
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className={registerErrors.password ? "border-destructive" : ""}
                      />
                      {registerErrors.password && <p className="text-xs text-destructive">{registerErrors.password}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffConfirmPassword">Confirm Password</Label>
                      <Input
                        id="staffConfirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className={registerErrors.confirmPassword ? "border-destructive" : ""}
                      />
                      {registerErrors.confirmPassword && <p className="text-xs text-destructive">{registerErrors.confirmPassword}</p>}
                    </div>

                    <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                          Creating account...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined mr-2">person_add</span>
                          Create Staff Account
                        </>
                      )}
                    </Button>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {authMode === "login" 
                      ? "Don't have an account? Register" 
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;