CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: application_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.application_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);


--
-- Name: grade_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.grade_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'locked'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'student',
    'teacher',
    'admin'
);


--
-- Name: calculate_grade_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_grade_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.total_score := COALESCE(NEW.continuous_assessment, 0) + COALESCE(NEW.exam_score, 0);
  
  IF NEW.total_score >= 80 THEN NEW.letter_grade := 'A';
  ELSIF NEW.total_score >= 75 THEN NEW.letter_grade := 'A-';
  ELSIF NEW.total_score >= 70 THEN NEW.letter_grade := 'B+';
  ELSIF NEW.total_score >= 65 THEN NEW.letter_grade := 'B';
  ELSIF NEW.total_score >= 60 THEN NEW.letter_grade := 'B-';
  ELSIF NEW.total_score >= 55 THEN NEW.letter_grade := 'C+';
  ELSIF NEW.total_score >= 50 THEN NEW.letter_grade := 'C';
  ELSIF NEW.total_score >= 45 THEN NEW.letter_grade := 'C-';
  ELSIF NEW.total_score >= 40 THEN NEW.letter_grade := 'D';
  ELSE NEW.letter_grade := 'F';
  END IF;
  
  CASE NEW.letter_grade
    WHEN 'A', 'A-' THEN NEW.remark := 'EXCELLENT';
    WHEN 'B+', 'B', 'B-' THEN NEW.remark := 'VERY GOOD';
    WHEN 'C+', 'C', 'C-' THEN NEW.remark := 'SATISFACTORY';
    WHEN 'D' THEN NEW.remark := 'PASS';
    ELSE NEW.remark := 'FAIL';
  END CASE;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


--
-- Name: generate_application_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_application_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.application_id := 'APP-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: get_student_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_student_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM public.students WHERE user_id = _user_id
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_registration(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_registration() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_student_id TEXT;
  user_role_value TEXT;
BEGIN
  -- Check if user metadata indicates they are registering as staff
  user_role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student');
  
  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_value::user_role);
  
  -- If registering as a student, create student record
  IF user_role_value = 'student' THEN
    -- Generate student ID (format: STU-YEAR-XXXXX)
    new_student_id := 'STU-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    
    INSERT INTO public.students (
      user_id,
      student_id,
      first_name,
      last_name,
      email,
      status
    )
    VALUES (
      NEW.id,
      new_student_id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email,
      'active'
    );
  END IF;
  
  -- If registering as teacher/admin, create teacher record
  IF user_role_value = 'teacher' OR user_role_value = 'admin' THEN
    INSERT INTO public.teachers (
      user_id,
      employee_id,
      first_name,
      last_name,
      email,
      status
    )
    VALUES (
      NEW.id,
      'EMP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email,
      'active'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.user_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.user_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: is_staff(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('teacher', 'admin')
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    can_add_admins boolean DEFAULT false,
    can_manage_students boolean DEFAULT true,
    can_upload_bulk_data boolean DEFAULT true,
    can_approve_grades boolean DEFAULT true,
    can_manage_teachers boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date NOT NULL,
    gender text NOT NULL,
    nationality text DEFAULT 'Gambian'::text,
    email text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    village text,
    previous_school text NOT NULL,
    last_grade_completed text NOT NULL,
    applying_for_grade integer NOT NULL,
    programme text NOT NULL,
    guardian_name text NOT NULL,
    guardian_relation text NOT NULL,
    guardian_phone text NOT NULL,
    guardian_email text,
    status public.application_status DEFAULT 'pending'::public.application_status,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    generated_student_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT applications_applying_for_grade_check CHECK (((applying_for_grade >= 10) AND (applying_for_grade <= 12))),
    CONSTRAINT applications_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text])))
);


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    class_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    status text NOT NULL,
    marked_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_status_check CHECK ((status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text, 'excused'::text])))
);


--
-- Name: class_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    teacher_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    grade_level integer NOT NULL,
    section text NOT NULL,
    academic_year_id uuid NOT NULL,
    capacity integer DEFAULT 50,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    school_type text,
    specialization text,
    CONSTRAINT classes_grade_level_check CHECK (((grade_level >= 7) AND (grade_level <= 12))),
    CONSTRAINT classes_school_type_check CHECK ((school_type = ANY (ARRAY['upper_basic'::text, 'senior_secondary'::text])))
);


