import { useState, useMemo } from "react";
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
import { DashboardLayout } from "@/components/DashboardLayout";
import { AgentPanel, AgentBadge } from "@/components/AgentBadge";
import { useAppStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { format } from "date-fns";

// Generate mock progress data based on child ID for consistency
const generateProgressData = (childId: string) => {
  // Use childId to seed different data patterns
  const seed = childId.charCodeAt(0) % 3;
  
  const patterns = [
    // Steady improvement
    [
      { month: "Jan", social: 35, communication: 40, motor: 45, cognitive: 38 },
      { month: "Feb", social: 38, communication: 42, motor: 48, cognitive: 42 },
      { month: "Mar", social: 42, communication: 45, motor: 52, cognitive: 45 },
      { month: "Apr", social: 48, communication: 50, motor: 55, cognitive: 50 },
      { month: "May", social: 52, communication: 55, motor: 58, cognitive: 55 },
      { month: "Jun", social: 58, communication: 60, motor: 62, cognitive: 60 },
    ],
    // Plateau pattern
    [
      { month: "Jan", social: 40, communication: 45, motor: 50, cognitive: 42 },
      { month: "Feb", social: 44, communication: 48, motor: 53, cognitive: 46 },
      { month: "Mar", social: 48, communication: 52, motor: 55, cognitive: 50 },
      { month: "Apr", social: 49, communication: 53, motor: 55, cognitive: 51 },
      { month: "May", social: 50, communication: 54, motor: 56, cognitive: 52 },
      { month: "Jun", social: 51, communication: 55, motor: 57, cognitive: 53 },
    ],
    // Variable progress
    [
      { month: "Jan", social: 30, communication: 35, motor: 40, cognitive: 32 },
      { month: "Feb", social: 35, communication: 40, motor: 45, cognitive: 38 },
      { month: "Mar", social: 38, communication: 42, motor: 50, cognitive: 40 },
      { month: "Apr", social: 42, communication: 48, motor: 52, cognitive: 45 },
      { month: "May", social: 50, communication: 52, motor: 58, cognitive: 52 },
      { month: "Jun", social: 55, communication: 58, motor: 62, cognitive: 58 },
    ],
  ];
  
  return patterns[seed];
};

const generateInsights = (childId: string) => {
  const seed = childId.charCodeAt(0) % 3;
  
  const insightPatterns = [
    [
      {
        type: "positive",
        title: "Communication Improving",
        message: "Verbal communication skills have shown 20% improvement over the past 3 months.",
      },
      {
        type: "neutral",
        title: "Motor Skills Stable",
        message: "Fine motor skills development is progressing at expected pace.",
      },
      {
        type: "attention",
        title: "Social Interaction",
        message: "Consider increasing group play activities to support social skill development.",
      },
    ],
    [
      {
        type: "neutral",
        title: "Possible Plateau Detected",
        message: "Progress has slowed in recent weeks. Consider therapy adjustment.",
      },
      {
        type: "positive",
        title: "Motor Skills Strong",
        message: "Consistent improvement in fine motor coordination activities.",
      },
      {
        type: "attention",
        title: "Speech Development",
        message: "Additional speech therapy sessions may help accelerate progress.",
      },
    ],
    [
      {
        type: "positive",
        title: "Excellent Progress",
        message: "Significant improvement across all developmental areas this quarter.",
      },
      {
        type: "positive",
        title: "Social Engagement Up",
        message: "Increased engagement in group activities and peer interactions.",
      },
      {
        type: "neutral",
        title: "Cognitive Development",
        message: "Cognitive skills are developing steadily with current intervention plan.",
      },
    ],
  ];
  
  return insightPatterns[seed];
};

// Generate mock milestones (reports and sessions)
const generateMilestones = (childId: string, reports: any[], sessions: any[]) => {
  const childReports = reports.filter(r => r.childId === childId);
  const childSessions = sessions.filter(s => s.childId === childId && s.status === "completed");
  
  const milestones = [
    ...childReports.map(r => ({
      type: "report" as const,
      date: new Date(r.createdAt),
      label: r.type === "diagnostic" ? "Diagnostic Report" : "Observation Report",
      color: r.type === "diagnostic" ? "success" : "agent-monitoring",
    })),
    ...childSessions.map(s => ({
      type: "session" as const,
      date: new Date(s.createdAt),
      label: `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} Session`,
      color: "primary",
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return milestones;
};

export default function Progress() {
  const [searchParams] = useSearchParams();
  const { children, reports, therapySessions, currentUser } = useAppStore();
  const [selectedChildId, setSelectedChildId] = useState(
    searchParams.get("childId") || children[0]?.id || ""
  );

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const progressData = useMemo(() => generateProgressData(selectedChildId), [selectedChildId]);
  const insights = useMemo(() => generateInsights(selectedChildId), [selectedChildId]);
  const milestones = useMemo(
    () => generateMilestones(selectedChildId, reports, therapySessions),
    [selectedChildId, reports, therapySessions]
  );

  const isTherapist = currentUser?.role === "therapist";
  const isDoctor = currentUser?.role === "doctor";

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Developmental Progress & Learning Curve</h1>
        <p className="text-muted-foreground mt-2">
          Track developmental progress and AI-generated insights
        </p>
      </div>

      {/* Child Selection */}
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
      </div>

      {/* Explainer */}
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
              Progress curves reflect cumulative learning and therapy impact over time. 
              Each therapy session and diagnostic milestone contributes to the developmental trajectory.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Developmental Trajectory</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedChild?.name}'s progress over time
                </p>
              </div>
              <AgentBadge type="monitoring" size="sm" />
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 60%, 65%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(262, 60%, 65%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(174, 62%, 47%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(174, 62%, 47%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMotor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(15, 90%, 65%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(15, 90%, 65%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="social"
                    stroke="hsl(262, 60%, 65%)"
                    fillOpacity={1}
                    fill="url(#colorSocial)"
                    name="Social Skills"
                  />
                  <Area
                    type="monotone"
                    dataKey="communication"
                    stroke="hsl(174, 62%, 47%)"
                    fillOpacity={1}
                    fill="url(#colorComm)"
                    name="Communication"
                  />
                  {(isTherapist || isDoctor) && (
                    <Area
                      type="monotone"
                      dataKey="motor"
                      stroke="hsl(15, 90%, 65%)"
                      fillOpacity={1}
                      fill="url(#colorMotor)"
                      name="Motor Skills"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-agent-screening" />
                <span className="text-sm">Social Skills</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm">Communication</span>
              </div>
              {(isTherapist || isDoctor) && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="text-sm">Motor Skills</span>
                </div>
              )}
            </div>
          </div>

          {/* Milestones Timeline */}
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

        {/* AI Insights Panel */}
        <div>
          <AgentPanel type="monitoring">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Monitoring & Trajectory Agent Insights
            </h3>
            <p className="text-xs text-muted-foreground mb-4 bg-muted/50 rounded-lg p-2">
              AI-generated insights for monitoring support only. Simulated analysis for demonstration.
            </p>
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
            </div>
          </AgentPanel>

          {/* Feedback Loop Indicator */}
          <div className="mt-4 rounded-2xl border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-success" />
              <span className="font-medium text-sm">Feedback Loop Active</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Insights are automatically shared with your therapist and care team.
            </p>
          </div>

          {/* Simulated Recommendation */}
          <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <span className="font-medium text-sm">AI Recommendation</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on recent progress, consider adjusting speech therapy frequency. 
              This insight has been shared with your assigned Therapist and Parent.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2 italic">
              Simulated AI analysis for demonstration purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Check-in Reminder */}
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
