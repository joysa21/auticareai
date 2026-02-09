import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Child } from "@/lib/store";
import { authService } from "@/services/auth";
import { childrenService } from "@/services/data";

export default function TherapistPatients() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
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

  const mappedChildren = useMemo(() => {
    return children.map((child) => {
      const dob = new Date(child.dateOfBirth);
      const age = Number.isNaN(dob.getTime())
        ? child.age
        : Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
      return { ...child, age };
    });
  }, [children]);

  const assignedChildren = currentUserId
    ? mappedChildren.filter((child) => child.assignedTherapistId === currentUserId)
    : mappedChildren;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Assigned Patients</h1>
        <p className="text-muted-foreground mt-2">
          View children assigned to you and access their therapy plans
        </p>
      </div>

      {loadError && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading patients...
        </div>
      )}

      {!loading && assignedChildren.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No patients assigned yet.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {assignedChildren.map((child, index) => (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate(`/therapist/plan/${child.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                View Therapy Plan
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}
