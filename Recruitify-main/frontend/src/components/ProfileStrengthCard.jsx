import { useNavigate } from "@tanstack/react-router";
import { useProfileStrength } from "../hooks/useQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Zap } from "lucide-react";

export default function ProfileStrengthCard() {
  const navigate = useNavigate();
  const { data, isLoading } = useProfileStrength();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data) return null;

  const { score, missing } = data;
  const color = score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? "Strong" : score >= 50 ? "Good" : "Needs Work";

  return (
    <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-yellow-500" />
          Profile Strength
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Score ring */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={color} strokeWidth="3"
                strokeDasharray={`${score} ${100 - score}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
              {score}%
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white" style={{ color }}>{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {missing.length > 0 ? `${missing.length} item${missing.length > 1 ? 's' : ''} to complete` : "Profile complete!"}
            </p>
          </div>
        </div>

        {/* Missing items */}
        {missing.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {missing.slice(0, 3).map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <AlertCircle className="h-3 w-3 text-orange-400 flex-shrink-0" />
                {item}
              </div>
            ))}
            {missing.length > 3 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 pl-5">+{missing.length - 3} more</p>
            )}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-transparent"
          onClick={() => navigate({ to: '/candidate/profile' })}
        >
          Complete Profile →
        </Button>
      </CardContent>
    </Card>
  );
}
