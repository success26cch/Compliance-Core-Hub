import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  BookOpen,
  Users,
  CheckCircle2,
  BarChart3,
  Loader2,
  Copy,
  Plus,
  Search,
  GraduationCap,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { Employee, Course, TrainingAssignment } from "@shared/schema";
import logoUrl from "@assets/1_1770683748423.png";

interface EnrichedAssignment extends TrainingAssignment {
  employee?: Employee;
  course?: Course;
}

interface TrainingStats {
  total: number;
  assigned: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export default function EmployerTraining() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<EnrichedAssignment[]>({
    queryKey: ["/api/training-assignments"],
  });

  const { data: stats } = useQuery<TrainingStats>({
    queryKey: ["/api/training-assignments/stats"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const assignMutation = useMutation({
    mutationFn: async (body: { employeeIds: number[]; courseIds: number[] }) => {
      const res = await apiRequest("POST", "/api/training-assignments", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-assignments/stats"] });
      setAssignDialogOpen(false);
      setSelectedEmployees([]);
      setSelectedCourses([]);
      toast({ title: "Courses Assigned", description: "Training assignments created successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign courses.", variant: "destructive" });
    },
  });

  const handleAssign = () => {
    if (selectedEmployees.length === 0 || selectedCourses.length === 0) {
      toast({ title: "Selection Required", description: "Please select at least one employee and one course.", variant: "destructive" });
      return;
    }
    assignMutation.mutate({ employeeIds: selectedEmployees, courseIds: selectedCourses });
  };

  const handleCopyLink = (accessToken: string) => {
    const url = `${window.location.origin}/employee-training?token=${accessToken}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link Copied", description: "Training access link copied to clipboard." });
    });
  };

  const toggleEmployee = (id: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleCourse = (id: number) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30" data-testid="badge-status-in-progress">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid="badge-status-completed">Completed</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30" data-testid="badge-status-assigned">Assigned</Badge>;
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const empName = `${a.employee?.firstName || ""} ${a.employee?.lastName || ""}`.toLowerCase();
    const courseTitle = (a.course?.title || "").toLowerCase();
    return empName.includes(q) || courseTitle.includes(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <button className="text-gray-400 hover:text-white transition" data-testid="link-back-home">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/">
            <img src={logoUrl} alt="CCH Logo" className="w-10 h-10 rounded cursor-pointer hover:opacity-80 transition" data-testid="logo-home-link" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Employer Training Portal</h1>
            <p className="text-sm text-gray-400">Assign and track employee training progress</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/60 border-gray-700 p-5" data-testid="card-stat-total">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Total Assignments</p>
                <p className="text-2xl font-bold text-white">{stats?.total ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-800/60 border-gray-700 p-5" data-testid="card-stat-in-progress">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-white">{stats?.inProgress ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-800/60 border-gray-700 p-5" data-testid="card-stat-completed">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-white">{stats?.completed ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-800/60 border-gray-700 p-5" data-testid="card-stat-rate">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-white">{stats?.completionRate ?? 0}%</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by employee or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
              data-testid="input-search-assignments"
            />
          </div>
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 gap-2" data-testid="button-assign-course">
                <Plus className="w-4 h-4" />
                Assign Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assign Courses to Employees</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Select Employees ({selectedEmployees.length} selected)
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-md p-2">
                    {employees.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2 text-center">No employees found. Add employees first.</p>
                    ) : (
                      employees.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center gap-3 p-2 rounded hover-elevate cursor-pointer"
                          data-testid={`checkbox-employee-${emp.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm">
                            {emp.firstName} {emp.lastName}
                            {emp.department && <span className="text-gray-500 ml-1">({emp.department})</span>}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Select Courses ({selectedCourses.length} selected)
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-md p-2">
                    {courses.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2 text-center">No courses available.</p>
                    ) : (
                      courses.map((course) => (
                        <label
                          key={course.id}
                          className="flex items-center gap-3 p-2 rounded hover-elevate cursor-pointer"
                          data-testid={`checkbox-course-${course.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            onChange={() => toggleCourse(course.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{course.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-600 gap-2"
                  onClick={handleAssign}
                  disabled={selectedEmployees.length === 0 || selectedCourses.length === 0 || assignMutation.isPending}
                  data-testid="button-submit-assign"
                >
                  {assignMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {assignMutation.isPending ? "Assigning..." : `Assign ${selectedCourses.length} Course(s) to ${selectedEmployees.length} Employee(s)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {assignmentsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <Card className="bg-gray-800/60 border-gray-700 p-8 text-center">
            <GraduationCap className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2" data-testid="text-empty-state">
              {assignments.length === 0 ? "No Training Assignments Yet" : "No Matching Assignments"}
            </h3>
            <p className="text-gray-400 mb-4">
              {assignments.length === 0
                ? "Get started by assigning courses to your employees. They'll receive access links to complete training at their own pace."
                : "Try adjusting your search query."}
            </p>
            {assignments.length === 0 && (
              <Button className="bg-blue-600 gap-2" onClick={() => setAssignDialogOpen(true)} data-testid="button-assign-first">
                <Plus className="w-4 h-4" />
                Assign Your First Course
              </Button>
            )}
          </Card>
        ) : (
          <Card className="bg-gray-800/60 border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-assignments">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Employee</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Course</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Progress</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Assigned Date</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="border-b border-gray-700/50 last:border-b-0"
                      data-testid={`row-assignment-${assignment.id}`}
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-white" data-testid={`text-employee-name-${assignment.id}`}>
                            {assignment.employee
                              ? `${assignment.employee.firstName} ${assignment.employee.lastName}`
                              : "Unknown Employee"}
                          </p>
                          {assignment.employee?.email && (
                            <p className="text-xs text-gray-500">{assignment.employee.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white" data-testid={`text-course-title-${assignment.id}`}>
                          {assignment.course?.title || "Unknown Course"}
                        </p>
                        {assignment.course?.totalModules && (
                          <p className="text-xs text-gray-500">{assignment.course.totalModules} modules</p>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(assignment.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                assignment.status === "completed" ? "bg-green-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${assignment.progress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400" data-testid={`text-progress-${assignment.id}`}>
                            {assignment.progress ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-400" data-testid={`text-assigned-date-${assignment.id}`}>
                          {assignment.assignedAt
                            ? new Date(assignment.assignedAt).toLocaleDateString()
                            : "--"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-gray-600 text-gray-300"
                          onClick={() => handleCopyLink(assignment.accessToken)}
                          data-testid={`button-copy-link-${assignment.id}`}
                        >
                          <Copy className="w-3 h-3" />
                          Copy Link
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="text-center mt-8">
          <Link href="/">
            <span className="text-blue-400 underline cursor-pointer text-sm" data-testid="link-home">Back to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
