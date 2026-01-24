import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ParentDashboard from "./pages/parent/ParentDashboard";
import Screening from "./pages/parent/Screening";
import Progress from "./pages/parent/Progress";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorReview from "./pages/doctor/DoctorReview";
import TherapistDashboard from "./pages/therapist/TherapistDashboard";
import TherapyPlan from "./pages/therapist/TherapyPlan";
import SessionNotes from "./pages/therapist/SessionNotes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Parent Routes */}
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/children" element={<ParentDashboard />} />
          <Route path="/parent/children/add" element={<ParentDashboard />} />
          <Route path="/parent/screening" element={<Screening />} />
          <Route path="/parent/progress" element={<Progress />} />
          <Route path="/parent/checkins" element={<Progress />} />
          
          {/* Doctor Routes */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/patients" element={<DoctorDashboard />} />
          <Route path="/doctor/reviews" element={<DoctorDashboard />} />
          <Route path="/doctor/review/:childId" element={<DoctorReview />} />
          
          {/* Therapist Routes */}
          <Route path="/therapist" element={<TherapistDashboard />} />
          <Route path="/therapist/patients" element={<TherapistDashboard />} />
          <Route path="/therapist/sessions" element={<TherapistDashboard />} />
          <Route path="/therapist/plan/:childId" element={<TherapyPlan />} />
          <Route path="/therapist/sessions/:sessionId/notes" element={<SessionNotes />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;