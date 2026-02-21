import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Clock,
  Timer,
  Trophy,
  Sparkles,
} from "lucide-react";
import type { Course } from "@shared/schema";
import logoUrl from "@assets/1_1770683748423.png";

interface RedeemResponse {
  assignmentId: number;
  courseId: number;
  employeeUserId: number;
  employeeName: string;
  token: string;
  assignmentType?: string;
  deadline?: string;
}

export default function EmployeeTraining() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const [, navigate] = useLocation();
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  const redeemMutation = useMutation({
    mutationFn: async (t: string): Promise<RedeemResponse> => {
      const res = await apiRequest("POST", "/api/training-access/redeem", { token: t });
      return res.json();
    },
  });

  const { data: sessionData } = useQuery({
    queryKey: ["/api/training-access/session", token],
    queryFn: async () => {
      const res = await fetch(`/api/training-access/session?token=${token}`);
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
    enabled: !!token && redeemMutation.isSuccess,
  });

  const courseId = redeemMutation.data?.courseId ?? sessionData?.courseId;

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: !!courseId,
  });

  const course = courses.find((c) => c.id === courseId);
  const employeeName = redeemMutation.data?.employeeName || "Employee";
  const isNewHire = redeemMutation.data?.assignmentType === "new_hire_onboarding";
  const deadline = redeemMutation.data?.deadline;

  useEffect(() => {
    if (token && !redeemMutation.isSuccess && !redeemMutation.isPending && !redeemMutation.isError) {
      redeemMutation.mutate(token);
    }
  }, [token]);

  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const now = new Date();
      const dl = new Date(deadline);
      const diff = dl.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Overdue");
        setIsOverdue(true);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      setIsOverdue(false);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/80 border-gray-700 p-8 text-center space-y-4" data-testid="card-no-token">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white" data-testid="text-error-title">No Training Link Provided</h2>
          <p className="text-gray-400" data-testid="text-error-message">
            Please use the training link sent to your email to access your assigned courses.
          </p>
        </Card>
      </div>
    );
  }

  if (redeemMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4" data-testid="loading-state">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
          <p className="text-gray-400">Verifying your training access...</p>
        </div>
      </div>
    );
  }

  if (redeemMutation.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/80 border-gray-700 p-8 text-center space-y-4" data-testid="card-error">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white" data-testid="text-error-title">Access Error</h2>
          <p className="text-gray-400" data-testid="text-error-message">
            {(redeemMutation.error as Error)?.message || "Unable to verify your training access. The link may be invalid or expired."}
          </p>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-300"
            onClick={() => redeemMutation.mutate(token)}
            data-testid="btn-retry"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <img
            src={logoUrl}
            alt="Core Compliance Hub"
            className="w-16 h-16 rounded mx-auto"
            data-testid="img-logo"
          />
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="text-welcome">
              Welcome, {employeeName}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {isNewHire ? "New Hire Safety Training" : "Your assigned training is ready"}
            </p>
          </div>
        </div>

        {isNewHire && deadline && (
          <Card
            className={`p-4 text-center ${
              isOverdue
                ? "bg-red-900/30 border-red-700/40"
                : "bg-orange-900/30 border-orange-700/40"
            }`}
            data-testid="card-deadline-timer"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {isOverdue ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <Timer className="w-5 h-5 text-orange-400" />
              )}
              <span className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-orange-400"}`}>
                {isOverdue ? "Deadline Passed" : "Completion Deadline"}
              </span>
            </div>
            <p className={`text-2xl font-bold ${isOverdue ? "text-red-300" : "text-orange-300"}`} data-testid="text-countdown">
              {timeLeft}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Complete all courses to earn 100 BrandNSwag points + QR reward!</span>
            </div>
          </Card>
        )}

        {course ? (
          <Card className="bg-gray-800/80 border-gray-700 p-6 space-y-4" data-testid="card-course">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white" data-testid="text-course-title">
                  {course.title}
                </h2>
                <p className="text-sm text-gray-400 mt-1" data-testid="text-course-description">
                  {course.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1" data-testid="text-course-modules">
                <BookOpen className="w-4 h-4" /> {course.totalModules} modules
              </span>
              <span className="flex items-center gap-1" data-testid="text-course-hours">
                <Clock className="w-4 h-4" /> ~{course.estimatedHours}h estimated
              </span>
            </div>

            <Button
              className="w-full bg-blue-600 text-white font-bold text-base"
              onClick={() => navigate(`/training/${courseId}?token=${token}`)}
              data-testid="btn-start-training"
            >
              Start Training <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        ) : (
          <Card className="bg-gray-800/80 border-gray-700 p-6 text-center" data-testid="card-loading-course">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-gray-400">Loading course information...</p>
          </Card>
        )}

        <p className="text-center text-xs text-gray-600" data-testid="text-footer">
          Powered by Core Compliance Hub
        </p>
      </div>
    </div>
  );
}
