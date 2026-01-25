import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Users, Stethoscope, HeartPulse, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleCard } from "@/components/RoleCard";
import { useAppStore, UserRole } from "@/lib/store";

type AuthStep = "role" | "form";

export default function Auth() {
  const [step, setStep] = useState<AuthStep>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { setCurrentUser } = useAppStore();

  const roles = [
    {
      role: "parent" as UserRole,
      icon: Users,
      title: "Parent",
      description: "Monitor your child's development and access screening tools",
    },
    {
      role: "doctor" as UserRole,
      icon: Stethoscope,
      title: "Doctor",
      description: "Review screenings and provide clinical assessments",
    },
    {
      role: "therapist" as UserRole,
      icon: HeartPulse,
      title: "Therapist",
      description: "Create therapy plans and track session progress",
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      setStep("form");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    const user = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || "Demo User",
      email: formData.email || "demo@example.com",
      role: selectedRole,
    };

    setCurrentUser(user);

    // Navigate to role-specific dashboard
    switch (selectedRole) {
      case "parent":
        navigate("/parent");
        break;
      case "doctor":
        navigate("/doctor");
        break;
      case "therapist":
        navigate("/therapist");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-xl">AutiCare</span>
              <span className="text-primary ml-1">AI</span>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Already have an account?" : "Need an account?"}
          </Button>
        </div>
      </header>

      <main className="container pt-24 pb-16">
        <AnimatePresence mode="wait">
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-3xl"
            >
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-hero"
                >
                  <Bot className="h-10 w-10 text-primary-foreground" />
                </motion.div>
                <h1 className="text-4xl font-bold mb-4">
                  Welcome to <span className="text-primary">AutiCare AI</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  AI-powered early autism screening and care platform
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-center text-lg font-medium mb-6">
                  {isSignUp ? "Create your account" : "Sign in to your account"}
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  Select your role to continue
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {roles.map((role) => (
                  <RoleCard
                    key={role.role}
                    icon={role.icon}
                    title={role.title}
                    description={role.description}
                    selected={selectedRole === role.role}
                    onClick={() => handleRoleSelect(role.role)}
                  />
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  variant="hero"
                  onClick={handleContinue}
                  disabled={!selectedRole}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* AI Disclaimer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 rounded-xl border border-accent/30 bg-accent/5 p-4 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  <Bot className="inline-block h-4 w-4 mr-2 text-accent" />
                  <strong>AI supports decisions, humans remain in control.</strong>
                  <br />
                  Our AI agents assist healthcare professionals but never make diagnoses.
                </p>
              </motion.div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-md"
            >
              <Button
                variant="ghost"
                className="mb-6"
                onClick={() => setStep("role")}
              >
                ← Back to role selection
              </Button>

              <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold">
                    {isSignUp ? "Create Account" : "Welcome Back"}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {isSignUp
                      ? "Enter your details to get started"
                      : "Sign in to continue"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Full Name"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>

                  <Button type="submit" size="lg" variant="hero" className="w-full">
                    {isSignUp ? "Create Account" : "Sign In"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
