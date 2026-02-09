import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  ClipboardCheck,
  Calendar,
  User,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Child, Report } from "@/lib/store";
import { childrenService, reportsService } from "@/services/data";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Reports() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const loadChildren = async () => {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await childrenService.getChildren();
      if (error) {
        setLoadError(error.message || "Failed to load children");
        setLoading(false);
        return;
      }

      const normalized = (data || []).map((child: any) => ({
        id: child.id,
        name: child.name,
        dateOfBirth: child.date_of_birth,
        age: 0,
        gender: child.gender,
        screeningStatus: child.screening_status,
        riskLevel: child.risk_level,
        assignedDoctorId: child.assigned_doctor_id,
        assignedTherapistId: child.assigned_therapist_id,
        observationEndDate: child.observation_end_date,
      }));

      setChildren(normalized);
      if (normalized.length > 0) {
        setSelectedChild((current) => current || normalized[0].id);
      }
      setLoading(false);
    };

    loadChildren();
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      if (!selectedChild) return;
      const { data, error } = await reportsService.getReports(selectedChild);
      if (error) {
        setLoadError(error.message || "Failed to load reports");
        return;
      }

      const mappedReports = (data || []).map((report: any) => ({
        id: report.id,
        childId: report.child_id,
        type: report.type,
        createdAt: new Date(report.created_at),
        doctorNotes: report.content?.doctorNotes || "",
        screeningSummary: report.content?.screeningSummary || "",
        monitoringPlan: report.content?.monitoringPlan,
        followUpDate: report.content?.followUpDate,
        diagnosisConfirmation: report.content?.diagnosisConfirmation,
        developmentalGaps: report.content?.developmentalGaps,
        therapyRecommendations: report.content?.therapyRecommendations,
      }));

      setReports(mappedReports);
    };

    loadReports();
  }, [selectedChild]);

  const childReports = reports.filter((r) => r.childId === selectedChild);
  const child = children.find((c) => c.id === selectedChild);

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-2">
          View observation and diagnostic reports for your children
        </p>
      </div>

      {/* Child Selection */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Select Child</label>
        <Select value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select a child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                {child.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadError && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading reports...
        </div>
      )}

      {/* Report Type Legend */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-agent-monitoring/10 px-4 py-2">
          <Eye className="h-4 w-4 text-agent-monitoring" />
          <span className="text-sm font-medium">Observation Report</span>
          <span className="text-xs text-muted-foreground">• Visible to Parent & Doctor</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2">
          <ClipboardCheck className="h-4 w-4 text-success" />
          <span className="text-sm font-medium">Diagnostic Report</span>
          <span className="text-xs text-muted-foreground">• Visible to Parent, Doctor & Therapist</span>
        </div>
      </div>

      {/* Reports List */}
      {!loading && childReports.length > 0 ? (
        <div className="space-y-4">
          {childReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl border bg-card p-6 shadow-card cursor-pointer transition-all hover:shadow-elevated ${
                report.type === "observation"
                  ? "border-agent-monitoring/30 hover:border-agent-monitoring"
                  : "border-success/30 hover:border-success"
              }`}
              onClick={() => handleViewReport(report)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      report.type === "observation"
                        ? "bg-agent-monitoring/10"
                        : "bg-success/10"
                    }`}
                  >
                    {report.type === "observation" ? (
                      <Eye className="h-6 w-6 text-agent-monitoring" />
                    ) : (
                      <ClipboardCheck className="h-6 w-6 text-success" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {report.type === "observation"
                          ? "Observation Report"
                          : "Diagnostic Report"}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          report.type === "observation"
                            ? "bg-agent-monitoring/10 text-agent-monitoring"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {report.type === "observation" ? "Monitoring" : "Complete"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(report.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {child?.name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {report.screeningSummary}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : !loading ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Reports Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Reports will appear here after your child completes screening and receives
            clinical review from a doctor.
          </p>
        </div>
      ) : null}

      {/* Report Detail Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedReport.type === "observation" ? (
                    <>
                      <Eye className="h-5 w-5 text-agent-monitoring" />
                      Observation Report
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-5 w-5 text-success" />
                      Diagnostic Report
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Generated on {format(new Date(selectedReport.createdAt), "MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Screening Summary */}
                <div className="rounded-xl bg-muted/50 p-4">
                  <h4 className="font-medium text-sm mb-2">Screening Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.screeningSummary}
                  </p>
                </div>

                {/* Doctor Notes */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Clinical Notes</h4>
                  <p className="text-sm text-muted-foreground border border-border rounded-lg p-4">
                    {selectedReport.doctorNotes || "No additional notes provided."}
                  </p>
                </div>

                {/* Observation-specific content */}
                {selectedReport.type === "observation" && (
                  <>
                    <div className="rounded-xl bg-agent-monitoring/5 border border-agent-monitoring/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-agent-monitoring" />
                        <h4 className="font-medium text-sm">Monitoring Plan</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedReport.monitoringPlan || "Continue regular monitoring."}
                      </p>
                      {selectedReport.followUpDate && (
                        <p className="text-sm mt-2">
                          <strong>Follow-up Date:</strong>{" "}
                          {format(new Date(selectedReport.followUpDate), "MMMM d, yyyy")}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl bg-warning/5 border border-warning/20 p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <p className="text-sm">
                          <strong>Status:</strong> Monitoring in progress – no diagnosis yet.
                          Therapist access is not enabled for observation reports.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Diagnostic-specific content */}
                {selectedReport.type === "diagnostic" && (
                  <>
                    <div className="rounded-xl bg-success/5 border border-success/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <h4 className="font-medium text-sm">Diagnosis Confirmation</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedReport.diagnosisConfirmation}
                      </p>
                    </div>

                    {selectedReport.developmentalGaps && selectedReport.developmentalGaps.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Developmental Gaps Identified</h4>
                        <ul className="space-y-2">
                          {selectedReport.developmentalGaps.map((gap, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <div className="h-2 w-2 rounded-full bg-warning" />
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReport.therapyRecommendations && selectedReport.therapyRecommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Therapy Recommendations</h4>
                        <ul className="space-y-2">
                          {selectedReport.therapyRecommendations.map((rec, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                      <p className="text-sm">
                        <strong>Visibility:</strong> This report has been shared with your assigned
                        doctor and therapist to coordinate care.
                      </p>
                    </div>
                  </>
                )}

                {/* Disclaimer */}
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    This report is for informational purposes. AI supports decisions,
                    clinicians make final assessments.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
