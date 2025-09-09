import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple user context - no RLS complications
export const setSupabaseUserContext = async (userId: string) => {
  console.log('User context set for:', userId);
};

// Database operations
export const supabaseOperations = {
  // Template operations
  async saveTemplates(userId: string, templates: any[]) {
    try {
      // Delete existing templates for this user first
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing templates:', deleteError);
      }

      // Insert new templates if any exist
      if (templates.length > 0) {
        const templateData = templates.map(template => ({
          user_id: userId,
          template_id: template.id,
          name: template.name,
          sections: template.sections,
          updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
          .from('templates')
          .insert(templateData);
        
        if (error) throw error;
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error saving templates:', error);
      return [];
    }
  },

  async getTemplates(userId: string) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(row => ({
        id: row.template_id,
        name: row.name,
        sections: row.sections,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) || [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  },

  // Class operations
  async saveClasses(userId: string, classes: any[]) {
    try {
      // Delete existing classes for this user first
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing classes:', deleteError);
      }

      // Insert new classes if any exist
      if (classes.length > 0) {
        const classData = classes.map(cls => ({
          user_id: userId,
          class_id: cls.id,
          name: cls.name,
          students: cls.students,
          updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
          .from('classes')
          .insert(classData);
        
        if (error) throw error;
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error saving classes:', error);
      return [];
    }
  },

  async getClasses(userId: string) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(row => ({
        id: row.class_id,
        name: row.name,
        students: row.students,
        createdAt: row.created_at
      })) || [];
    } catch (error) {
      console.error('Error getting classes:', error);
      return [];
    }
  },

  // Report operations
  async saveReports(userId: string, reports: any[]) {
    try {
      // Delete existing reports for this user first
      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing reports:', deleteError);
      }

      // Insert new reports if any exist
      if (reports.length > 0) {
        const reportData = reports.map(report => ({
          user_id: userId,
          report_id: report.id,
          student_id: report.studentId,
          template_id: report.templateId,
          class_id: report.classId,
          content: report.content || '',
          section_data: report.sectionData,
          is_manually_edited: report.isManuallyEdited || false,
          manually_edited_content: report.manuallyEditedContent,
          updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
          .from('reports')
          .insert(reportData);
        
        if (error) throw error;
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error saving reports:', error);
      return [];
    }
  },

  async getReports(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(row => ({
        id: row.report_id,
        studentId: row.student_id,
        templateId: row.template_id,
        classId: row.class_id,
        content: row.content,
        sectionData: row.section_data,
        isManuallyEdited: row.is_manually_edited,
        manuallyEditedContent: row.manually_edited_content,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) || [];
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  }
};