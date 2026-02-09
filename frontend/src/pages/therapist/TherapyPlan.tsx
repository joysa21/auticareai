import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Hand,
  Users,
  CheckCircle2,
  Edit3,
  Save,
  Bot,
  Plus,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentPanel, AgentBadge } from "@/components/AgentBadge";
import { Child } from "@/lib/store";
import { childrenService } from "@/services/data";

type TherapyArea = "speech" | "motor" | "social";

export default function TherapyPlan() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [editingArea, setEditingArea] = useState<TherapyArea | null>(null);
  const [customGoals, setCustomGoals] = useState<Record<TherapyArea, string>>({
    speech: "",
    motor: "",
    social: "",
  });
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChild = async () => {
      if (!childId) return;
      setLoading(true);
      setError(null);

      const { data, error } = await childrenService.getChildById(childId);
      if (error) {
        setError(error.message || "Failed to load child");
        setLoading(false);
        return;
      }

      const dob = new Date(data.date_of_birth);
      const age = Number.isNaN(dob.getTime())
        ? 0
        : Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));

      setChild({
        id: data.id,
        name: data.name,
        dateOfBirth: data.date_of_birth,
        age,
        gender: data.gender,
        screeningStatus: data.screening_status,
        riskLevel: data.risk_level,
        assignedDoctorId: data.assigned_doctor_id,
        assignedTherapistId: data.assigned_therapist_id,
        observationEndDate: data.observation_end_date,
      });
      setLoading(false);
    };

    loadChild();
  }, [childId]);

  if (!child) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {loading ? "Loading patient..." : error || "Patient not found"}
          </p>
          <Button variant="outline" onClick={() => navigate("/therapist")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const therapyAreas = [
    {
      id: "speech" as TherapyArea,
      title: "Speech Therapy",
      icon: MessageSquare,
      color: "text-agent-therapy",
      bg: "bg-agent-therapy/10",
      data: { aiSuggested: [], goals: [] },
    },
    {
      id: "motor" as TherapyArea,
      title: "Motor Skills",
      icon: Hand,
      color: "text-primary",
      bg: "bg-primary/10",
      data: { aiSuggested: [], goals: [] },
    },
    {
      id: "social" as TherapyArea,
      title: "Social Interaction",
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
      data: { aiSuggested: [], goals: [] },
    },
  ];

  const handleSaveGoal = (area: TherapyArea) => {
    setEditingArea(null);
    // In a real app, this would save to the backend
  };

  return (
    <DashboardLayout>
      <Button variant="ghost" onClick={() => navigate("/therapist")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Therapy Plan</h1>
          <p className="text-muted-foreground mt-2">
            {child.name} • {child.age} years old
          </p>
        </div>
        <Button onClick={() => navigate(`/therapist/plan/${child.id}/create-session`)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Session
        </Button>
      </div>

      {/* AI Agent Info */}
      <div className="mb-8 rounded-2xl border border-agent-therapy/30 bg-agent-therapy/5 p-6">
        <div className="flex items-start gap-4">
          <AgentBadge type="therapy" />
          <div>
            <h3 className="font-semibold">AI-Suggested Plan</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The Therapy Planning Agent has generated personalized suggestions based on screening
              results and clinical assessment. You can edit and customize these goals.
            </p>
          </div>
        </div>
      </div>

      {/* Therapy Areas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {therapyAreas.map((area, index) => (
          <motion.div
            key={area.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-border bg-card shadow-card"
          >
            {/* Header */}
            <div className={`${area.bg} p-4 rounded-t-2xl`}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-card flex items-center justify-center">
                  <area.icon className={`h-5 w-5 ${area.color}`} />
                </div>
                <h3 className="font-semibold">{area.title}</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* AI Suggested */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-muted-foreground">
                    AI-Suggested Activities
                  </span>
                </div>
                {area.data.aiSuggested.length > 0 ? (
                  <ul className="space-y-2">
                    {area.data.aiSuggested.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No AI suggestions available yet.</p>
                )}
              </div>

              {/* Goals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Therapy Goals</span>
                  {editingArea !== area.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingArea(area.id)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {editingArea === area.id ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Enter custom goals..."
                      value={customGoals[area.id]}
                      onChange={(e) =>
                        setCustomGoals({ ...customGoals, [area.id]: e.target.value })
                      }
                      className="min-h-[100px]"
                    />
                    <Button size="sm" onClick={() => handleSaveGoal(area.id)}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {area.data.goals.map((goal, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2"
                      >
                        <div className={`h-2 w-2 rounded-full ${area.bg.replace("/10", "")}`} />
                        {goal}
                      </li>
                    ))}
                    {customGoals[area.id] && (
                      <li className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg p-2 border border-primary/20">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {customGoals[area.id]}
                      </li>
                    )}
                    {area.data.goals.length === 0 && !customGoals[area.id] && (
                      <li className="text-sm text-muted-foreground">No goals added yet.</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feedback Loop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 rounded-2xl border border-agent-monitoring/30 bg-agent-monitoring/5 p-6"
      >
        <div className="flex items-start gap-4">
          <AgentBadge type="monitoring" />
          <div>
            <h3 className="font-semibold">Continuous Monitoring</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Progress is continuously tracked by the Monitoring & Trajectory Agent. Therapy
              plan adjustments will be suggested based on observed improvements.
            </p>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
