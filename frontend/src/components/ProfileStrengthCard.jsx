import { useNavigate } from "@tanstack/react-router";
import { useProfileStrength } from "../hooks/useQueries";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Zap } from "lucide-react";

export default function ProfileStrengthCard() {
  const navigate = useNavigate();
  const { data, isLoading } = useProfileStrength();

  if (isLoading) return <Skeleton className="h-14 w-full" />;
  if (!data) return null;

  const { score, missing } = data;
  const color = score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? "Strong" : score >= 50 ? "Good" : "Needs Work";

  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-4">
          {/* Icon + label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Profile Strength</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${score}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-sm font-bold flex-shrink-0" style={{ color }}>{score}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
          </div>

          {/* Missing items (compact) */}
          {missing.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              {missing.slice(0, 2).map((item) => (
                <div key={item} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <AlertCircle className="h-3 w-3 text-orange-400 flex-shrink-0" />
                  <span className="truncate max-w-[100px]">{item}</span>
                </div>
              ))}
              {missing.length > 2 && (
                <span className="text-xs text-gray-400">+{missing.length - 2} more</span>
              )}
            </div>
          )}

          {/* CTA */}
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 text-xs h-7 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            onClick={() => navigate({ to: '/candidate/profile' })}
          >
            Complete Profile →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
