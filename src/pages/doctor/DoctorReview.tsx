import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Brain,
  User,
  Calendar,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentPanel, AgentBadge } from "@/components/AgentBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppStore } from "@/lib/store";

const mockClinicalSummary = {
  behavioralIndicators: [
    { indicator: "Eye Contact", observation: "Reduced eye contact during social interaction", severity: "moderate" },
    { indicator: "Social Engagement", observation: "Limited response to name being called", severity: "mild" },
    { indicator: "Repetitive Behaviors", observation: "Repetitive hand movements observed", severity: "moderate" },
    { indicator: "Communication", observation: "Delayed verbal responses", severity: "mild" },
  ],
  developmentalMilestones: [
    { milestone: "Joint Attention", status: "delayed", age: "18 months" },
    { milestone: "Pointing to Show", status: "delayed", age: "12 months" },
    { milestone: "Pretend Play", status: "emerging", age: "24 months" },
  ],
  recommendedActions: [
    "Comprehensive developmental evaluation recommended",
    "Speech and language therapy consultation",
    "Occupational therapy assessment",
  ],
};

export default function DoctorReview() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const { children, updateChild } = useAppStore();
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<"confirm" | "observe" | null>(null);

  const child = children.find((c) => c.id === childId);

  if (!child) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Patient not found</p>
          <Button variant="outline" onClick={() => navigate("/doctor")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleDecision = (selectedDecision: "confirm" | "observe") => {
    setDecision(selectedDecision);
    updateChild(child.id, { screeningStatus: "reviewed" });
  };

  return (
    <DashboardLayout>
      <Button variant="ghost" onClick={() => navigate("/doctor")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">Clinical Review</h1>
          <StatusBadge status={child.screeningStatus} />
        </div>
        <p className="text-muted-foreground">
          Review AI-generated summary and provide clinical assessment
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-secondary/30 flex items-center justify-center">
                <User className="h-8 w-8 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{child.name}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {child.age} years old
                  </span>
                  {child.riskLevel && <StatusBadge riskLevel={child.riskLevel} />}
                </div>
              </div>
            </div>
          </div>

          {/* AI Clinical Summary */}
          <AgentPanel type="clinical">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5" />
              <h3 className="font-semibold">AI-Generated Clinical Summary</h3>
            </div>

            {/* Behavioral Indicators */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Behavioral Indicators
              </h4>
              <div className="space-y-3">
                {mockClinicalSummary.behavioralIndicators.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg bg-muted/50 p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{item.indicator}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.severity === "moderate"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.observation}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Developmental Milestones */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Developmental Milestones
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                {mockClinicalSummary.developmentalMilestones.map((item, index) => (
                  <div key={index} className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="font-medium text-sm">{item.milestone}</p>
                    <p
                      className={`text-xs mt-1 ${
                        item.status === "delayed" ? "text-warning" : "text-success"
                      }`}
                    >
                      {item.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                AI Recommended Actions
              </h4>
              <ul className="space-y-2">
                {mockClinicalSummary.recommendedActions.map((action, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-agent-clinical" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </AgentPanel>

          {/* Doctor Decision */}
          <div className="rounded-2xl border-2 border-primary bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Clinical Decision</h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                By Doctor
              </span>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Clinical Notes</label>
              <Textarea
                placeholder="Add your clinical observations and notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant={decision === "confirm" ? "success" : "outline"}
                className="flex-1"
                onClick={() => handleDecision("confirm")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Diagnosis
              </Button>
              <Button
                variant={decision === "observe" ? "warning" : "outline"}
                className="flex-1"
                onClick={() => handleDecision("observe")}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Needs More Observation
              </Button>
            </div>

            {decision && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg bg-success/10 p-4 text-center"
              >
                <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-sm font-medium">
                  Decision recorded. Therapy planning will be initiated.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-semibold mb-4">AI Agents Involved</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <AgentBadge type="screening" size="sm" showLabel={false} />
                <div>
                  <p className="text-sm font-medium">Screening Agent</p>
                  <p className="text-xs text-muted-foreground">Video analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AgentBadge type="clinical" size="sm" showLabel={false} />
                <div>
                  <p className="text-sm font-medium">Clinical Summary Agent</p>
                  <p className="text-xs text-muted-foreground">Summary generation</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
            <AlertCircle className="h-6 w-6 text-accent mb-3" />
            <h4 className="font-medium text-sm mb-2">Important</h4>
            <p className="text-xs text-muted-foreground">
              AI supports decisions, humans remain in control. The final clinical decision
              rests with the healthcare professional.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
