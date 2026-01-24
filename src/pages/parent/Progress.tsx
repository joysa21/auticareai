import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AgentPanel, AgentBadge } from "@/components/AgentBadge";
import { useAppStore } from "@/lib/store";
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
} from "recharts";

const mockProgressData = [
  { month: "Jan", social: 35, communication: 40, motor: 45, cognitive: 38 },
  { month: "Feb", social: 38, communication: 42, motor: 48, cognitive: 42 },
  { month: "Mar", social: 42, communication: 45, motor: 52, cognitive: 45 },
  { month: "Apr", social: 48, communication: 50, motor: 55, cognitive: 50 },
  { month: "May", social: 52, communication: 55, motor: 58, cognitive: 55 },
  { month: "Jun", social: 58, communication: 60, motor: 62, cognitive: 60 },
];

const insights = [
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
];

export default function Progress() {
  const { children } = useAppStore();
  const selectedChild = children[0];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Progress Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track developmental progress and AI-generated insights
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Developmental Trajectory</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedChild?.name || "Child"}'s progress over time
                </p>
              </div>
              <AgentBadge type="monitoring" size="sm" />
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockProgressData}>
                  <defs>
                    <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 60%, 65%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(262, 60%, 65%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(174, 62%, 47%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(174, 62%, 47%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
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
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div>
          <AgentPanel type="monitoring">
            <h3 className="font-semibold mb-4">AI Insights</h3>
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
