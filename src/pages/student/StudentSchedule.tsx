import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject_name: string;
  teacher_name: string;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const dayColors = [
  "bg-gradient-primary",
  "bg-gradient-purple", 
  "bg-gradient-orange",
  "bg-gradient-teal",
  "bg-gradient-pink",
];

const StudentSchedule = () => {
  const { studentData } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const currentDay = new Date().getDay();

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!studentData?.class_id) {
        setSchedule([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("schedules")
          .select(`id, day_of_week, start_time, end_time, room, subjects (name), teachers (first_name, last_name)`)
          .eq("class_id", studentData.class_id)
          .order("day_of_week")
          .order("start_time");

        if (error) throw error;

        const formatted: ScheduleItem[] = (data || []).map((s: any) => ({
          id: s.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time?.slice(0, 5) || "09:00",
          end_time: s.end_time?.slice(0, 5) || "10:00",
          room: s.room,
          subject_name: s.subjects?.name || "Unknown Subject",
          teacher_name: s.teachers ? `${s.teachers.first_name} ${s.teachers.last_name}` : "TBA",
        }));

        setSchedule(formatted);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [studentData?.class_id]);

  const demoSchedule = schedule.length > 0 ? schedule : [
    { id: "1", day_of_week: 1, start_time: "08:00", end_time: "09:30", room: "Room 101", subject_name: "Mathematics", teacher_name: "Mr. Johnson" },
    { id: "2", day_of_week: 1, start_time: "09:45", end_time: "11:15", room: "Room 102", subject_name: "English", teacher_name: "Mrs. Smith" },
    { id: "3", day_of_week: 1, start_time: "11:30", end_time: "13:00", room: "Lab 1", subject_name: "Physics", teacher_name: "Dr. Williams" },
    { id: "4", day_of_week: 2, start_time: "08:00", end_time: "09:30", room: "Lab 2", subject_name: "Chemistry", teacher_name: "Mr. Brown" },
    { id: "5", day_of_week: 2, start_time: "09:45", end_time: "11:15", room: "Room 103", subject_name: "Biology", teacher_name: "Mrs. Davis" },
    { id: "6", day_of_week: 3, start_time: "08:00", end_time: "09:30", room: "Room 101", subject_name: "History", teacher_name: "Mr. Camara" },
  ];

  const selectedDaySchedule = demoSchedule.filter((s) => s.day_of_week === selectedDay);

  return (
    <StudentLayout title="Schedule">
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">Your weekly class timetable</p>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 animate-fade-up animation-delay-100">
          {[1, 2, 3, 4, 5].map((day, idx) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center px-4 py-3 rounded-2xl min-w-[60px] transition-all duration-200 ${
                selectedDay === day
                  ? `${dayColors[idx]} text-primary-foreground shadow-glow`
                  : "bg-card text-foreground shadow-card hover:bg-muted"
              }`}
            >
              <span className="text-xs font-medium opacity-80">{dayNames[day]}</span>
              <span className="text-lg font-bold">{day + 6}</span>
              {currentDay === day && (
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${selectedDay === day ? 'bg-primary-foreground' : 'bg-primary'}`}></span>
              )}
            </button>
          ))}
        </div>

        {/* Selected Day Header */}
        <div className="flex items-center gap-3 animate-fade-up animation-delay-200">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{fullDayNames[selectedDay]}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedDaySchedule.length} classes scheduled
            </p>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-3 animate-fade-up animation-delay-300">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          ) : selectedDaySchedule.length === 0 ? (
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-foreground">No Classes</p>
                <p className="text-sm text-muted-foreground">Enjoy your day off!</p>
              </CardContent>
            </Card>
          ) : (
            selectedDaySchedule.map((item, idx) => (
              <Card key={item.id} className="rounded-2xl shadow-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 ${dayColors[idx % 5]}`}></div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{item.subject_name}</h3>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {item.start_time} - {item.end_time}
                            </span>
                            {item.room && (
                              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {item.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{item.teacher_name}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