--
-- Name: grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    term_id uuid NOT NULL,
    class_id uuid,
    continuous_assessment numeric(5,2),
    exam_score numeric(5,2),
    total_score numeric(5,2),
    letter_grade text,
    remark text,
    status public.grade_status DEFAULT 'draft'::public.grade_status,
    entered_by uuid,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT grades_continuous_assessment_check CHECK (((continuous_assessment >= (0)::numeric) AND (continuous_assessment <= (30)::numeric))),
    CONSTRAINT grades_exam_score_check CHECK (((exam_score >= (0)::numeric) AND (exam_score <= (70)::numeric)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: programmes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programmes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    teacher_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    room text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    student_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date,
    gender text,
    email text,
    phone text,
    address text,
    guardian_name text,
    guardian_phone text,
    class_id uuid,
    programme_id uuid,
    admission_date date DEFAULT CURRENT_DATE,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT students_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text]))),
    CONSTRAINT students_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'graduated'::text, 'withdrawn'::text])))
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    programme_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    employee_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    department text,
    hire_date date DEFAULT CURRENT_DATE,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT teachers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


--
-- Name: term_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.term_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    term_id uuid NOT NULL,
    class_id uuid,
    gpa numeric(3,2),
    class_position integer,
    class_size integer,
    teacher_comment text,
    principal_comment text,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.terms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    academic_year_id uuid NOT NULL,
    name text NOT NULL,
    term_number integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT terms_term_number_check CHECK (((term_number >= 1) AND (term_number <= 3)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: admin_permissions admin_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_pkey PRIMARY KEY (id);


--
-- Name: admin_permissions admin_permissions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_user_id_key UNIQUE (user_id);


--
-- Name: applications applications_application_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_application_id_key UNIQUE (application_id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_student_id_class_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_class_id_date_key UNIQUE (student_id, class_id, date);


--
-- Name: class_subjects class_subjects_class_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_class_id_subject_id_key UNIQUE (class_id, subject_id);


--
-- Name: class_subjects class_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: grades grades_student_id_subject_id_term_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_student_id_subject_id_term_id_key UNIQUE (student_id, subject_id, term_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: programmes programmes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programmes
    ADD CONSTRAINT programmes_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_id_key UNIQUE (student_id);


--
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- Name: subjects subjects_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_code_key UNIQUE (code);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_employee_id_key UNIQUE (employee_id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);


--
-- Name: term_results term_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.term_results
    ADD CONSTRAINT term_results_pkey PRIMARY KEY (id);


--
-- Name: term_results term_results_student_id_term_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.term_results
    ADD CONSTRAINT term_results_student_id_term_id_key UNIQUE (student_id, term_id);


--
-- Name: terms terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_classes_grade_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_grade_level ON public.classes USING btree (grade_level);


--
-- Name: idx_classes_school_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_school_type ON public.classes USING btree (school_type);


--
-- Name: idx_schedules_class_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_class_day ON public.schedules USING btree (class_id, day_of_week);


--
-- Name: idx_schedules_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_teacher ON public.schedules USING btree (teacher_id);


--
-- Name: grades calculate_grade_on_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER calculate_grade_on_change BEFORE INSERT OR UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.calculate_grade_fields();


--
-- Name: applications set_application_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_application_id BEFORE INSERT ON public.applications FOR EACH ROW WHEN ((new.application_id IS NULL)) EXECUTE FUNCTION public.generate_application_id();


--
-- Name: applications update_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: attendance update_attendance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: students update_students_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: teachers update_teachers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: term_results update_term_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_term_results_updated_at BEFORE UPDATE ON public.term_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_permissions admin_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: applications applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: attendance attendance_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.teachers(id);


--
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: class_subjects class_subjects_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: class_subjects class_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: class_subjects class_subjects_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: classes classes_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: grades grades_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: grades grades_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- Name: grades grades_entered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES public.teachers(id);


--
-- Name: grades grades_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: grades grades_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: grades grades_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: schedules schedules_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: schedules schedules_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: schedules schedules_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- Name: students students_programme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id) ON DELETE SET NULL;


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: subjects subjects_programme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_programme_id_fkey FOREIGN KEY (programme_id) REFERENCES public.programmes(id) ON DELETE SET NULL;


--
-- Name: teachers teachers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: term_results term_results_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.term_results
    ADD CONSTRAINT term_results_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- Name: term_results term_results_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.term_results
    ADD CONSTRAINT term_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: term_results term_results_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.term_results
    ADD CONSTRAINT term_results_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE;


--
-- Name: terms terms_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: grades Admins can delete grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete grades" ON public.grades FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: academic_years Admins can manage academic years; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage academic years" ON public.academic_years USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: class_subjects Admins can manage class subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage class subjects" ON public.class_subjects USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: classes Admins can manage classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage classes" ON public.classes USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: programmes Admins can manage programmes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage programmes" ON public.programmes USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: schedules Admins can manage schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage schedules" ON public.schedules USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: students Admins can manage students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage students" ON public.students USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: subjects Admins can manage subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subjects" ON public.subjects USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: teachers Admins can manage teachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage teachers" ON public.teachers USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: terms Admins can manage terms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage terms" ON public.terms USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: admin_permissions Admins can view all permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all permissions" ON public.admin_permissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.user_role));


--
-- Name: applications Anyone can submit applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit applications" ON public.applications FOR INSERT WITH CHECK (true);


--
-- Name: academic_years Anyone can view academic years; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view academic years" ON public.academic_years FOR SELECT USING (true);


--
-- Name: class_subjects Anyone can view class subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view class subjects" ON public.class_subjects FOR SELECT USING (true);


--
-- Name: classes Anyone can view classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT USING (true);


--
-- Name: programmes Anyone can view programmes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view programmes" ON public.programmes FOR SELECT USING (true);


--
-- Name: schedules Anyone can view schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view schedules" ON public.schedules FOR SELECT USING (true);


--
-- Name: subjects Anyone can view subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);


--
-- Name: terms Anyone can view terms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view terms" ON public.terms FOR SELECT USING (true);


--
-- Name: grades Staff can insert grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can insert grades" ON public.grades FOR INSERT WITH CHECK (public.is_staff(auth.uid()));


--
-- Name: term_results Staff can manage term results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can manage term results" ON public.term_results USING (public.is_staff(auth.uid()));


--
-- Name: applications Staff can update applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update applications" ON public.applications FOR UPDATE USING (public.is_staff(auth.uid()));


--
-- Name: grades Staff can update grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can update grades" ON public.grades FOR UPDATE USING (public.is_staff(auth.uid()));


--
-- Name: applications Staff can view all applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all applications" ON public.applications FOR SELECT USING (public.is_staff(auth.uid()));


--
-- Name: grades Staff can view all grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all grades" ON public.grades FOR SELECT USING (public.is_staff(auth.uid()));


--
-- Name: profiles Staff can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_staff(auth.uid()));


--
-- Name: students Staff can view all students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all students" ON public.students FOR SELECT USING (public.is_staff(auth.uid()));


--
-- Name: teachers Staff can view all teachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all teachers" ON public.teachers FOR SELECT USING (public.is_staff(auth.uid()));


--
-- Name: term_results Staff can view all term results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view all term results" ON public.term_results FOR SELECT USING (public.is_staff(auth.uid()));


--
-- Name: attendance Students can view their own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own attendance" ON public.attendance FOR SELECT USING ((student_id = public.get_student_id(auth.uid())));


--
-- Name: grades Students can view their own grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own grades" ON public.grades FOR SELECT USING ((student_id = public.get_student_id(auth.uid())));


--
-- Name: students Students can view their own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own record" ON public.students FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: term_results Students can view their published results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their published results" ON public.term_results FOR SELECT USING (((student_id = public.get_student_id(auth.uid())) AND (is_published = true)));


--
-- Name: admin_permissions Super admins can manage permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage permissions" ON public.admin_permissions USING ((EXISTS ( SELECT 1
   FROM public.admin_permissions ap
  WHERE ((ap.user_id = auth.uid()) AND (ap.can_add_admins = true)))));


--
-- Name: attendance Teachers can insert attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can insert attendance" ON public.attendance FOR INSERT WITH CHECK (public.is_staff(auth.uid()));


--
-- Name: attendance Teachers can update attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can update attendance" ON public.attendance FOR UPDATE USING (public.is_staff(auth.uid()));


--
-- Name: attendance Teachers can view attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view attendance" ON public.attendance FOR SELECT USING (public.is_staff(auth.uid()));


--
-- Name: teachers Teachers can view their own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view their own record" ON public.teachers FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: academic_years; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: class_subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

--
-- Name: grades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: programmes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;

--
-- Name: schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: teachers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

--
-- Name: term_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.term_results ENABLE ROW LEVEL SECURITY;

--
-- Name: terms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;