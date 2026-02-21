import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRODUCTS } from "@/lib/products";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShoppingCart,
  Award,
  Loader2,
  ArrowLeft,
  Play,
  Trophy,
  Upload,
  Trash2,
  Video,
  FileText,
  Gift,
} from "lucide-react";
import type { Course, CourseEnrollment, CourseCertificate } from "@shared/schema";
import logoUrl from "@assets/1_1770683748423.png";

const COURSE_PRODUCT_MAP: Record<string, { productId: string; icon: string; color: string }> = {
  "course-dot-medical": { productId: "course-dot-medical", icon: "🩺", color: "blue" },
  "course-osha-surveillance": { productId: "course-osha-surveillance", icon: "🔬", color: "green" },
  "course-drug-alcohol": { productId: "course-drug-alcohol", icon: "🧪", color: "purple" },
  "course-iso-management": { productId: "course-iso-management", icon: "📋", color: "orange" },
  "course-osha-recordkeeping": { productId: "course-osha-recordkeeping", icon: "📊", color: "red" },
  "course-complete-bundle": { productId: "course-complete-bundle", icon: "🎓", color: "yellow" },
  "bns-workplace-safety-orientation": { productId: "bns-workplace-safety-orientation", icon: "🏢", color: "blue" },
  "bns-injury-reporting": { productId: "bns-injury-reporting", icon: "🩹", color: "red" },
  "bns-slips-trips-falls": { productId: "bns-slips-trips-falls", icon: "⚠️", color: "yellow" },
  "bns-hazcom-right-to-know": { productId: "bns-hazcom-right-to-know", icon: "☣️", color: "purple" },
  "bns-ppe-essentials": { productId: "bns-ppe-essentials", icon: "🦺", color: "orange" },
  "bns-drug-alcohol-awareness": { productId: "bns-drug-alcohol-awareness", icon: "🚫", color: "green" },
};

