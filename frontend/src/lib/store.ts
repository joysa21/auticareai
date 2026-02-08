import { create } from 'zustand';

export type UserRole = 'parent' | 'doctor' | 'therapist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  screeningStatus: 'not-started' | 'in-progress' | 'pending-review' | 'under-observation' | 'diagnosed';
  riskLevel?: 'low' | 'medium' | 'high';
  assignedDoctorId?: string;
  assignedTherapistId?: string;
  observationEndDate?: string;
}

export interface ScreeningResult {
  childId: string;
  riskLevel: 'low' | 'medium' | 'high';
  indicators: string[];
  timestamp: Date;
  videoFileName: string;
  questionnaireAnswers: Record<string, string>;
}

export type ReportType = 'observation' | 'diagnostic';

export interface Report {
  id: string;
  childId: string;
  type: ReportType;
  createdAt: Date;
  doctorNotes: string;
  screeningSummary: string;
  // Observation report fields
  monitoringPlan?: string;
  followUpDate?: string;
  // Diagnostic report fields
  diagnosisConfirmation?: string;
  developmentalGaps?: string[];
  therapyRecommendations?: string[];
}

export interface TherapySession {
  id: string;
  childId: string;
  type: 'speech' | 'motor' | 'social';
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  goals: string;
  notes?: string;
  createdAt: Date;
}

interface AppState {
  currentUser: User | null;
  children: Child[];
  screeningResults: ScreeningResult[];
  reports: Report[];
  therapySessions: TherapySession[];
  setCurrentUser: (user: User | null) => void;
  addChild: (child: Child) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  addScreeningResult: (result: ScreeningResult) => void;
  addReport: (report: Report) => void;
  getReportsForChild: (childId: string) => Report[];
  addTherapySession: (session: TherapySession) => void;
  updateTherapySession: (id: string, updates: Partial<TherapySession>) => void;
  getSessionsForChild: (childId: string) => TherapySession[];
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  children: [
    {
      id: '1',
      name: 'Emma Thompson',
      age: 3,
      dateOfBirth: '2022-03-15',
      gender: 'female',
      screeningStatus: 'pending-review',
      riskLevel: 'medium',
      assignedDoctorId: 'doc1',
    },
    {
      id: '2',
      name: 'Liam Parker',
      age: 4,
      dateOfBirth: '2021-07-22',
      gender: 'male',
      screeningStatus: 'diagnosed',
      riskLevel: 'low',
      assignedDoctorId: 'doc1',
      assignedTherapistId: 'ther1',
    },
  ],
  screeningResults: [],
  reports: [
    {
      id: 'report-2',
      childId: '2',
      type: 'diagnostic',
      createdAt: new Date('2024-01-10'),
      doctorNotes: 'Mild developmental delays observed. Early intervention recommended.',
      screeningSummary: 'Screening completed with low risk indicators.',
      diagnosisConfirmation: 'Early developmental concerns confirmed. Therapy recommended.',
      developmentalGaps: ['Social communication', 'Fine motor skills'],
      therapyRecommendations: ['Speech therapy 2x weekly', 'Occupational therapy 1x weekly'],
    },
  ],
  therapySessions: [
    {
      id: 'session-1',
      childId: '2',
      type: 'speech',
      scheduledDate: '2024-01-20',
      scheduledTime: '10:00 AM',
      status: 'scheduled',
      goals: 'Practice two-word phrases and vocabulary building',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'session-2',
      childId: '2',
      type: 'motor',
      scheduledDate: '2024-01-21',
      scheduledTime: '2:00 PM',
      status: 'scheduled',
      goals: 'Fine motor exercises and coordination activities',
      createdAt: new Date('2024-01-15'),
    },
  ],
  setCurrentUser: (user) => set({ currentUser: user }),
  addChild: (child) => set((state) => ({ children: [...state.children, child] })),
  updateChild: (id, updates) =>
    set((state) => ({
      children: state.children.map((child) =>
        child.id === id ? { ...child, ...updates } : child
      ),
    })),
  addScreeningResult: (result) =>
    set((state) => ({ screeningResults: [...state.screeningResults, result] })),
  addReport: (report) =>
    set((state) => ({ reports: [...state.reports, report] })),
  getReportsForChild: (childId) => {
    return get().reports.filter((r) => r.childId === childId);
  },
  addTherapySession: (session) =>
    set((state) => ({ therapySessions: [...state.therapySessions, session] })),
  updateTherapySession: (id, updates) =>
    set((state) => ({
      therapySessions: state.therapySessions.map((session) =>
        session.id === id ? { ...session, ...updates } : session
      ),
    })),
  getSessionsForChild: (childId) => {
    return get().therapySessions.filter((s) => s.childId === childId);
  },
}));
