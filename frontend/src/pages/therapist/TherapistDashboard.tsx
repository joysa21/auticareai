import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { AgentBadge } from "@/components/AgentBadge";
import { useAppStore } from "@/lib/store";

const mockSessions = [
  { id: "1", childName: "Emma Thompson", type: "Speech Therapy", time: "10:00 AM", status: "upcoming" },
  { id: "2", childName: "Liam Parker", type: "Motor Skills", time: "2:00 PM", status: "upcoming" },
];

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const { children } = useAppStore();

  const stats = [
    {
      label: "Active Patients",
      value: children.length,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Sessions Today",
      value: mockSessions.length,
      icon: Calendar,
      color: "bg-agent-therapy/10 text-agent-therapy",
    },
    {
      label: "Plans Created",
      value: 8,
      icon: FileText,
      color: "bg-success/10 text-success",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Therapist Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage therapy plans and track session progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Agent Info */}
      <div className="mb-8 rounded-2xl border border-agent-therapy/30 bg-agent-therapy/5 p-6">
        <div className="flex items-start gap-4">
          <AgentBadge type="therapy" />
          <div>
            <h3 className="font-semibold">Therapy Planning Agent Active</h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated therapy suggestions are available for each patient. Customize plans
              based on individual needs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Today's Sessions</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {mockSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{session.childName}</h3>
                    <p className="text-sm text-muted-foreground">{session.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      {session.time}
                    </div>
                    <span className="text-xs text-success">Upcoming</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1">
                    Start Session
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/therapist/sessions/${session.id}/notes`)}>
                    Add Notes
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Patients Requiring Attention */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Assigned Patients</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/therapist/patients")}>
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {children.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{child.name}</h3>
                    <p className="text-sm text-muted-foreground">{child.age} years old</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {child.riskLevel && <StatusBadge riskLevel={child.riskLevel} />}
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/therapist/plan/${child.id}`)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Therapy Plan
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-success" />
            <h3 className="font-semibold">Weekly Progress Summary</h3>
          </div>
          <AgentBadge type="monitoring" size="sm" />
        </div>
        <p className="text-muted-foreground text-sm">
          All patients are showing positive progress in their therapy goals. Emma has made
          significant improvements in social interaction, while Liam shows steady progress
          in motor skills.
        </p>
      </motion.div>
    </DashboardLayout>
  );
}
