import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  MessageSquare,
  Bot,
  FileText,
  Activity,
  Target,
  Lightbulb,
} from "lucide-react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AgentPanel, AgentBadge } from "@/components/AgentBadge";
import { Child, Report, TherapySession, useAppStore } from "@/lib/store";
import { childrenService, reportsService, screeningService, therapySessionsService } from "@/services/data";
import { agentsService, MonitoringInferenceResponse } from "@/services/agents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const riskScoreMap: Record<string, number> = {
  low: 25,
  medium: 50,
  high: 75,
};

const chartConfig = {
  screenings: {
    label: "Screenings",
    color: "hsl(var(--primary))",
  },
  reviews: {
    label: "Doctor reviews",
    color: "hsl(var(--secondary))",
  },
  sessions: {
    label: "Therapy sessions",
    color: "hsl(var(--accent))",
  },
} as const;

const generateMilestones = (childId: string, reports: Report[], sessions: TherapySession[]) => {
  const childReports = reports.filter((report) => report.childId === childId);
  const childSessions = sessions.filter((session) => session.childId === childId && session.status === "completed");

  return [
    ...childReports.map((report) => ({
      type: "report" as const,
      date: new Date(report.createdAt),
      label: report.type === "diagnostic" ? "Diagnostic Report" : "Observation Report",
      color: report.type === "diagnostic" ? "success" : "agent-monitoring",
    })),
    ...childSessions.map((session) => ({
      type: "session" as const,
      date: new Date(session.createdAt),
      label: `${session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session`,
      color: "primary",
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
};

export default function Progress() {
  const [searchParams] = useSearchParams();
  const { selectedChildId, setSelectedChildId, currentUser } = useAppStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [therapySessions, setTherapySessions] = useState<TherapySession[]>([]);
  const [screeningResults, setScreeningResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [monitoringInference, setMonitoringInference] = useState<MonitoringInferenceResponse | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);

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
      setLoading(false);
    };

    loadChildren();
  }, []);

  useEffect(() => {
    const paramChildId = searchParams.get("childId");
    if (paramChildId && paramChildId !== selectedChildId) {
      setSelectedChildId(paramChildId);
    }
  }, [searchParams, selectedChildId, setSelectedChildId]);

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId, setSelectedChildId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshTick((tick) => tick + 1);
    }, 15000);

    const handleWindowFocus = () => setRefreshTick((tick) => tick + 1);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setRefreshTick((tick) => tick + 1);
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const loadChildData = async () => {
      if (!selectedChildId) return;

      const [reportsResponse, sessionsResponse, screeningResponse] = await Promise.all([
        reportsService.getReports(selectedChildId),
        therapySessionsService.getSessionsForChild(selectedChildId),
        screeningService.getResultsForChild(selectedChildId),
      ]);

      const mappedReports = (reportsResponse.data || []).map((report: any) => ({
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

      const mappedSessions = (sessionsResponse.data || []).map((session: any) => ({
        id: session.id,
        childId: session.child_id,
        type: session.type,
        scheduledDate: session.scheduled_date,
        scheduledTime: session.scheduled_time,
        status: session.status,
        goals: session.goals,
        notes: session.notes,
        createdAt: new Date(session.created_at),
      }));

      setReports(mappedReports);
      setTherapySessions(mappedSessions);
      setScreeningResults(screeningResponse.data || []);
    };

    loadChildData();
  }, [selectedChildId, refreshTick]);

  const selectedChild = children.find((child) => child.id === selectedChildId);
  const childReports = useMemo(
    () => reports.filter((report) => report.childId === selectedChildId),
    [reports, selectedChildId]
  );
  const childSessions = useMemo(
    () => therapySessions.filter((session) => session.childId === selectedChildId),
    [therapySessions, selectedChildId]
  );
  const completedSessions = useMemo(
    () => childSessions.filter((session) => session.status === "completed"),
    [childSessions]
  );
  const completedSessionsCount = completedSessions.length;
  const hasCompletedSessions = completedSessionsCount > 0;

  const screeningTimelineData = useMemo(() => {
    const sorted = [...(screeningResults || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return sorted.map((result, index) => ({
      date: format(new Date(result.created_at), "MMM d"),
      fullDate: format(new Date(result.created_at), "MMM d, yyyy"),
      screenings: index + 1,
      riskLevel: result.risk_level || "unknown",
    }));
  }, [screeningResults]);

  const activityBreakdownData = useMemo(
    () => [
      { name: "screenings", value: screeningResults.length, fill: "var(--color-screenings)" },
      { name: "reviews", value: childReports.length, fill: "var(--color-reviews)" },
      { name: "sessions", value: completedSessions.length, fill: "var(--color-sessions)" },
    ],
    [screeningResults.length, childReports.length, completedSessions.length]
  );

  const hasAnyProgressData = useMemo(
    () => activityBreakdownData.some((item) => item.value > 0),
    [activityBreakdownData]
  );

  const milestones = useMemo(
    () => generateMilestones(selectedChildId, reports, therapySessions),
    [selectedChildId, reports, therapySessions]
  );

  const insights = useMemo(() => {
    if (!hasCompletedSessions) {
      return [
        {
          type: "neutral",
          title: "Progress Tracking Not Started",
          message: "Complete at least one therapy session to begin progress trend tracking and AI trajectory insights.",
        },
      ];
    }

    if (!screeningResults || screeningResults.length === 0) return [];

    const sorted = [...screeningResults].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    const latestScore = riskScoreMap[latest.risk_level] ?? 50;
    const previousScore = previous ? riskScoreMap[previous.risk_level] ?? 50 : null;

    const items = [
      {
        type: "neutral",
        title: "Latest Risk Level",
        message: `${latest.risk_level?.toUpperCase?.() || "Medium"} risk as of ${format(
          new Date(latest.created_at),
          "MMM d, yyyy"
        )}.`,
      },
    ];

    if (previousScore !== null) {
      if (latestScore < previousScore) {
        items.push({
          type: "positive",
          title: "Risk Trend Improving",
          message: "Recent screening results show a reduced risk trend compared to the previous check-in.",
        });
      } else if (latestScore > previousScore) {
        items.push({
          type: "attention",
          title: "Risk Trend Increasing",
          message: "Recent screening results show an increased risk trend compared to the previous check-in.",
        });
      } else {
        items.push({
          type: "neutral",
          title: "Risk Trend Stable",
          message: "Recent screening results show a stable risk trend compared to the previous check-in.",
        });
      }
    }

    return items;
  }, [screeningResults, hasCompletedSessions]);

  const isTherapist = currentUser?.role === "therapist";
  const isDoctor = currentUser?.role === "doctor";

  useEffect(() => {
    const loadMonitoringInference = async () => {
      if (!selectedChild) return;
      if (!hasCompletedSessions) {
        setMonitoringInference(null);
        setMonitoringError(null);
        return;
      }
      if (!screeningResults || screeningResults.length === 0) {
        setMonitoringInference(null);
        return;
      }

      const sorted = [...screeningResults].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const latest = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2];
      const latestRiskScore = riskScoreMap[latest.risk_level] ?? 50;
      const previousRiskScore = previous ? riskScoreMap[previous.risk_level] ?? 50 : latestRiskScore;

      const orderedCompletedSessions = therapySessions
        .filter((session) => session.childId === selectedChild.id && session.status === "completed")
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const half = orderedCompletedSessions.length > 1 ? Math.floor(orderedCompletedSessions.length / 2) : 0;
      const previousHalf = half > 0 ? orderedCompletedSessions.slice(0, half).length : orderedCompletedSessions.length;
      const latestHalf = half > 0 ? orderedCompletedSessions.slice(half).length : orderedCompletedSessions.length;

      const metricSeries = [
        {
          metric: "risk_score",
          previous: previousRiskScore,
          current: latestRiskScore,
          higherIsBetter: false,
        },
        {
          metric: "completed_sessions_count",
          previous: previousHalf,
          current: latestHalf,
          higherIsBetter: true,
        },
      ];

      const therapistSessionFeedback = orderedCompletedSessions.slice(-3).map((session) => ({
        sessionDate: session.scheduledDate,
        strengths: ["Session completed"],
        concerns: [],
        notes: session.notes || undefined,
      }));

      setMonitoringLoading(true);
      setMonitoringError(null);
      try {
        const response = await agentsService.getMonitoringInference({
          childName: selectedChild.name,
          role: isDoctor ? "doctor" : isTherapist ? "therapist" : "parent",
          metricSeries,
          therapistSessionFeedback,
        });
        setMonitoringInference(response.data);
      } catch (error: any) {
        setMonitoringError(error?.message || "Failed to generate monitoring inference");
      } finally {
        setMonitoringLoading(false);
      }
    };

    loadMonitoringInference();
  }, [selectedChild, screeningResults, therapySessions, isDoctor, isTherapist, hasCompletedSessions]);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Developmental Progress & Learning Curve</h1>
        <p className="text-muted-foreground mt-2">
          Track developmental progress and AI-generated insights
        </p>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Select Child</label>
        <Select value={selectedChildId} onValueChange={setSelectedChildId}>
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
        {loading && <p className="mt-2 text-xs text-muted-foreground">Loading progress data...</p>}
        {loadError && <p className="mt-2 text-xs text-destructive">{loadError}</p>}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl bg-muted/50 border border-border p-4"
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Understanding the Progress Curve</p>
            <p className="text-xs text-muted-foreground mt-1">
              The graph shows how many screenings have been completed over time, while the pie chart
              shows how activity is split across screenings, doctor reviews, and therapist sessions.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Progress Snapshot</h2>
                <p className="text-sm text-muted-foreground">{selectedChild?.name}'s activity overview</p>
              </div>
              <AgentBadge type="monitoring" size="sm" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-sm font-medium">Screening Progress Timeline</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of screenings completed by date
                  </p>
                </div>
                <div className="mt-4 h-[260px]">
                  {screeningTimelineData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <LineChart
                        accessibilityLayer
                        data={screeningTimelineData}
                        margin={{ left: 8, right: 8, top: 10, bottom: 8 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={30}
                          domain={[0, Math.max(1, screeningTimelineData.length)]}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || "No data"}
                              formatter={(value) => [
                                <span className="font-medium">
                                  {value} screening{Number(value) === 1 ? "" : "s"}
                                </span>,
                                "Screenings",
                              ]}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="screenings"
                          stroke="var(--color-screenings)"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 0, fill: "var(--color-screenings)" }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-full flex-col justify-between rounded-lg border border-dashed border-border/70 bg-background/70 p-5">
                      <div>
                        <p className="text-sm font-medium text-foreground">No progress yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          The graph will start plotting after the first screening is completed.
                        </p>
                      </div>
                      <div className="space-y-16 pb-3">
                        <div className="border-t border-dashed border-border/70" />
                        <div className="border-t border-dashed border-border/70" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Screening date</span>
                        <span>Count</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">Care Activity Breakdown</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Screenings, doctor reviews, and therapist sessions
                  </p>
                </div>
                <div className="mt-4 h-[260px] overflow-hidden">
                  {hasAnyProgressData ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <PieChart accessibilityLayer>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel nameKey="name" />}
                        />
                        <Pie
                          data={activityBreakdownData.filter((item) => item.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={84}
                          strokeWidth={2}
                        >
                          <Label
                            content={({ viewBox }) => {
                              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                                    {activityBreakdownData.reduce((sum, item) => sum + item.value, 0)}
                                  </tspan>
                                  <tspan x={viewBox.cx} y={viewBox.cy + 20} className="fill-muted-foreground text-xs">
                                    total items
                                  </tspan>
                                </text>
                              );
                            }}
                          />
                        </Pie>
                        <ChartLegend
                          content={<ChartLegendContent nameKey="name" className="flex-wrap gap-3" />}
                        />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/70 px-4 text-center">
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-muted" />
                      <p className="mt-4 text-sm font-medium text-foreground">No progress yet</p>
                      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                        The pie chart will appear after screenings, doctor reviews, or therapist sessions are recorded.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current status</p>
                <p className="mt-2 text-lg font-semibold">
                  {hasAnyProgressData
                    ? `${screeningResults.length} screening record${screeningResults.length === 1 ? "" : "s"}`
                    : "No progress yet"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {screeningTimelineData.length > 0
                    ? `Latest screening logged on ${screeningTimelineData[screeningTimelineData.length - 1].fullDate}.`
                    : "Once screenings, doctor reviews, or completed therapy sessions are added, the charts will update automatically."}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Monitoring note</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {hasAnyProgressData
                    ? "This view tracks when screenings happened and how care activity is distributed across reviews and therapy."
                    : "There are no markings yet because no screenings, doctor reviews, or completed therapist sessions have been recorded."}
                </p>
              </div>
            </div>
          </div>

          {milestones.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Key Milestones
              </h3>
              <div className="relative">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {milestones.slice(0, 5).map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 pl-6"
                    >
                      <div
                        className={`absolute left-0 h-4 w-4 rounded-full border-2 border-card ${
                          milestone.type === "report"
                            ? milestone.color === "success"
                              ? "bg-success"
                              : "bg-agent-monitoring"
                            : "bg-primary"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{milestone.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(milestone.date, "MMM d, yyyy")}
                        </p>
                      </div>
                      {milestone.type === "report" ? (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <AgentPanel type="monitoring">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Monitoring & Trajectory Agent Insights
            </h3>
            {monitoringLoading && (
              <p className="text-xs text-muted-foreground mb-4 bg-muted/50 rounded-lg p-2">
                Generating monitoring inference...
              </p>
            )}
            {monitoringError && (
              <p className="text-xs text-destructive mb-4 bg-destructive/10 rounded-lg p-2">
                {monitoringError}
              </p>
            )}
            {monitoringInference?.overview && (
              <p className="text-xs text-muted-foreground mb-4 bg-muted/50 rounded-lg p-2">
                {monitoringInference.overview}
              </p>
            )}
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-lg bg-muted/50 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {insight.type === "positive" && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                    {insight.type === "neutral" && (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    {insight.type === "attention" && (
                      <TrendingDown className="h-4 w-4 text-warning" />
                    )}
                    <span className="text-sm font-medium">{insight.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.message}</p>
                </motion.div>
              ))}
              {monitoringInference?.metricInsights?.map((line, index) => (
                <div key={`metric-${index}`} className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">{line}</p>
                </div>
              ))}
            </div>
          </AgentPanel>

          <div className="mt-4 rounded-2xl border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-success" />
              <span className="font-medium text-sm">
                {hasCompletedSessions ? "Feedback Loop Active" : "Feedback Loop Pending"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasCompletedSessions
                ? "Insights are automatically shared with your therapist and care team."
                : "Insights sharing will activate after the first completed therapy session."}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <span className="font-medium text-sm">AI Recommendation</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {monitoringInference?.nextActions?.[0] ||
                "Monitoring recommendation will appear after enough screening and session data is available."}
            </p>
            {monitoringInference?.nextActions?.[1] && (
              <p className="text-xs text-muted-foreground mt-2">{monitoringInference.nextActions[1]}</p>
            )}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 rounded-2xl border border-secondary/30 gradient-warm p-6 text-primary-foreground"
      >
        <div className="flex items-center gap-4">
          <Calendar className="h-10 w-10" />
          <div>
            <h3 className="font-semibold">Weekly Check-in Due</h3>
            <p className="text-sm opacity-90">
              Complete your weekly developmental check-in to help track progress accurately.
            </p>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
