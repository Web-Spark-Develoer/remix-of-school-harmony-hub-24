import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  grade: string;
  size?: "sm" | "md" | "lg";
  showRemark?: boolean;
}

const gradeColors: Record<string, string> = {
  "A": "bg-grade-excellent text-white",
  "A-": "bg-grade-excellent text-white",
  "B+": "bg-grade-veryGood text-white",
  "B": "bg-grade-veryGood text-white",
  "B-": "bg-primary/80 text-white",
  "C+": "bg-grade-good text-white",
  "C": "bg-grade-good text-white",
  "C-": "bg-warning/80 text-white",
  "D+": "bg-warning/60 text-foreground",
  "D": "bg-warning/60 text-foreground",
  "F": "bg-grade-fail text-white",
};

const gradeRemarks: Record<string, string> = {
  "A": "EXCELLENT",
  "A-": "EXCELLENT",
  "B+": "VERY GOOD",
  "B": "VERY GOOD",
  "B-": "GOOD",
  "C+": "SATISFACTORY",
  "C": "SATISFACTORY",
  "C-": "PASS",
  "D+": "PASS",
  "D": "POOR",
  "F": "FAIL",
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5 font-semibold",
};

export const GradeBadge = ({ grade, size = "md", showRemark = false }: GradeBadgeProps) => {
  const colorClass = gradeColors[grade] || "bg-muted text-muted-foreground";
  const remark = gradeRemarks[grade] || "";

  return (
    <div className="flex items-center gap-2">
      <span className={cn("rounded-full font-bold", colorClass, sizeClasses[size])}>
        {grade}
      </span>
      {showRemark && remark && (
        <span className="text-xs text-muted-foreground">{remark}</span>
      )}
    </div>
  );
};
