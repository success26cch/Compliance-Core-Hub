import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Loader2,
  Award,
  FileText,
  HelpCircle,
  Lock,
  Trophy,
  RotateCcw,
  Printer,
  Volume2,
  VolumeX,
} from "lucide-react";
import logoUrl from "@assets/1_1770683748423.png";

interface LessonWithProgress {
  id: number;
  moduleId: number;
  title: string;
  content: string;
  orderIndex: number;
  videoUrl: string | null;
  completed: boolean;
}

interface ModuleWithContent {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: LessonWithProgress[];
  quizQuestionCount: number;
  quizPassed: boolean;
  bestScore: number | null;
}

interface CourseData {
  id: number;
  title: string;
  description: string;
  totalModules: number;
  enrollment: {
    id: number;
    progress: number;
    status: string;
  };
  modules: ModuleWithContent[];
}

interface QuizQuestion {
  id: number;
  moduleId: number;
  question: string;
  options: string[];
  orderIndex: number;
}

interface QuizResult {
  questionId: number;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string | null;
}

type ViewMode = "lesson" | "quiz" | "quiz-results" | "certificate";

export default function CourseViewer() {
  const params = useParams<{ id: string }>();
  const courseId = parseInt(params.id || "0");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const trainingToken = searchParams.get("token");
  const hasAccess = isAuthenticated || !!trainingToken;
  const tokenParam = trainingToken ? `?token=${trainingToken}` : "";

  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("lesson");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResults, setQuizResults] = useState<{ results: QuizResult[]; score: number; passed: boolean; correct: number; total: number } | null>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { data: courseData, isLoading } = useQuery<CourseData>({
    queryKey: ["/api/courses", courseId, "learn", trainingToken],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/learn${tokenParam}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
    enabled: hasAccess && courseId > 0,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const body = trainingToken ? { token: trainingToken } : {};
      const res = await apiRequest("POST", `/api/lessons/${lessonId}/complete`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "learn", trainingToken] });
    },
  });

  const activeModuleForQuiz = courseData?.modules[activeModuleIndex];
  const { data: quizQuestions } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/modules", activeModuleForQuiz?.id, "quiz", trainingToken],
    queryFn: async () => {
      if (!activeModuleForQuiz) return [];
      const res = await fetch(`/api/modules/${activeModuleForQuiz.id}/quiz${tokenParam}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: viewMode === "quiz" && !!activeModuleForQuiz,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async ({ moduleId, answers }: { moduleId: number; answers: number[] }) => {
      const body: any = { answers };
      if (trainingToken) body.token = trainingToken;
      const res = await apiRequest("POST", `/api/modules/${moduleId}/quiz`, body);
      return res.json();
    },
    onSuccess: (data) => {
      setQuizResults(data);
      setViewMode("quiz-results");
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "learn", trainingToken] });
      if (data.passed) {
        toast({ title: "Quiz Passed!", description: `You scored ${data.score}%` });
      }
    },
  });

  const completeCurseMutation = useMutation({
    mutationFn: async () => {
      const body = trainingToken ? { token: trainingToken } : {};
      const res = await apiRequest("POST", `/api/courses/${courseId}/complete`, body);
      return res.json();
    },
    onSuccess: (data) => {
      setCertificate(data);
      setViewMode("certificate");
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
    },
  });

  const activeModule = courseData?.modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];
  const allModulesQuizzesPassed = courseData?.modules.every(m => m.quizQuestionCount === 0 || m.quizPassed) ?? false;

  useEffect(() => {
    if (courseData?.modules) {
      for (let mi = 0; mi < courseData.modules.length; mi++) {
        const mod = courseData.modules[mi];
        for (let li = 0; li < mod.lessons.length; li++) {
          if (!mod.lessons[li].completed) {
            setActiveModuleIndex(mi);
            setActiveLessonIndex(li);
            return;
          }
        }
      }
    }
  }, [courseData?.modules?.length]);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [activeModuleIndex, activeLessonIndex]);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <Card className="bg-gray-800/60 border-gray-700 p-8 text-center">
          <Lock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">You need to be enrolled to access this course.</p>
          <Link href="/training">
            <Button data-testid="btn-back-training">Back to Training</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!activeLesson) return;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = activeLesson.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    if (!textContent.trim()) return;

    const chunks: string[] = [];
    const sentences = textContent.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [textContent];
    let currentChunk = "";
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 180) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    let chunkIndex = 0;
    const speakNext = () => {
      if (chunkIndex >= chunks.length) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => { chunkIndex++; speakNext(); };
      utterance.onerror = () => { setIsSpeaking(false); };
      window.speechSynthesis.speak(utterance);
    };

    setIsSpeaking(true);
    speakNext();
  };

  const handleMarkComplete = () => {
    if (activeLesson) {
      markCompleteMutation.mutate(activeLesson.id);
    }
  };

  const handleNextLesson = () => {
    if (!activeModule) return;
    if (activeLessonIndex < activeModule.lessons.length - 1) {
      setActiveLessonIndex(activeLessonIndex + 1);
      setViewMode("lesson");
      window.scrollTo(0, 0);
    } else if (activeModule.quizQuestionCount > 0 && !activeModule.quizPassed) {
      setQuizAnswers([]);
      setQuizResults(null);
      setViewMode("quiz");
    } else if (activeModuleIndex < courseData.modules.length - 1) {
      setActiveModuleIndex(activeModuleIndex + 1);
      setActiveLessonIndex(0);
      setViewMode("lesson");
      window.scrollTo(0, 0);
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonIndex(activeLessonIndex - 1);
      setViewMode("lesson");
    } else if (activeModuleIndex > 0) {
      const prevModule = courseData.modules[activeModuleIndex - 1];
      setActiveModuleIndex(activeModuleIndex - 1);
      setActiveLessonIndex(prevModule.lessons.length - 1);
      setViewMode("lesson");
    }
  };

  const handleSubmitQuiz = () => {
    if (!activeModule) return;
    submitQuizMutation.mutate({ moduleId: activeModule.id, answers: quizAnswers });
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers([]);
    setQuizResults(null);
    setViewMode("quiz");
    queryClient.invalidateQueries({ queryKey: ["/api/modules", activeModule?.id, "quiz"] });
  };

  const handleCompleteCourse = () => {
    completeCurseMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 bg-gray-900 border-r border-gray-800 overflow-hidden flex-shrink-0`}>
        <div className="w-80 h-screen overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/training">
                <button className="text-gray-400 hover:text-white" data-testid="link-back-training">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/">
                <img src={logoUrl} alt="CCH" className="w-6 h-6 rounded cursor-pointer hover:opacity-80 transition" data-testid="logo-home-link" />
              </Link>
              <span className="text-sm font-medium text-gray-300 truncate">{courseData.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${courseData.enrollment.progress}%` }} />
              </div>
              <span className="text-xs text-gray-400">{courseData.enrollment.progress}%</span>
            </div>
          </div>

          <nav className="p-2">
            {courseData.modules.map((mod, mi) => (
              <div key={mod.id} className="mb-1">
                <button
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${mi === activeModuleIndex ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}
                  onClick={() => { setActiveModuleIndex(mi); setActiveLessonIndex(0); setViewMode("lesson"); }}
                  data-testid={`sidebar-module-${mi}`}
                >
                  <div className="flex items-center gap-2">
                    {mod.quizPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{mod.title}</span>
                  </div>
                </button>

                {mi === activeModuleIndex && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {mod.lessons.map((lesson, li) => (
                      <button
                        key={lesson.id}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition flex items-center gap-2 ${li === activeLessonIndex && viewMode === "lesson" ? "bg-blue-900/40 text-blue-300" : "text-gray-500 hover:text-gray-300"}`}
                        onClick={() => { setActiveLessonIndex(li); setViewMode("lesson"); }}
                        data-testid={`sidebar-lesson-${mi}-${li}`}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    ))}
                    {mod.quizQuestionCount > 0 && (
                      <button
                        className={`w-full text-left px-3 py-1.5 rounded text-xs transition flex items-center gap-2 ${viewMode === "quiz" || viewMode === "quiz-results" ? "bg-purple-900/40 text-purple-300" : "text-gray-500 hover:text-gray-300"}`}
                        onClick={() => { setQuizAnswers([]); setQuizResults(null); setViewMode("quiz"); }}
                        data-testid={`sidebar-quiz-${mi}`}
                      >
                        {mod.quizPassed ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                        ) : (
                          <HelpCircle className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span>Module Quiz {mod.bestScore !== null ? `(${mod.bestScore}%)` : ""}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {allModulesQuizzesPassed && (
              <div className="mt-4 p-3">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700" onClick={handleCompleteCourse} disabled={completeCurseMutation.isPending} data-testid="btn-complete-course">
                  {completeCurseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
                  Earn Certificate
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-2 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white shrink-0" data-testid="btn-toggle-sidebar">
              <FileText className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400 truncate">
              {activeModule?.title} {activeLesson && viewMode === "lesson" ? `› ${activeLesson.title}` : viewMode === "quiz" ? "› Module Quiz" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4" data-testid="header-brand">
            <img src={logoUrl} alt="CCH" className="w-6 h-6 rounded" />
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">Core Compliance Hub</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* LESSON VIEW */}
          {viewMode === "lesson" && activeLesson && (
            <div className="relative">
              <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none" data-testid="watermark-logo">
                <img src={logoUrl} alt="" className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold" data-testid="text-lesson-title">{activeLesson.title}</h1>
                <button
                  onClick={handleToggleSpeech}
                  className={`p-2 rounded-full transition shrink-0 ${isSpeaking ? "bg-blue-600 text-white animate-pulse" : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"}`}
                  title={isSpeaking ? "Stop reading" : "Read lesson aloud"}
                  data-testid="btn-text-to-speech"
                >
                  {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              <div
                className="prose prose-invert prose-sm max-w-none
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-200 [&_h3]:mt-5 [&_h3]:mb-2
                  [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-gray-300 [&_h4]:mt-4 [&_h4]:mb-2
                  [&_p]:text-gray-300 [&_p]:leading-relaxed [&_p]:mb-3
                  [&_ul]:space-y-1.5 [&_li]:text-gray-300
                  [&_ol]:space-y-1.5 [&_ol_li]:text-gray-300
                  [&_strong]:text-white
                  [&_a]:text-blue-400 [&_a]:underline
                  [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
                  [&_th]:bg-gray-800 [&_th]:border [&_th]:border-gray-700 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:text-white
                  [&_td]:border [&_td]:border-gray-700 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-gray-300
                  [&_.highlight-box]:bg-blue-900/20 [&_.highlight-box]:border [&_.highlight-box]:border-blue-700/30 [&_.highlight-box]:rounded-lg [&_.highlight-box]:p-4 [&_.highlight-box]:my-4
                  [&_.warning-box]:bg-amber-900/20 [&_.warning-box]:border-amber-700/30
                  [&_.checklist-table_td]:align-top
                "
                dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                data-testid="lesson-content"
              />

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
                <Button variant="outline" className="border-gray-700" onClick={handlePrevLesson} disabled={activeModuleIndex === 0 && activeLessonIndex === 0} data-testid="btn-prev">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>

                <div className="flex gap-3">
                  {!activeLesson.completed && (
                    <Button variant="outline" className="border-green-700 text-green-400 hover:bg-green-900/30" onClick={handleMarkComplete} disabled={markCompleteMutation.isPending} data-testid="btn-mark-complete">
                      {markCompleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Mark Complete
                    </Button>
                  )}

                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNextLesson} data-testid="btn-next">
                    {activeLessonIndex === (activeModule?.lessons.length || 0) - 1 && activeModule?.quizQuestionCount ? "Take Quiz" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-800/50" data-testid="lesson-footer-brand">
                <img src={logoUrl} alt="CCH" className="w-4 h-4 rounded opacity-60" />
                <span className="text-[11px] text-white font-bold tracking-widest">CCH PROPRIETARY TRAINING MATERIAL</span>
              </div>
            </div>
          )}

          {/* QUIZ VIEW */}
          {viewMode === "quiz" && quizQuestions && (
            <div className="relative">
              <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none">
                <img src={logoUrl} alt="" className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-purple-400" />
                <h1 className="text-2xl font-bold" data-testid="text-quiz-title">{activeModule?.title} — Quiz</h1>
              </div>

              <p className="text-gray-400 text-sm mb-6">Answer all questions and score 70% or higher to pass. You can retake the quiz as many times as needed.</p>

              <div className="space-y-6">
                {quizQuestions.map((q, qi) => (
                  <Card key={q.id} className="bg-gray-800/60 border-gray-700 p-5" data-testid={`quiz-question-${qi}`}>
                    <p className="font-medium text-white mb-3">
                      <span className="text-blue-400 mr-2">{qi + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          className={`w-full text-left px-4 py-2.5 rounded border transition text-sm ${quizAnswers[qi] === oi ? "bg-blue-900/40 border-blue-500 text-white" : "bg-gray-900/40 border-gray-700 text-gray-300 hover:border-gray-500"}`}
                          onClick={() => {
                            const newAnswers = [...quizAnswers];
                            newAnswers[qi] = oi;
                            setQuizAnswers(newAnswers);
                          }}
                          data-testid={`quiz-option-${qi}-${oi}`}
                        >
                          <span className="font-medium text-gray-500 mr-2">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <Button className="bg-purple-600 hover:bg-purple-700 px-8" onClick={handleSubmitQuiz} disabled={quizAnswers.length < (quizQuestions?.length || 0) || submitQuizMutation.isPending} data-testid="btn-submit-quiz">
                  {submitQuizMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit Quiz
                </Button>
              </div>
            </div>
          )}

          {/* QUIZ RESULTS VIEW */}
          {viewMode === "quiz-results" && quizResults && (
            <div>
              <Card className={`p-6 mb-6 ${quizResults.passed ? "bg-green-900/20 border-green-700/40" : "bg-red-900/20 border-red-700/40"}`}>
                <div className="flex items-center gap-4">
                  {quizResults.passed ? (
                    <Trophy className="w-10 h-10 text-green-400" />
                  ) : (
                    <RotateCcw className="w-10 h-10 text-red-400" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white" data-testid="text-quiz-score">
                      {quizResults.passed ? "Quiz Passed!" : "Not Quite — Try Again"}
                    </h2>
                    <p className="text-gray-300">
                      Score: <strong>{quizResults.score}%</strong> ({quizResults.correct}/{quizResults.total} correct) — 70% needed to pass
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                {quizResults.results.map((r, i) => (
                  <Card key={r.questionId} className={`p-4 ${r.isCorrect ? "bg-green-900/10 border-green-800/30" : "bg-red-900/10 border-red-800/30"}`} data-testid={`result-${i}`}>
                    <div className="flex items-start gap-2">
                      {r.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm text-gray-300 mb-1">Question {i + 1}</p>
                        {!r.isCorrect && r.explanation && (
                          <p className="text-xs text-gray-400 mt-1">{r.explanation}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                {!quizResults.passed && (
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleRetakeQuiz} data-testid="btn-retake-quiz">
                    <RotateCcw className="w-4 h-4 mr-2" /> Retake Quiz
                  </Button>
                )}
                {quizResults.passed && activeModuleIndex < courseData.modules.length - 1 && (
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setActiveModuleIndex(activeModuleIndex + 1); setActiveLessonIndex(0); setViewMode("lesson"); window.scrollTo(0, 0); }} data-testid="btn-next-module">
                    Next Module <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                {quizResults.passed && allModulesQuizzesPassed && (
                  <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleCompleteCourse} disabled={completeCurseMutation.isPending} data-testid="btn-earn-cert">
                    <Trophy className="w-4 h-4 mr-2" /> Earn Certificate
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* CERTIFICATE VIEW */}
          {viewMode === "certificate" && certificate && (
            <div className="flex justify-center py-8">
              <div className="w-full max-w-3xl" data-testid="certificate-display">
                <div className="bg-gradient-to-br from-[#0a0f1a] via-[#0d1321] to-[#0a0f1a] rounded-lg p-3 shadow-2xl">
                  <div className="border-2 border-yellow-600/60 rounded-lg p-2">
                    <div className="border border-yellow-700/30 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(212,175,55,0.15) 35px, rgba(212,175,55,0.15) 36px),
                          repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(212,175,55,0.15) 35px, rgba(212,175,55,0.15) 36px)`
                      }} />

                      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-yellow-600/40 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-yellow-600/40 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-yellow-600/40 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-yellow-600/40 rounded-br-lg" />

                      <div className="relative z-10 px-8 py-10 md:px-16 md:py-14 text-center">
                        <div className="flex items-center justify-center gap-4 mb-6">
                          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-yellow-600/60" />
                          <img src={logoUrl} alt="CCH" className="w-20 h-20 rounded-lg shadow-lg shadow-yellow-900/20" />
                          <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-yellow-600/60" />
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-1">CORE COMPLIANCE HUB</h2>
                        <p className="text-xs text-gray-500 tracking-[0.3em] uppercase mb-6">Professional Development & Compliance Training</p>

                        <div className="flex items-center justify-center gap-3 mb-6">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent" />
                          <Award className="w-6 h-6 text-yellow-500" />
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent" />
                        </div>

                        <p className="text-yellow-500 text-lg md:text-xl font-semibold tracking-[0.2em] uppercase mb-8">Certificate of Completion</p>

                        <p className="text-gray-400 text-sm mb-2">This is to certify that</p>
                        <p className="text-3xl md:text-4xl font-bold text-white mb-1" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                          {certificate.userName}
                        </p>
                        <div className="w-64 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto mb-6" />

                        <p className="text-gray-400 text-sm mb-2">has successfully completed all requirements for</p>
                        <p className="text-xl md:text-2xl font-semibold text-blue-400 mb-2">{certificate.courseName}</p>
                        <p className="text-xs text-gray-500 mb-8">including all module assessments with a passing score of 70% or higher</p>

                        <div className="flex items-center justify-center gap-3 mb-8">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent" />
                          <div className="w-2 h-2 rounded-full bg-yellow-600/40" />
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent" />
                        </div>

                        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-8">
                          <div className="text-center">
                            <div className="w-32 h-px bg-gray-600 mx-auto mb-2" />
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Date Issued</p>
                            <p className="text-xs text-white mt-1 font-medium">
                              {new Date(certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                          <div className="text-center flex flex-col items-center justify-end">
                            <div className="w-12 h-12 rounded-full border-2 border-yellow-600/40 flex items-center justify-center mb-1">
                              <img src={logoUrl} alt="CCH Seal" className="w-8 h-8 rounded-full" />
                            </div>
                            <p className="text-[9px] text-yellow-600/60 uppercase tracking-wider">Official Seal</p>
                          </div>
                          <div className="text-center">
                            <div className="w-32 h-px bg-gray-600 mx-auto mb-2" />
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Authorized By</p>
                            <p className="text-xs text-white mt-1 font-medium">CCH Training Division</p>
                          </div>
                        </div>

                        <div className="bg-gray-800/40 rounded-lg px-4 py-3 inline-block">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Certificate Number</p>
                          <p className="text-sm text-white font-mono tracking-wider">{certificate.certificateNumber}</p>
                        </div>

                        <p className="text-[10px] text-gray-600 mt-4">
                          Verify this certificate at {window.location.origin}/api/certificates/verify/{certificate.certificateNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3 mt-6">
                  <Button variant="outline" className="border-gray-700" onClick={() => window.print()} data-testid="btn-print-cert">
                    <Printer className="w-4 h-4 mr-2" /> Print Certificate
                  </Button>
                  <Link href="/training">
                    <Button className="bg-blue-600 hover:bg-blue-700" data-testid="btn-back-courses">
                      Back to Courses
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
