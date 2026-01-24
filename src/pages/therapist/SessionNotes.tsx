import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  Save,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function SessionNotes() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [notes, setNotes] = useState({
    activitiesCompleted: "",
    childResponse: "",
    progress: "",
    nextSession: "",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      navigate("/therapist");
    }, 1500);
  };

  return (
    <DashboardLayout>
      <Button variant="ghost" onClick={() => navigate("/therapist")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Session Notes</h1>
        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Today
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Speech Therapy Session
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl"
      >
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
          {/* Activities Completed */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Activities Completed
            </label>
            <Textarea
              placeholder="Describe the activities completed during this session..."
              value={notes.activitiesCompleted}
              onChange={(e) =>
                setNotes({ ...notes, activitiesCompleted: e.target.value })
              }
              className="min-h-[100px]"
            />
          </div>

          {/* Child Response */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Child's Response
            </label>
            <Textarea
              placeholder="How did the child respond to the activities?"
              value={notes.childResponse}
              onChange={(e) =>
                setNotes({ ...notes, childResponse: e.target.value })
              }
              className="min-h-[100px]"
            />
          </div>

          {/* Progress */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Progress Observed
            </label>
            <Textarea
              placeholder="Note any progress or areas needing attention..."
              value={notes.progress}
              onChange={(e) => setNotes({ ...notes, progress: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          {/* Next Session */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Recommendations for Next Session
            </label>
            <Textarea
              placeholder="What should be focused on in the next session?"
              value={notes.nextSession}
              onChange={(e) =>
                setNotes({ ...notes, nextSession: e.target.value })
              }
              className="min-h-[80px]"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-border">
            {saved ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-success"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Notes saved successfully!</span>
              </motion.div>
            ) : (
              <Button size="lg" className="w-full" onClick={handleSave}>
                <Save className="mr-2 h-5 w-5" />
                Save Session Notes
              </Button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Session notes are shared with the Monitoring Agent to track progress and
              inform therapy plan adjustments. Parents can view progress summaries in
              their dashboard.
            </p>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
