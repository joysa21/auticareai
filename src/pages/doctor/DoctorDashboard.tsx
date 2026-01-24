import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  FileSearch,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { AgentBadge } from "@/components/AgentBadge";
import { useAppStore } from "@/lib/store";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { children } = useAppStore();

  const pendingReviews = children.filter((c) => c.screeningStatus === "pending-review");
  const underObservation = children.filter((c) => c.screeningStatus === "under-observation");
  const diagnosed = children.filter((c) => c.screeningStatus === "diagnosed");

  const stats = [
    {
      label: "Total Patients",
      value: children.length,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Pending Reviews",
      value: pendingReviews.length,
      icon: Clock,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Under Observation",
      value: underObservation.length,
      icon: Eye,
      color: "bg-agent-monitoring/10 text-agent-monitoring",
    },
    {
      label: "Diagnosed",
      value: diagnosed.length,
      icon: CheckCircle2,
      color: "bg-success/10 text-success",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Review AI-generated screening results and provide clinical assessments
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
      <div className="mb-8 rounded-2xl border border-agent-clinical/30 bg-agent-clinical/5 p-6">
        <div className="flex items-start gap-4">
          <AgentBadge type="clinical" />
          <div>
            <h3 className="font-semibold">Clinical Summary Agent Active</h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated clinical summaries are available for each patient. Review and make
              your clinical decision.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pending Reviews</h2>
          <StatusBadge status="pending-review" />
        </div>

        {pendingReviews.length > 0 ? (
          <div className="space-y-4">
            {pendingReviews.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-warning/30 bg-warning/5 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {child.age} years old • Screening completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {child.riskLevel && <StatusBadge riskLevel={child.riskLevel} />}
                    <Button onClick={() => navigate(`/doctor/review/${child.id}`)}>
                      Review
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-4" />
            <p className="text-muted-foreground">All reviews completed!</p>
          </div>
        )}
      </div>

      {/* Under Observation */}
      {underObservation.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Under Observation</h2>
            <StatusBadge status="under-observation" />
          </div>

          <div className="space-y-4">
            {underObservation.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-agent-monitoring/30 bg-agent-monitoring/5 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-agent-monitoring/20 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-agent-monitoring" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {child.age} years old • Monitoring in progress
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {child.riskLevel && <StatusBadge riskLevel={child.riskLevel} />}
                    <Button variant="outline" onClick={() => navigate(`/doctor/review/${child.id}`)}>
                      View Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnosed */}
      {diagnosed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Diagnosis Complete</h2>
            <StatusBadge status="diagnosed" />
          </div>

          <div className="space-y-4">
            {diagnosed.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {child.age} years old • Therapy planning initiated
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {child.riskLevel && <StatusBadge riskLevel={child.riskLevel} />}
                    <Button variant="outline" onClick={() => navigate(`/doctor/review/${child.id}`)}>
                      View Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
