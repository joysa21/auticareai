import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth";
import { childrenService, therapySessionsService } from "@/services/data";

export default function TherapistSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [childMap, setChildMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUserId(user?.id || null);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUserId) return;
      setLoading(true);
      setLoadError(null);

      const { data: childrenData, error: childrenError } = await childrenService.getChildren();
      if (childrenError) {
        setLoadError(childrenError.message || "Failed to load children");
        setLoading(false);
        return;
      }

      const map: Record<string, string> = {};
      (childrenData || []).forEach((child: any) => {
        map[child.id] = child.name;
      });
      setChildMap(map);

      const { data: sessionsData, error: sessionsError } = await therapySessionsService.getSessionsForTherapist(currentUserId);
      if (sessionsError) {
        setLoadError(sessionsError.message || "Failed to load sessions");
        setLoading(false);
        return;
      }

      setSessions(sessionsData || []);
      setLoading(false);
    };

    loadData();
  }, [currentUserId]);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">All Sessions</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage your therapy sessions
        </p>
      </div>

      {loadError && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading sessions...
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No sessions scheduled yet.
        </div>
      )}

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{childMap[session.child_id] || "Unknown"}</h3>
                <p className="text-sm text-muted-foreground capitalize">{session.type} therapy</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  {session.scheduled_date}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  {session.scheduled_time}
                </div>
                <span className="text-xs text-success capitalize">{session.status}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="flex-1">
                Start Session
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(`/therapist/sessions/${session.id}/notes`)}>
                <FileText className="mr-2 h-4 w-4" />
                Add Notes
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}
