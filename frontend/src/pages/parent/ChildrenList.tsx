import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Baby, Plus, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ChildCard } from "@/components/ChildCard";
import { useAppStore } from "@/lib/store";

export default function ChildrenList() {
  const navigate = useNavigate();
  const { children } = useAppStore();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Children</h1>
            <p className="text-muted-foreground mt-2">
              Manage child profiles and access individual screening data
            </p>
          </div>
          <Button onClick={() => navigate("/parent/children/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ChildCard
                child={child}
                onClick={() => navigate(`/parent/children/${child.id}`)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <Baby className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No children registered yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your child's profile to start screening
          </p>
          <Button onClick={() => navigate("/parent/children/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Child Profile
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
