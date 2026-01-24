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
  screeningStatus: 'not-started' | 'in-progress' | 'pending-review' | 'reviewed';
  riskLevel?: 'low' | 'medium' | 'high';
  assignedDoctorId?: string;
  assignedTherapistId?: string;
}

export interface ScreeningResult {
  childId: string;
  riskLevel: 'low' | 'medium' | 'high';
  indicators: string[];
  timestamp: Date;
  videoFileName: string;
  questionnaireAnswers: Record<string, string>;
}

interface AppState {
  currentUser: User | null;
  children: Child[];
  screeningResults: ScreeningResult[];
  setCurrentUser: (user: User | null) => void;
  addChild: (child: Child) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  addScreeningResult: (result: ScreeningResult) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  children: [
    {
      id: '1',
      name: 'Emma Thompson',
      age: 3,
      dateOfBirth: '2022-03-15',
      screeningStatus: 'pending-review',
      riskLevel: 'medium',
      assignedDoctorId: 'doc1',
      assignedTherapistId: 'ther1',
    },
    {
      id: '2',
      name: 'Liam Parker',
      age: 4,
      dateOfBirth: '2021-07-22',
      screeningStatus: 'reviewed',
      riskLevel: 'low',
      assignedDoctorId: 'doc1',
      assignedTherapistId: 'ther1',
    },
  ],
  screeningResults: [],
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
}));