export default function Training() {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"my-courses" | "catalog">(
    tabParam === "my-courses" ? "my-courses" : tabParam === "catalog" ? "catalog" : "my-courses"
  );

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments = [] } = useQuery<CourseEnrollment[]>({
    queryKey: ["/api/enrollments"],
    enabled: isAuthenticated,
  });

  const { data: certificates = [] } = useQuery<CourseCertificate[]>({
    queryKey: ["/api/certificates"],
    enabled: isAuthenticated,
  });

  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState(false);

  const { data: trainingVideo } = useQuery<{ url: string | null }>({
    queryKey: ["/api/training-video"],
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/training-video");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-video"] });
      toast({ title: "Video removed" });
    },
  });

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 100MB", variant: "destructive" });
      return;
    }
    setVideoUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      const res = await fetch("/api/training-video", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      queryClient.invalidateQueries({ queryKey: ["/api/training-video"] });
      toast({ title: "Video uploaded successfully" });
    } catch {
      toast({ title: "Failed to upload video", variant: "destructive" });
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest("POST", "/api/enrollments", { courseId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
  });

  const getEnrollment = (courseId: number) => enrollments.find((e) => e.courseId === courseId);
  const getCertificate = (courseId: number) => certificates.find((c) => c.courseId === courseId);

  const handleAddToCart = (productId: string) => {
    const product = PRODUCTS[productId];
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        unitAmount: product.unitAmount,
        currency: product.currency,
        interval: product.interval,
        category: product.category,
      });
      toast({ title: "Added to cart", description: product.name });
    }
  };

  const handleStartCourse = async (course: Course) => {
    const enrollment = getEnrollment(course.id);
    if (enrollment) {
      navigate(`/training/${course.id}`);
    } else {
      try {
        await enrollMutation.mutateAsync(course.id);
        navigate(`/training/${course.id}`);
      } catch {
        toast({ title: "Failed to enroll", variant: "destructive" });
      }
    }
  };

  const hasEnrollments = enrollments.length > 0;
  const effectiveTab = hasEnrollments ? activeTab : "catalog";

  const activeEnrollments = enrollments.filter(e => e.status === "active");
  const completedEnrollments = enrollments.filter(e => e.status === "completed");
  const totalProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

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
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Training Courses</h1>
            <p className="text-sm text-gray-400">Self-paced compliance training with certificates</p>
          </div>
        </div>

        {trainingVideo?.url ? (
          <div className="mb-8 rounded-xl overflow-hidden border border-gray-700/50 bg-gray-900" data-testid="training-video-section">
            <video
              src={trainingVideo.url}
              controls
              className="w-full max-h-[400px] object-contain bg-black"
              data-testid="training-video-player"
            />
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Professional Compliance Training</h2>
                  <p className="text-xs text-gray-400">Self-paced courses with certificates of completion</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <>
                    <input type="file" ref={videoInputRef} accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" onChange={handleVideoUpload} className="hidden" data-testid="input-video-upload" />
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-400" onClick={() => videoInputRef.current?.click()} disabled={videoUploading} data-testid="btn-replace-video">
                      {videoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-700/50 text-red-400 hover:bg-red-900/30" onClick={() => deleteVideoMutation.mutate()} disabled={deleteVideoMutation.isPending} data-testid="btn-delete-video">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Card className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-blue-700/50 p-6 mb-8" data-testid="training-hero-card">
            <div className="flex items-start gap-4">
              <GraduationCap className="w-10 h-10 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Professional Compliance Training</h2>
                <p className="text-gray-300 text-sm">
                  Each course includes video-style modules, comprehensive text lessons, and quizzes at the end of each module.
                  Score 70% or higher on all module quizzes to earn your CCH Certificate of Completion.
                </p>
                <p className="text-yellow-400 text-sm mt-2 font-medium">
                  Every course purchase includes a FREE one-on-one Compliance Program Consultation.
                </p>
                {isAuthenticated && (
                  <div className="mt-4">
                    <input type="file" ref={videoInputRef} accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" onChange={handleVideoUpload} className="hidden" data-testid="input-video-upload" />
                    <Button variant="outline" size="sm" className="border-blue-600/50 text-blue-400 hover:bg-blue-900/30" onClick={() => videoInputRef.current?.click()} disabled={videoUploading} data-testid="btn-upload-video">
                      {videoUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                      Upload Intro Video
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Link href="/employer-training">
              <span className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mt-3 cursor-pointer underline ml-14" data-testid="link-employer-portal">
                Employer Training Portal — Assign & track employee progress
              </span>
            </Link>
          </Card>
        )}

        {trainingVideo?.url && (
          <div className="flex items-center gap-4 mb-6 text-sm">
            <p className="text-yellow-400 font-medium">
              Every course purchase includes a FREE one-on-one Compliance Program Consultation.
            </p>
            <Link href="/employer-training">
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline whitespace-nowrap" data-testid="link-employer-portal-secondary">
                Employer Training Portal
              </span>
            </Link>
          </div>
        )}

        {isAuthenticated && hasEnrollments && (
          <div className="flex gap-1 mb-6 bg-gray-800/60 p-1 rounded-lg w-fit" data-testid="tab-switcher">
            <button
              className={`px-5 py-2.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${effectiveTab === "my-courses" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("my-courses")}
              data-testid="tab-my-courses"
            >
              <GraduationCap className="w-4 h-4" />
              My Courses ({enrollments.length})
            </button>
            <button
              className={`px-5 py-2.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${effectiveTab === "catalog" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("catalog")}
              data-testid="tab-catalog"
            >
              <BookOpen className="w-4 h-4" />
              Course Catalog
            </button>
          </div>
        )}

        {effectiveTab === "my-courses" && isAuthenticated && hasEnrollments && (
          <div data-testid="section-my-courses">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800/60 border-gray-700 p-4 text-center" data-testid="stat-total">
                <p className="text-2xl font-bold text-white">{enrollments.length}</p>
                <p className="text-xs text-gray-400 mt-1">Total Courses</p>
              </Card>
              <Card className="bg-gray-800/60 border-gray-700 p-4 text-center" data-testid="stat-in-progress">
                <p className="text-2xl font-bold text-blue-400">{activeEnrollments.length}</p>
                <p className="text-xs text-gray-400 mt-1">In Progress</p>
              </Card>
              <Card className="bg-gray-800/60 border-gray-700 p-4 text-center" data-testid="stat-completed">
                <p className="text-2xl font-bold text-green-400">{completedEnrollments.length}</p>
                <p className="text-xs text-gray-400 mt-1">Completed</p>
              </Card>
              <Card className="bg-gray-800/60 border-gray-700 p-4 text-center" data-testid="stat-avg-progress">
                <p className="text-2xl font-bold text-yellow-400">{totalProgress}%</p>
                <p className="text-xs text-gray-400 mt-1">Avg Progress</p>
              </Card>
            </div>

            {certificates.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Earned Certificates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((cert) => {
                    const course = courses.find(c => c.id === cert.courseId);
                    return (
                      <Card key={cert.id} className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-yellow-700/30 p-4 cursor-pointer hover:border-yellow-600/50 transition" data-testid={`cert-card-${cert.id}`} onClick={() => navigate(`/training/${cert.courseId}`)}>
                        <div className="flex items-center gap-3">
                          <Award className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{cert.courseName}</p>
                            <p className="text-xs text-gray-400">Certificate #{cert.certificateNumber}</p>
                            <p className="text-xs text-gray-400">Issued: {new Date(cert.issuedAt!).toLocaleDateString()}</p>
                          </div>
                          <Button variant="outline" size="sm" className="border-yellow-700/50 text-yellow-400 text-xs shrink-0" data-testid={`btn-view-cert-${cert.id}`}>
                            View
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {activeEnrollments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-400" />
                  In Progress
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeEnrollments.map((enrollment) => {
                    const course = courses.find(c => c.id === enrollment.courseId);
                    if (!course) return null;
                    const meta = COURSE_PRODUCT_MAP[course.productId];
                    return (
                      <Card key={enrollment.id} className="bg-gray-800/60 border-gray-700 p-4 hover:border-blue-500/50 transition cursor-pointer" data-testid={`my-course-active-${enrollment.courseId}`} onClick={() => navigate(`/training/${course.id}`)}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{meta?.icon || "📚"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{course.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{course.totalModules} modules</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">{enrollment.progress}%</span>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-500 mt-1 shrink-0" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {completedEnrollments.length > 0 && !certificates.length && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Completed
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedEnrollments.map((enrollment) => {
                    const course = courses.find(c => c.id === enrollment.courseId);
                    if (!course) return null;
                    const meta = COURSE_PRODUCT_MAP[course.productId];
                    return (
                      <Card key={enrollment.id} className="bg-gray-800/60 border-gray-700 p-4 hover:border-green-500/50 transition cursor-pointer" data-testid={`my-course-completed-${enrollment.courseId}`} onClick={() => navigate(`/training/${course.id}`)}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{meta?.icon || "📚"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{course.title}</p>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs mt-1">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                            </Badge>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-500 shrink-0" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-center mt-6">
              <Button variant="outline" className="border-gray-700 text-gray-400" onClick={() => setActiveTab("catalog")} data-testid="btn-browse-more">
                <BookOpen className="w-4 h-4 mr-2" /> Browse More Courses
              </Button>
            </div>
          </div>
        )}

        {effectiveTab === "catalog" && (
          <div data-testid="section-catalog">
            {coursesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : courses.length === 0 ? (
              <Card className="bg-gray-800/60 border-gray-700 p-8 text-center">
                <GraduationCap className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Courses are being prepared. Check back soon!</p>
              </Card>
            ) : (
              <>
                {courses.filter(c => c.category !== "new_hire_safety").length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      Professional Compliance Courses
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.filter(c => c.category !== "new_hire_safety").map((course) => {
                        const product = PRODUCTS[course.productId];
                        const enrollment = getEnrollment(course.id);
                        const certificate = getCertificate(course.id);
                        const meta = COURSE_PRODUCT_MAP[course.productId];

                        return (
                          <Card key={course.id} className="bg-gray-800/60 border-gray-700 p-5 flex flex-col" data-testid={`course-card-${course.id}`}>
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-3xl">{meta?.icon || "📚"}</span>
                              {certificate && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  <Award className="w-3 h-3 mr-1" /> Completed
                                </Badge>
                              )}
                              {enrollment && !certificate && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  {enrollment.progress}% Complete
                                </Badge>
                              )}
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-2">{course.title}</h3>
                            <p className="text-sm text-gray-400 mb-4 flex-1">{course.description}</p>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> {course.totalModules} modules
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> ~{course.estimatedHours}h
                              </span>
                            </div>

                            {product && (
                              <p className="text-xl font-bold text-white mb-2">
                                ${(product.unitAmount / 100).toFixed(0)}
                                <span className="text-sm text-gray-400 font-normal ml-1">per person</span>
                              </p>
                            )}

                            {course.productId === "course-drug-alcohol" && (
                              <div className="mb-3" data-testid={`policy-incentive-${course.id}`}>
                                {certificate ? (
                                  <Link href="/drug-alcohol-policy">
                                    <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-2 border-green-400/60 rounded-lg p-3 cursor-pointer hover:from-green-600/40 hover:to-emerald-600/40 transition-all" data-testid="btn-download-policy">
                                      <div className="flex items-center gap-2">
                                        <Gift className="w-5 h-5 text-green-300 flex-shrink-0" />
                                        <div>
                                          <p className="text-sm font-bold text-green-300">FREE D&A Downloadable Policy</p>
                                          <p className="text-xs text-green-400/80">Click to download your Word document</p>
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                ) : (
                                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-400/60 rounded-lg p-3 animate-pulse-subtle">
                                    <div className="flex items-center gap-2">
                                      <Gift className="w-5 h-5 text-amber-300 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-bold text-amber-300">FREE D&A Downloadable Policy</p>
                                        <p className="text-xs text-amber-400/80">Complete this course to unlock your free policy</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {course.productId === "course-osha-recordkeeping" && (
                              <div className="mb-3" data-testid={`clinic-letter-incentive-${course.id}`}>
                                <Link href="/clinic-letter">
                                  <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-2 border-blue-400/60 rounded-lg p-3 cursor-pointer hover:from-blue-600/40 hover:to-cyan-600/40 transition-all" data-testid="btn-clinic-letter">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-blue-300 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-bold text-blue-300">FREE Clinic Communication Letter</p>
                                        <p className="text-xs text-blue-400/80">Generate injury-specific letters for your clinic</p>
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {enrollment ? (
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/training/${course.id}`)} data-testid={`btn-continue-${course.id}`}>
                                  {certificate ? "Review Course" : "Continue"} <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              ) : (
                                <>
                                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleStartCourse(course)} data-testid={`btn-start-${course.id}`}>
                                    Start Course <Play className="w-4 h-4 ml-1" />
                                  </Button>
                                  {product && (
                                    <Button variant="outline" className="border-gray-600" onClick={() => handleAddToCart(course.productId)} data-testid={`btn-cart-${course.id}`}>
                                      <ShoppingCart className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {courses.filter(c => c.category === "new_hire_safety").length > 0 && (
                  <div className="mb-10" data-testid="section-brandnswag-courses">
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">🎁</span>
                        <h2 className="text-lg font-semibold text-white">BrandNSwag — New Hire Safety Courses</h2>
                      </div>
                      <p className="text-sm text-gray-400 ml-11">Short, OSHA-focused safety courses for onboarding new employees. Under 20 minutes each.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.filter(c => c.category === "new_hire_safety").map((course) => {
                        const enrollment = getEnrollment(course.id);
                        const certificate = getCertificate(course.id);
                        const meta = COURSE_PRODUCT_MAP[course.productId];

                        return (
                          <Card key={course.id} className="bg-gray-800/60 border-gray-700 p-5 flex flex-col" data-testid={`course-card-${course.id}`}>
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-3xl">{meta?.icon || "📚"}</span>
                              {certificate && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  <Award className="w-3 h-3 mr-1" /> Completed
                                </Badge>
                              )}
                              {enrollment && !certificate && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  {enrollment.progress}% Complete
                                </Badge>
                              )}
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-2">{course.title}</h3>
                            <p className="text-sm text-gray-400 mb-4 flex-1">{course.description}</p>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> {course.totalModules} modules
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> ~{course.estimatedHours}h
                              </span>
                            </div>

                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit mb-4">
                              Included with BrandNSwag
                            </Badge>

                            <div className="flex gap-2">
                              {enrollment ? (
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/training/${course.id}`)} data-testid={`btn-continue-${course.id}`}>
                                  {certificate ? "Review Course" : "Continue"} <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              ) : (
                                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleStartCourse(course)} data-testid={`btn-start-${course.id}`}>
                                  Start Course <Play className="w-4 h-4 ml-1" />
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
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
