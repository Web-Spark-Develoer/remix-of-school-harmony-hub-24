import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const variantStyles = {
  default: "bg-secondary text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export const StatCard = ({
  icon,
  label,
  value,
  trend,
  variant = "default",
  className,
}: StatCardProps) => {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-5 card-hover-subtle", className)}>
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-lg", variantStyles[variant])}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1",
              trend.isPositive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            <span className="material-symbols-outlined text-sm">
              {trend.isPositive ? "trending_up" : "trending_down"}
            </span>
            {trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
};
