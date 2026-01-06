import { Card, CardContent } from "./card";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <Card>
    <CardContent className="py-12 text-center">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </CardContent>
  </Card>
);

export const InlineEmptyState = ({ icon: Icon, title, description }: Omit<EmptyStateProps, "action">) => (
  <div className="text-center py-8 text-muted-foreground">
    <Icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
    <p className="font-medium text-foreground">{title}</p>
    <p className="text-sm">{description}</p>
  </div>
);
