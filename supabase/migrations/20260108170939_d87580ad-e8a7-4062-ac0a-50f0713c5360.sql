-- Add approval status to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update existing students to be approved (they were created by admins)
UPDATE public.students SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = 'pending';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_students_approval_status ON public.students(approval_status);

-- Insert default departments if they don't exist
INSERT INTO public.departments (name, description) 
VALUES 
  ('Art', 'Arts and Humanities Department'),
  ('Science', 'Science Department'),
  ('Commerce', 'Commerce and Business Studies Department'),
  ('Technical', 'Technical and Vocational Studies Department')
ON CONFLICT (name) DO NOTHING;