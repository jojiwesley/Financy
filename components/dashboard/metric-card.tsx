import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trendValue) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trendValue && (
              <span
                className={cn(
                  "mr-1 font-medium",
                  trend === "up" && "text-green-600",
                  trend === "down" && "text-red-600"
                )}
              >
                {trendValue}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
