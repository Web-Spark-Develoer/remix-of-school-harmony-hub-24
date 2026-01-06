import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState } from "react";

const Index = () => {
  const [selectedProgramme, setSelectedProgramme] = useState<string>("");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary">school</span>
            </div>
            <span className="text-xl font-bold text-foreground">Jarreng Schools</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#programmes" className="text-muted-foreground hover:text-foreground transition-colors">Programmes</a>
            <a href="#apply" className="text-muted-foreground hover:text-foreground transition-colors">Apply</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/apply">
              <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow">
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-dots opacity-50"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="material-symbols-outlined text-lg">star</span>
              Jarreng Village Schools - Niamina East District
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight leading-tight mb-6">
              Empowering Education
              <span className="block text-primary">Through Innovation</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A comprehensive school management system for Upper Basic and Senior Secondary students. 
              Access grades, reports, and manage your academic journey - all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/apply">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow px-8">
                  <span className="material-symbols-outlined mr-2">person_add</span>
                  Apply for Admission
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8">
                  <span className="material-symbols-outlined mr-2">login</span>
                  Student Portal
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {[
              { value: "800+", label: "Students", icon: "groups" },
              { value: "37", label: "Teachers", icon: "person" },
              { value: "2", label: "Schools", icon: "school" },
              { value: "100%", label: "Digital", icon: "computer" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-card rounded-xl border border-border p-6 text-center card-hover animate-fade-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="material-symbols-outlined text-primary text-3xl mb-2">{stat.icon}</span>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our platform streamlines school management with powerful features for students, teachers, and administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: "person_add",
                title: "Online Applications",
                description: "Apply for admission online with document uploads and track your application status.",
              },
              {
                icon: "badge",
                title: "Student ID Generation",
                description: "Automatic student ID creation upon acceptance with secure login credentials.",
              },
              {
                icon: "edit_note",
                title: "Grade Management",
                description: "Teachers upload grades per subject and term with admin validation.",
              },
              {
                icon: "description",
                title: "Term Reports",
                description: "Auto-generated PDF reports with grades, GPA, and teacher comments every term.",
              },
              {
                icon: "school",
                title: "Academic Records",
                description: "Complete academic records for all terms with detailed performance tracking.",
              },
              {
                icon: "analytics",
                title: "Analytics",
                description: "Track academic performance with AI-powered insights and predictions.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-card rounded-xl border border-border p-6 card-hover group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="material-symbols-outlined text-primary group-hover:text-primary-foreground text-2xl">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-secondary/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              About Our Schools
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Located in Jarreng Village, Niamina East District, The Gambia, our schools serve 
              approximately 700-800 students across Upper Basic and Senior Secondary levels. With 37 
              dedicated teachers, we are committed to providing quality education and preparing 
              students for a successful future.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-card rounded-lg border border-border px-6 py-4">
                <p className="font-bold text-foreground">Upper Basic School</p>
                <p className="text-sm text-muted-foreground">Grade 7 - 9</p>
              </div>
              <div className="bg-card rounded-lg border border-border px-6 py-4">
                <p className="font-bold text-foreground">Senior Secondary School</p>
                <p className="text-sm text-muted-foreground">Grade 10 - 12</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programmes Section - Only for Senior Secondary */}
      <section id="programmes" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Senior Secondary Programmes
            </h2>
            <p className="text-muted-foreground">
              Academic programmes available for Senior Secondary students (Grades 10-12)
            </p>
          </div>

          {/* Programme Dropdown */}
          <div className="max-w-md mx-auto mb-8">
            <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue placeholder="Select a Programme" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="arts">Art (Humanities Studies)</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="commerce">Commerce</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className={`bg-card rounded-xl border-2 p-6 text-center transition-all ${selectedProgramme === 'arts' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-amber-500 text-3xl">palette</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Art (Humanities Studies)</h3>
              <p className="text-sm text-muted-foreground">
                Focus on History, Literature, Government, Geography, and Social Sciences
              </p>
            </div>

            <div className={`bg-card rounded-xl border-2 p-6 text-center transition-all ${selectedProgramme === 'science' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-emerald-500 text-3xl">science</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Science</h3>
              <p className="text-sm text-muted-foreground">
                Focus on Physics, Chemistry, Biology, Further Mathematics, and Technical subjects
              </p>
            </div>

            <div className={`bg-card rounded-xl border-2 p-6 text-center transition-all ${selectedProgramme === 'commerce' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-blue-500 text-3xl">account_balance</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Commerce</h3>
              <p className="text-sm text-muted-foreground">
                Focus on Accounting, Commerce, Business Management, and Economics
              </p>
            </div>
          </div>

          {/* Note about Upper Basic */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note:</span> Upper Basic School (Grades 7-9) follows a general curriculum without programme specialization.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="apply" className="py-20 px-4 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Start your academic journey with us. Apply online and become part of our growing family 
            of learners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/apply">
              <Button size="lg" variant="secondary" className="px-8">
                <span className="material-symbols-outlined mr-2">edit</span>
                Start Application
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <span className="material-symbols-outlined mr-2">help</span>
                Already Applied?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">school</span>
              </div>
              <div>
                <p className="font-bold text-foreground">Jarreng Village Schools</p>
                <p className="text-xs text-muted-foreground">Niamina East District, The Gambia</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2026 Jarreng Village Schools. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;