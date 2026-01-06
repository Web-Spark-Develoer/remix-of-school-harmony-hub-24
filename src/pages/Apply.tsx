import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Subject lists
const UPPER_BASIC_SUBJECTS = [
  "English",
  "Mathematics",
  "Integrated Science",
  "S.E.S",
  "Religious Education (IRK or CRE)",
  "Agricultural Science",
  "French",
  "PHE",
  "Literature in English",
  "Computer Studies/ICT",
  "Home Science",
  "Art and Craft",
  "Woodwork",
  "Technical Drawing",
  "Economics"
];

const SENIOR_SECONDARY_SUBJECTS = [
  "English",
  "Mathematics",
  "General Science",
  "S.E.S",
  "Religious Education (IRK or CRE)",
  "Agricultural Science",
  "French",
  "PHE",
  "Literature in English",
  "Computer Studies/ICT",
  "Home Science",
  "Art and Craft",
  "Woodwork",
  "Technical Drawing",
  "Economics",
  "Biology",
  "Chemistry",
  "Physics",
  "Further Mathematics",
  "Government",
  "Geography",
  "History",
  "Accounting",
  "Commerce",
  "Business Management",
  "Food and Nutrition",
  "Music",
  "Arabic",
  "Visual Art"
];

const GRADES = ["A", "B", "C", "D", "E", "F"];

// Upper Basic grade sections
const UPPER_BASIC_GRADES = {
  "7": ["7A", "7B", "7C", "7D", "7E", "7F", "7G"],
  "8": ["8A", "8B", "8C", "8D", "8E", "8F", "8G"],
  "9": ["9A", "9B", "9C", "9D", "9E", "9F", "9G"],
};

// Senior Secondary specializations
const SENIOR_SECONDARY_SPECIALIZATIONS = ["Commerce", "Agric", "Technical", "Home Science", "Arts"];

interface SubjectGrade {
  subject: string;
  grade: string;
}

