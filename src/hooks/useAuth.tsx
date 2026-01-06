import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'student' | 'teacher' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: UserRole | null;
  studentData: StudentData | null;
  teacherData: TeacherData | null;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; role?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface StudentData {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
  programme_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
}

interface TeacherData {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  department: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role and related data after auth state change
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setStudentData(null);
          setTeacherData(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData.role as UserRole);

        // Fetch student or teacher data based on role
        if (roleData.role === 'student') {
          const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (student) {
            setStudentData(student as StudentData);
          }
        } else if (roleData.role === 'teacher' || roleData.role === 'admin') {
          const { data: teacher } = await supabase
            .from('teachers')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (teacher) {
            setTeacherData(teacher as TeacherData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string; role?: string }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setStudentData(null);
    setTeacherData(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      userRole,
      studentData,
      teacherData,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
