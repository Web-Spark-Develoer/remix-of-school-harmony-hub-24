-- Create departments table for organizing teachers
CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    head_teacher_id uuid REFERENCES public.teachers(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Anyone can view departments
CREATE POLICY "Anyone can view departments" ON public.departments
    FOR SELECT USING (true);

-- Admins can manage departments
CREATE POLICY "Admins can manage departments" ON public.departments
    FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Add department_id to teachers table
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_department ON public.teachers(department_id);