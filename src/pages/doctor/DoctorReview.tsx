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
  Eye,
  ClipboardCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgentPanel, AgentBadge } from "@/components/AgentBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addMonths, format } from "date-fns";

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

type DecisionType = "observation" | "diagnosis" | null;
type FlowStep = "decision" | "observation-report" | "diagnosis-confirm" | "diagnosis-report" | "complete";

export default function DoctorReview() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const { children, updateChild, addReport } = useAppStore();
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<DecisionType>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>("decision");
  const [followUpMonths, setFollowUpMonths] = useState("3");
  const [monitoringPlan, setMonitoringPlan] = useState("Continue developmental monitoring with weekly check-ins. Upload follow-up video after the observation period.");
  const [showReportDialog, setShowReportDialog] = useState(false);

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

  const handleSelectObservation = () => {
    setDecision("observation");
    setFlowStep("observation-report");
  };

  const handleSelectDiagnosis = () => {
    setDecision("diagnosis");
    setFlowStep("diagnosis-confirm");
  };

  const handleGenerateObservationReport = () => {
    const followUpDate = addMonths(new Date(), parseInt(followUpMonths));
    
    const report = {
      id: `obs-${Date.now()}`,
      childId: child.id,
      type: "observation" as const,
      createdAt: new Date(),
      doctorNotes: notes,
      screeningSummary: "Screening completed. Further observation recommended.",
      monitoringPlan,
      followUpDate: followUpDate.toISOString(),
    };

    addReport(report);
    updateChild(child.id, {
      screeningStatus: "under-observation",
      observationEndDate: followUpDate.toISOString(),
      assignedTherapistId: undefined, // Remove therapist assignment
    });
    
    setFlowStep("complete");
  };

  const handleGenerateDiagnosticReport = () => {
    setShowReportDialog(true);
  };

  const confirmDiagnosticReport = () => {
    const report = {
      id: `diag-${Date.now()}`,
      childId: child.id,
      type: "diagnostic" as const,
      createdAt: new Date(),
      doctorNotes: notes,
      screeningSummary: "Comprehensive screening and clinical review completed.",
      diagnosisConfirmation: "Developmental concerns confirmed based on clinical assessment.",
      developmentalGaps: ["Social communication", "Behavioral patterns", "Motor coordination"],
      therapyRecommendations: [
        "Speech therapy 2x weekly",
        "Occupational therapy 1x weekly",
        "Social skills group sessions",
      ],
    };

    addReport(report);
    updateChild(child.id, {
      screeningStatus: "diagnosed",
      assignedTherapistId: "ther1",
    });
    
    setShowReportDialog(false);
    setFlowStep("complete");
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
          {flowStep === "decision" && (
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
                  variant="outline"
                  className="flex-1 border-agent-monitoring text-agent-monitoring hover:bg-agent-monitoring/10"
                  onClick={handleSelectObservation}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Under Observation
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-success text-success hover:bg-success/10"
                  onClick={handleSelectDiagnosis}
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Diagnosis Complete
                </Button>
              </div>
            </div>
          )}

          {/* Observation Report Form */}
          {flowStep === "observation-report" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-agent-monitoring bg-card p-6 shadow-card"
            >
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-agent-monitoring" />
                <h3 className="font-semibold">Generate Observation Report</h3>
              </div>

              <div className="bg-agent-monitoring/10 rounded-lg p-4 mb-6">
                <p className="text-sm">
                  <strong>Note:</strong> This will place the child under observation. 
                  Therapy planning will <strong>NOT</strong> be initiated. 
                  The parent will be notified to continue monitoring and upload follow-up videos.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Follow-up Period</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={followUpMonths}
                      onChange={(e) => setFollowUpMonths(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">months</span>
                  </div>
                </div>

                <div>
                  <Label>Monitoring Plan</Label>
                  <Textarea
                    value={monitoringPlan}
                    onChange={(e) => setMonitoringPlan(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setFlowStep("decision")}>
                    Back
                  </Button>
                  <Button
                    className="bg-agent-monitoring hover:bg-agent-monitoring/90"
                    onClick={handleGenerateObservationReport}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Observation Report
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Diagnosis Confirmation */}
          {flowStep === "diagnosis-confirm" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-success bg-card p-6 shadow-card"
            >
              <div className="flex items-center gap-2 mb-4">
                <ClipboardCheck className="h-5 w-5 text-success" />
                <h3 className="font-semibold">Confirm Diagnosis</h3>
              </div>

              <div className="bg-success/10 rounded-lg p-4 mb-6">
                <p className="text-sm">
                  <strong>Important:</strong> Confirming diagnosis will:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Generate a comprehensive Diagnostic Report</li>
                  <li>• Share the report with the assigned Therapist</li>
                  <li>• Initiate Therapy Planning</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setFlowStep("decision")}>
                  Back
                </Button>
                <Button variant="success" onClick={handleGenerateDiagnosticReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Diagnostic Report
                </Button>
              </div>
            </motion.div>
          )}

          {/* Completion State */}
          {flowStep === "complete" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-8 text-center ${
                decision === "observation"
                  ? "bg-agent-monitoring/10 border-2 border-agent-monitoring"
                  : "bg-success/10 border-2 border-success"
              }`}
            >
              {decision === "observation" ? (
                <>
                  <Eye className="h-12 w-12 text-agent-monitoring mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Observation Report Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Child is kept under observation. The parent has been notified to continue 
                    monitoring and upload follow-up videos after the recommended period.
                  </p>
                  <div className="bg-card rounded-lg p-4 text-left max-w-md mx-auto">
                    <p className="text-sm font-medium mb-1">Status: Monitoring in progress – no diagnosis yet</p>
                    <p className="text-xs text-muted-foreground">
                      Therapist will NOT be notified at this stage.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Diagnostic Report Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Diagnostic report has been generated and shared with the therapist.
                    Therapy planning has been initiated.
                  </p>
                  <div className="bg-card rounded-lg p-4 text-left max-w-md mx-auto">
                    <p className="text-sm font-medium mb-1">Status: Diagnosis Complete</p>
                    <p className="text-xs text-muted-foreground">
                      Therapist has been notified and can now create therapy sessions.
                    </p>
                  </div>
                </>
              )}

              <Button variant="outline" onClick={() => navigate("/doctor")} className="mt-6">
                Return to Dashboard
              </Button>
            </motion.div>
          )}
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

      {/* Diagnostic Report Confirmation Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Diagnostic Report?</DialogTitle>
            <DialogDescription>
              This action will generate a comprehensive diagnostic report and share it with:
              <ul className="mt-2 space-y-1 text-left">
                <li>• The child's parent</li>
                <li>• The assigned therapist</li>
              </ul>
              <p className="mt-2 font-medium text-foreground">
                Therapy planning will be initiated automatically.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={confirmDiagnosticReport}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm & Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
