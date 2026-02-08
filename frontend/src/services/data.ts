import { supabase } from '@/lib/supabase';
import { Child, Report, ScreeningResult, TherapySession } from '@/lib/store';

export const childrenService = {
  async getChildren() {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getChildById(id: string) {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async createChild(child: Omit<Child, 'id'>) {
    const { data, error } = await supabase
      .from('children')
      .insert([
        {
          name: child.name,
          date_of_birth: child.dateOfBirth,
          gender: child.gender,
          screening_status: child.screeningStatus || 'not-started',
          risk_level: child.riskLevel,
          assigned_doctor_id: child.assignedDoctorId,
          assigned_therapist_id: child.assignedTherapistId,
          // Map other fields as needed, handling snake_case vs camelCase
        }
      ])
      .select()
      .single();
    return { data, error };
  },

  async updateChild(id: string, updates: Partial<Child>) {
    // Convert camelCase to snake_case for DB
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.dateOfBirth) dbUpdates.date_of_birth = updates.dateOfBirth;
    if (updates.screeningStatus) dbUpdates.screening_status = updates.screeningStatus;
    if (updates.riskLevel) dbUpdates.risk_level = updates.riskLevel;
    if (updates.assignedDoctorId) dbUpdates.assigned_doctor_id = updates.assignedDoctorId;
    if (updates.assignedTherapistId) dbUpdates.assigned_therapist_id = updates.assignedTherapistId;

    const { data, error } = await supabase
      .from('children')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

export const reportsService = {
  async getReports(childId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        author:profiles(full_name, role)
      `)
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createReport(report: Omit<Report, 'id' | 'createdAt'>, authorId: string) {
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          child_id: report.childId,
          author_id: authorId,
          type: report.type,
          content: {
            doctorNotes: report.doctorNotes,
            screeningSummary: report.screeningSummary,
            diagnosisConfirmation: report.diagnosisConfirmation,
            developmentalGaps: report.developmentalGaps,
            therapyRecommendations: report.therapyRecommendations,
            monitoringPlan: report.monitoringPlan,
            followUpDate: report.followUpDate,
          }
        }
      ])
      .select()
      .single();
    return { data, error };
  },
};

export const screeningService = {
  async saveResult(result: Omit<ScreeningResult, 'timestamp'>) {
    const { data, error } = await supabase
      .from('screening_results')
      .insert([
        {
          child_id: result.childId,
          risk_level: result.riskLevel,
          indicators: result.indicators,
          video_url: result.videoFileName, // Mapping videoFileName to video_url
          answers: result.questionnaireAnswers,
        }
      ])
      .select()
      .single();
    return { data, error };
  },
};
