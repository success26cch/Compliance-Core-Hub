import { useState } from "react";
import { ProtectedLayout } from "@/components/Layout";
import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, ArrowRight, RotateCcw, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

// Simple decision tree logic
const TREE_DATA = [
  {
    id: "start",
    question: "Did the employee experience an injury or illness?",
    yes: "work_related",
    no: "not_recordable",
    citation: "OSHA 1904.7(a)"
  },
  {
    id: "work_related",
    question: "Is the injury or illness work-related?",
    yes: "new_case",
    no: "not_recordable",
    citation: "OSHA 1904.5"
  },
  {
    id: "new_case",
    question: "Is this a new case?",
    yes: "severity",
    no: "update_prev",
    citation: "OSHA 1904.6"
  },
  {
    id: "severity",
    question: "Did it result in: Death, Days away, Restricted work, Transfer, Treatment beyond first aid, Loss of consciousness, or Diagnosis by physician?",
    yes: "recordable",
    no: "not_recordable",
    citation: "OSHA 1904.7(b)"
  }
];

export default function DecisionTree() {
  const { data: subStatus, isLoading } = useSubscriptionStatus();
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [history, setHistory] = useState<string[]>([]);

  // Find current node
  const currentNode = TREE_DATA.find(n => n.id === currentNodeId);

  // Handle Answer
  const handleAnswer = (nextId: string) => {
    setHistory([...history, currentNodeId]);
    setCurrentNodeId(nextId);
  };

  const reset = () => {
    setCurrentNodeId("start");
    setHistory([]);
  };

  if (isLoading) return null;

  // Gated Content for Non-Pro Users
  if (!subStatus?.isPro) {
    return (
      <ProtectedLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-border/50">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-primary mb-4">Pro Feature Locked</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              The Interactive Recordability Decision Tree is available exclusively for Pro subscribers. 
              Ensure compliance with accurate, guided assessments.
            </p>
            <Link href="/settings">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white w-full sm:w-auto">
                Upgrade to Access
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  // Result Screens
  if (currentNodeId === "recordable") {
    return (
      <ProtectedLayout>
        <ResultCard 
          title="OSHA Recordable"
          description="This case meets the general recording criteria under OSHA 1904.7."
          type="recordable"
          onReset={reset}
        />
      </ProtectedLayout>
    );
  }

  if (currentNodeId === "not_recordable") {
    return (
      <ProtectedLayout>
        <ResultCard 
          title="Not Recordable"
          description="Based on your answers, this case does not need to be recorded on the OSHA 300 Log."
          type="not_recordable"
          onReset={reset}
        />
      </ProtectedLayout>
    );
  }

  if (currentNodeId === "update_prev") {
    return (
      <ProtectedLayout>
        <ResultCard 
          title="Update Previous Case"
          description="Update the entry for the previous injury or illness if necessary."
          type="info"
          onReset={reset}
        />
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNodeId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-2xl font-display text-primary leading-tight">
                  {currentNode?.question}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-2">
                  Ref: {currentNode?.citation}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <Button 
                    onClick={() => handleAnswer(currentNode?.yes!)} 
                    className="h-14 text-lg justify-between px-6"
                  >
                    Yes
                    <ArrowRight className="w-5 h-5 opacity-50" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleAnswer(currentNode?.no!)} 
                    className="h-14 text-lg justify-between px-6"
                  >
                    No
                    <ArrowRight className="w-5 h-5 opacity-50" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                  <RotateCcw className="w-4 h-4 mr-2" /> Restart
                </Button>
                <span className="text-xs text-muted-foreground">Step {history.length + 1}</span>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </ProtectedLayout>
  );
}

function ResultCard({ title, description, type, onReset }: any) {
  const isRecordable = type === 'recordable';
  const colorClass = isRecordable ? 'text-accent' : 'text-green-600';
  const Icon = isRecordable ? AlertCircle : CheckCircle;

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card className={`shadow-xl text-center p-8 border-t-4 ${isRecordable ? 'border-t-accent' : 'border-t-green-600'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isRecordable ? 'bg-accent/10' : 'bg-green-100'}`}>
          <Icon className={`w-10 h-10 ${colorClass}`} />
        </div>
        <h2 className={`text-3xl font-bold mb-4 ${colorClass}`}>{title}</h2>
        <p className="text-xl text-muted-foreground mb-8">{description}</p>
        <Button onClick={onReset} size="lg" className="w-full sm:w-auto">
          Start New Assessment
        </Button>
      </Card>
    </div>
  );
}