const Apply = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "Gambian",
    // Contact
    email: "",
    phone: "",
    address: "",
    village: "Jarreng",
    // Academic
    previousSchool: "",
    admissionType: "", // "upper_basic" or "senior_secondary"
    gradeLevel: "", // "7", "8", "9" for upper basic OR "10", "11", "12" for senior secondary
    classSection: "", // "7A", "7B" etc for upper basic OR "Commerce", "Agric" etc for senior secondary
    programme: "", // Only for senior secondary
    subjectGrades: [] as SubjectGrade[],
    // Guardian
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    guardianEmail: "",
  });

  const updateForm = (field: string, value: string | SubjectGrade[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSubjectGrade = (subject: string, grade: string) => {
    setFormData((prev) => {
      const existingIndex = prev.subjectGrades.findIndex(sg => sg.subject === subject);
      let newGrades = [...prev.subjectGrades];
      
      if (existingIndex >= 0) {
        newGrades[existingIndex] = { subject, grade };
      } else {
        newGrades.push({ subject, grade });
      }
      
      return { ...prev, subjectGrades: newGrades };
    });
  };

  const getSubjectGrade = (subject: string): string => {
    return formData.subjectGrades.find(sg => sg.subject === subject)?.grade || "";
  };

  const getSubjectsForAdmissionType = () => {
    return formData.admissionType === "upper_basic" 
      ? UPPER_BASIC_SUBJECTS 
      : SENIOR_SECONDARY_SUBJECTS;
  };

  const getGradeLevelsForAdmissionType = () => {
    if (formData.admissionType === "upper_basic") {
      return ["7", "8", "9"];
    }
    return ["10", "11", "12"];
  };

  const getClassSectionsForGrade = () => {
    if (formData.admissionType === "upper_basic" && formData.gradeLevel) {
      return UPPER_BASIC_GRADES[formData.gradeLevel as keyof typeof UPPER_BASIC_GRADES] || [];
    }
    if (formData.admissionType === "senior_secondary") {
      return SENIOR_SECONDARY_SPECIALIZATIONS.map(spec => `${formData.gradeLevel} ${spec}`);
    }
    return [];
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 2:
        if (!formData.email || !formData.phone || !formData.address) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        if (!formData.previousSchool || !formData.admissionType || !formData.gradeLevel || !formData.classSection) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return false;
        }
        // For senior secondary, programme is required
        if (formData.admissionType === "senior_secondary" && !formData.programme) {
          toast({
            title: "Missing Information",
            description: "Please select a programme of study.",
            variant: "destructive",
          });
          return false;
        }
        // Validate that at least 5 subjects have grades
        const filledSubjects = formData.subjectGrades.filter(sg => sg.grade);
        if (filledSubjects.length < 5) {
          toast({
            title: "Missing Subject Grades",
            description: "Please enter grades for at least 5 subjects.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guardianName || !formData.guardianRelation || !formData.guardianPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required guardian fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert subject grades to a readable format for last_grade_completed
      const gradesString = formData.subjectGrades
        .filter(sg => sg.grade)
        .map(sg => `${sg.subject}: ${sg.grade}`)
        .join("; ");

      const applicationData = {
        application_id: `APP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        village: formData.village,
        previous_school: formData.previousSchool,
        last_grade_completed: gradesString,
        applying_for_grade: parseInt(formData.gradeLevel),
        programme: formData.admissionType === "senior_secondary" ? formData.programme : "General",
        guardian_name: formData.guardianName,
        guardian_relation: formData.guardianRelation,
        guardian_phone: formData.guardianPhone,
        guardian_email: formData.guardianEmail || null,
      };

      const { error } = await supabase
        .from('applications')
        .insert([applicationData]);

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "You will receive an email with your application status within 5-7 business days.",
      });
      
      navigate("/");
    } catch (error: any) {
      console.error('Application submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {/* Header */}
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary">school</span>
            </div>
            <span className="text-xl font-bold text-foreground">Jarreng Schools</span>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">
              Already have an account?
            </Button>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                  s
                )}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${
                    s < step ? "bg-success" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Personal Information"}
              {step === 2 && "Contact Details"}
              {step === 3 && "Academic Information"}
              {step === 4 && "Guardian Information"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "How can we reach you?"}
              {step === 3 && "Your educational background and subject grades"}
              {step === 4 && "Parent or guardian contact details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => updateForm("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => updateForm("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(v) => updateForm("gender", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => updateForm("nationality", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Contact Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+220 ..."
                      value={formData.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Home Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="village">Village/Town</Label>
                    <Input
                      id="village"
                      value={formData.village}
                      onChange={(e) => updateForm("village", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Academic Info with Subject Grades */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="previousSchool">Previous School *</Label>
                    <Input
                      id="previousSchool"
                      placeholder="Name of your previous school"
                      value={formData.previousSchool}
                      onChange={(e) => updateForm("previousSchool", e.target.value)}
                      required
                    />
                  </div>

                  {/* School Type Dropdown (renamed from Admission Type) */}
                  <div className="space-y-2">
                    <Label htmlFor="admissionType">Select School *</Label>
                    <Select 
                      value={formData.admissionType} 
                      onValueChange={(v) => {
                        updateForm("admissionType", v);
                        updateForm("gradeLevel", "");
                        updateForm("classSection", "");
                        updateForm("programme", "");
                        updateForm("subjectGrades", []);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="upper_basic">Upper Basic School</SelectItem>
                        <SelectItem value="senior_secondary">Senior Secondary School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.admissionType && (
                    <>
                      {/* Grade Level Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="gradeLevel">Select Grade *</Label>
                        <Select 
                          value={formData.gradeLevel} 
                          onValueChange={(v) => {
                            updateForm("gradeLevel", v);
                            updateForm("classSection", "");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {getGradeLevelsForAdmissionType().map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                Grade {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Class Section Selection */}
                      {formData.gradeLevel && (
                        <div className="space-y-2">
                          <Label htmlFor="classSection">
                            {formData.admissionType === "upper_basic" ? "Select Class Section *" : "Select Specialization *"}
                          </Label>
                          <Select value={formData.classSection} onValueChange={(v) => updateForm("classSection", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder={formData.admissionType === "upper_basic" ? "Select section" : "Select specialization"} />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              {getClassSectionsForGrade().map((section) => (
                                <SelectItem key={section} value={section}>
                                  {section}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Programme Selection - Only for Senior Secondary */}
                      {formData.admissionType === "senior_secondary" && (
                        <div className="space-y-2">
                          <Label htmlFor="programme">Programme of Study *</Label>
                          <Select value={formData.programme} onValueChange={(v) => updateForm("programme", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select programme" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              <SelectItem value="Arts">Art (Humanities Studies)</SelectItem>
                              <SelectItem value="Science">Science</SelectItem>
                              <SelectItem value="Commerce">Commerce</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Subject Grades Section */}
                      <div className="space-y-3 mt-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Select Subject & Grade Obtained *</Label>
                          <span className="text-xs text-muted-foreground">
                            {formData.subjectGrades.filter(sg => sg.grade).length} subjects selected
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enter the grades you obtained in your previous school for the following subjects (minimum 5 subjects required)
                        </p>
                        
                        <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-3">
                          {getSubjectsForAdmissionType().map((subject) => (
                            <div key={subject} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                              <span className="text-sm font-medium text-foreground flex-1">{subject}</span>
                              <Select 
                                value={getSubjectGrade(subject)} 
                                onValueChange={(v) => updateSubjectGrade(subject, v)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue placeholder="Grade" />
                                </SelectTrigger>
                                <SelectContent className="bg-card">
                                  {GRADES.map((grade) => (
                                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 4: Guardian Info */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Full Name *</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={(e) => updateForm("guardianName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianRelation">Relationship to Student *</Label>
                    <Select value={formData.guardianRelation} onValueChange={(v) => updateForm("guardianRelation", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Guardian Phone Number *</Label>
                    <Input
                      id="guardianPhone"
                      type="tel"
                      placeholder="+220 ..."
                      value={formData.guardianPhone}
                      onChange={(e) => updateForm("guardianPhone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">Guardian Email (Optional)</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      value={formData.guardianEmail}
                      onChange={(e) => updateForm("guardianEmail", e.target.value)}
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg mt-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 rounded border-border" required />
                      <span className="text-sm text-muted-foreground">
                        I confirm that all information provided is accurate and complete. I understand that false information may result in rejection of my application.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    <span className="material-symbols-outlined mr-2">arrow_back</span>
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <span className="material-symbols-outlined ml-2">arrow_forward</span>
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-2">send</span>
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Apply;