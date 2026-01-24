import { useState } from "react";
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
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentPanel, AgentBadge } from "@/components/AgentBadge";
import { useAppStore } from "@/lib/store";

const mockTherapyPlan = {
  speechTherapy: {
    aiSuggested: [
      "Focus on building vocabulary through picture cards",
      "Practice turn-taking in conversation",
      "Introduce simple two-word phrases",
      "Use songs and rhymes for engagement",
    ],
    goals: ["Increase vocabulary by 20 words", "Respond to simple questions"],
  },
  motorSkills: {
    aiSuggested: [
      "Fine motor exercises with playdough",
      "Threading beads activities",
      "Drawing and coloring exercises",
      "Balance and coordination games",
    ],
    goals: ["Improve pencil grip", "Complete simple puzzles independently"],
  },
  socialInteraction: {
    aiSuggested: [
      "Parallel play activities with peers",
      "Emotion recognition using pictures",
      "Simple group games",
      "Role-playing scenarios",
    ],
    goals: ["Initiate play with one peer", "Recognize 3 basic emotions"],
  },
};

type TherapyArea = "speech" | "motor" | "social";

export default function TherapyPlan() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const { children } = useAppStore();
  const [editingArea, setEditingArea] = useState<TherapyArea | null>(null);
  const [customGoals, setCustomGoals] = useState<Record<TherapyArea, string>>({
    speech: "",
    motor: "",
    social: "",
  });

  const child = children.find((c) => c.id === childId);

  if (!child) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Patient not found</p>
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
      data: mockTherapyPlan.speechTherapy,
    },
    {
      id: "motor" as TherapyArea,
      title: "Motor Skills",
      icon: Hand,
      color: "text-primary",
      bg: "bg-primary/10",
      data: mockTherapyPlan.motorSkills,
    },
    {
      id: "social" as TherapyArea,
      title: "Social Interaction",
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
      data: mockTherapyPlan.socialInteraction,
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Therapy Plan</h1>
        <p className="text-muted-foreground mt-2">
          {child.name} • {child.age} years old
        </p>
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
                <ul className="space-y-2">
                  {area.data.aiSuggested.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
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
