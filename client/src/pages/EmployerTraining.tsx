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
  Info,
  LinkIcon,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Timer,
  QrCode,
  AlertTriangle,
  Trophy,
  Sparkles,
} from "lucide-react";
import type { Employee, Course, TrainingAssignment } from "@shared/schema";
import logoUrl from "@assets/8_1772477620380.png";

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
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [newHireDialogOpen, setNewHireDialogOpen] = useState(false);
  const [selectedNewHireEmployees, setSelectedNewHireEmployees] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"assignments" | "newhire">("assignments");

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

  const { data: newHireGroups = [], isLoading: newHireLoading } = useQuery<any[]>({
    queryKey: ["/api/training-assignments/new-hire"],
  });

  const newHireAssignMutation = useMutation({
    mutationFn: async (body: { employeeIds: number[] }) => {
      const res = await apiRequest("POST", "/api/training-assignments/new-hire", body);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-assignments/new-hire"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-assignments/stats"] });
      setNewHireDialogOpen(false);
      setSelectedNewHireEmployees([]);
      toast({
        title: "New Hire Onboarding Started",
        description: `${data.totalCourses} safety courses assigned with a 24-hour deadline.`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign new hire onboarding.", variant: "destructive" });
    },
  });

  const handleNewHireAssign = () => {
    if (selectedNewHireEmployees.length === 0) {
      toast({ title: "Selection Required", description: "Please select at least one employee.", variant: "destructive" });
      return;
    }
    newHireAssignMutation.mutate({ employeeIds: selectedNewHireEmployees });
  };

  const toggleNewHireEmployee = (id: number) => {
    setSelectedNewHireEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const getTimeRemaining = (deadline: string | Date | null) => {
    if (!deadline) return null;
    const now = new Date();
    const dl = new Date(deadline);
    const diff = dl.getTime() - now.getTime();
    if (diff <= 0) return { text: "Overdue", overdue: true };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${hours}h ${minutes}m remaining`, overdue: false };
  };

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
            <img src={logoUrl} alt="CCH Logo" className="w-24 h-24 rounded-xl cursor-pointer hover:opacity-80 transition" data-testid="logo-home-link" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">Employer Training Portal</h1>
            <p className="text-sm text-gray-400">Assign and track employee training progress</p>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700/40 mb-8" data-testid="card-instructions">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-between p-5 text-left"
            data-testid="button-toggle-instructions"
          >
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <h2 className="text-lg font-bold text-white">How It Works</h2>
            </div>
            {showInstructions ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {showInstructions && (
            <div className="px-5 pb-5 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Assign a Course</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Click "Assign Course". Select one or more employees and the courses you want them to complete, then hit Assign.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-green-400 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Employee is Automatically Texted</p>
                    <p className="text-gray-400 text-xs mt-1">
                      The employee receives an automatic text message with their unique training link the moment you assign a course — no copying or pasting required. Make sure each employee has a phone number saved.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-blue-400 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">DER Notified on Completion</p>
                    <p className="text-gray-400 text-xs mt-1">
                      When an employee finishes a course, your Designated Employer Representative (DER) is automatically texted the employee's name, course, completion time, and certificate number. Set your DER phone in Account Settings.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 border-t border-gray-700/50 pt-3">
                Employees must first be added in your <Link href="/employees"><span className="text-blue-400 hover:text-blue-300 underline cursor-pointer">Employee Management</span></Link> page (with a phone number) before you can assign them courses. Set your DER phone number in <Link href="/settings"><span className="text-blue-400 hover:text-blue-300 underline cursor-pointer">Account Settings</span></Link>.
              </p>
            </div>
          )}
        </Card>

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

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6" data-testid="tab-navigation">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "assignments"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            data-testid="tab-assignments"
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Course Assignments
          </button>
          <button
            onClick={() => setActiveTab("newhire")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "newhire"
                ? "bg-orange-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            data-testid="tab-newhire"
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            New Hire Onboarding
            {newHireGroups.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-orange-500/30 text-orange-300 text-xs rounded-full">
                {newHireGroups.length}
              </span>
            )}
          </button>
        </div>

        {/* NEW HIRE ONBOARDING TAB */}
        {activeTab === "newhire" && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 border-orange-700/40 p-5" data-testid="card-newhire-info">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white mb-1">BrandNSwag New Hire Safety Training</h2>
                  <p className="text-sm text-gray-300 mb-3">
                    Assign all 6 OSHA-focused safety courses as a bundle with a 24-hour completion deadline. Employees earn 100 BrandNSwag points and a unique QR reward code upon completion.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1 bg-gray-800/60 px-2 py-1 rounded">
                      <BookOpen className="w-3 h-3" /> 6 Courses
                    </span>
                    <span className="flex items-center gap-1 bg-gray-800/60 px-2 py-1 rounded">
                      <Timer className="w-3 h-3" /> 24hr Deadline
                    </span>
                    <span className="flex items-center gap-1 bg-gray-800/60 px-2 py-1 rounded">
                      <Trophy className="w-3 h-3" /> 100 Points
                    </span>
                    <span className="flex items-center gap-1 bg-gray-800/60 px-2 py-1 rounded">
                      <QrCode className="w-3 h-3" /> QR Reward
                    </span>
                  </div>
                </div>
                <Dialog open={newHireDialogOpen} onOpenChange={setNewHireDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700 gap-2 shrink-0" data-testid="button-assign-newhire">
                      <UserPlus className="w-4 h-4" />
                      Start Onboarding
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-orange-400" />
                        New Hire Safety Onboarding
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <p className="text-sm text-gray-500">
                        Select new hires to assign all 6 BrandNSwag safety courses. Each employee gets a 24-hour deadline and earns 100 points + a QR reward upon completion.
                      </p>
                      <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-green-300">
                          Each new hire with a phone number on file will be <strong>automatically texted all 6 course links</strong> — one text per course, sent seconds apart.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Select New Hires ({selectedNewHireEmployees.length} selected)
                        </h3>
                        <div className="max-h-60 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-md p-2">
                          {employees.length === 0 ? (
                            <p className="text-sm text-gray-500 py-2 text-center">No employees found. Add employees first.</p>
                          ) : (
                            employees.map((emp) => {
                              const alreadyAssigned = newHireGroups.some((g: any) => g.employeeId === emp.id);
                              return (
                                <label
                                  key={emp.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                                    alreadyAssigned ? "opacity-50" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                  }`}
                                  data-testid={`checkbox-newhire-${emp.id}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedNewHireEmployees.includes(emp.id)}
                                    onChange={() => !alreadyAssigned && toggleNewHireEmployee(emp.id)}
                                    disabled={alreadyAssigned}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                  <span className="text-sm flex-1">
                                    {emp.firstName} {emp.lastName}
                                    {emp.department && <span className="text-gray-500 ml-1">({emp.department})</span>}
                                  </span>
                                  {alreadyAssigned && (
                                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Already Assigned</Badge>
                                  )}
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 gap-2"
                        onClick={handleNewHireAssign}
                        disabled={selectedNewHireEmployees.length === 0 || newHireAssignMutation.isPending}
                        data-testid="button-submit-newhire"
                      >
                        {newHireAssignMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        {newHireAssignMutation.isPending
                          ? "Assigning..."
                          : `Start Onboarding for ${selectedNewHireEmployees.length} Employee(s)`}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* New Hire Progress Cards */}
            {newHireLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              </div>
            ) : newHireGroups.length === 0 ? (
              <Card className="bg-gray-800/60 border-gray-700 p-8 text-center" data-testid="card-newhire-empty">
                <UserPlus className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">No New Hire Onboarding Active</h3>
                <p className="text-gray-400 mb-4">
                  Click "Start Onboarding" to assign the 6-course safety bundle to new employees.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {newHireGroups.map((group: any) => {
                  const timeRemaining = getTimeRemaining(group.deadline);
                  const progressPercent = group.totalCount > 0
                    ? Math.round((group.completedCount / group.totalCount) * 100)
                    : 0;

                  return (
                    <Card
                      key={group.employeeId}
                      className={`border p-5 ${
                        group.allCompleted
                          ? "bg-green-900/20 border-green-700/40"
                          : timeRemaining?.overdue
                          ? "bg-red-900/20 border-red-700/40"
                          : "bg-gray-800/60 border-gray-700"
                      }`}
                      data-testid={`card-newhire-${group.employeeId}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            group.allCompleted
                              ? "bg-green-500/20 text-green-400"
                              : timeRemaining?.overdue
                              ? "bg-red-500/20 text-red-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}>
                            {group.employee
                              ? `${group.employee.firstName?.[0] || ""}${group.employee.lastName?.[0] || ""}`
                              : "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-white" data-testid={`text-newhire-name-${group.employeeId}`}>
                              {group.employee
                                ? `${group.employee.firstName} ${group.employee.lastName}`
                                : `Employee #${group.employeeId}`}
                            </p>
                            {group.employee?.department && (
                              <p className="text-xs text-gray-500">{group.employee.department}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {group.allCompleted ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1" data-testid={`badge-newhire-complete-${group.employeeId}`}>
                              <Trophy className="w-3 h-3" /> Completed - 100 pts
                            </Badge>
                          ) : timeRemaining?.overdue ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1" data-testid={`badge-newhire-overdue-${group.employeeId}`}>
                              <AlertTriangle className="w-3 h-3" /> {timeRemaining.text}
                            </Badge>
                          ) : timeRemaining ? (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1" data-testid={`badge-newhire-timer-${group.employeeId}`}>
                              <Timer className="w-3 h-3" /> {timeRemaining.text}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              group.allCompleted
                                ? "bg-green-500"
                                : timeRemaining?.overdue
                                ? "bg-red-500"
                                : "bg-orange-500"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 whitespace-nowrap" data-testid={`text-newhire-progress-${group.employeeId}`}>
                          {group.completedCount}/{group.totalCount} courses
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COURSE ASSIGNMENTS TAB */}
        {activeTab === "assignments" && (
        <>
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
              <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <p className="text-xs text-green-300">
                  Employees with a phone number on file will be <strong>automatically texted their training link</strong> the moment you assign a course. No manual sharing required.
                </p>
              </div>
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
        </>
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
