import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set user context for Row Level Security
export const setSupabaseUserContext = async (userId: string) => {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_id',
      setting_value: userId,
      is_local: true
    });
  } catch (error) {
    console.error('Failed to set user context:', error);
  }
};

// Database operations
export const supabaseOperations = {
  // User operations
  async createOrUpdateUser(userId: string, userData: any) {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          email: userData.email,
          full_name: userData.full_name,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Template operations
  async saveTemplates(userId: string, templates: any[]) {
    try {
      const templateData = templates.map(template => ({
        user_id: userId,
        template_id: template.id,
        name: template.name,
        sections: template.sections,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('templates')
        .upsert(templateData);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving templates:', error);
      throw error;
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
      
      // Convert back to your app's format
      return data?.map(row => ({
        id: row.template_id,
        name: row.name,
        sections: row.sections,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) || [];
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  },

  async deleteTemplate(userId: string, templateId: string) {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('user_id', userId)
        .eq('template_id', templateId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  // Class operations
  async saveClasses(userId: string, classes: any[]) {
    try {
      const classData = classes.map(cls => ({
        user_id: userId,
        class_id: cls.id,
        name: cls.name,
        students: cls.students,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('classes')
        .upsert(classData);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving classes:', error);
      throw error;
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
      
      // Convert back to your app's format
      return data?.map(row => ({
        id: row.class_id,
        name: row.name,
        students: row.students,
        createdAt: row.created_at
      })) || [];
    } catch (error) {
      console.error('Error getting classes:', error);
      throw error;
    }
  },

  async deleteClass(userId: string, classId: string) {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('user_id', userId)
        .eq('class_id', classId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  },

  // Report operations - UPDATED TO SUPPORT NEW FIELDS
  async saveReports(userId: string, reports: any[]) {
    try {
      const reportData = reports.map(report => ({
        user_id: userId,
        report_id: report.id,
        student_id: report.studentId,
        template_id: report.templateId,
        class_id: report.classId,
        content: report.content,
        section_data: report.sectionData,
        is_manually_edited: report.isManuallyEdited || false,        // ADDED
        manually_edited_content: report.manuallyEditedContent,       // ADDED
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('reports')
        .upsert(reportData);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving reports:', error);
      throw error;
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
      
      // Convert back to your app's format
      return data?.map(row => ({
        id: row.report_id,
        studentId: row.student_id,
        templateId: row.template_id,
        classId: row.class_id,
        content: row.content,
        sectionData: row.section_data,
        isManuallyEdited: row.is_manually_edited,              // ADDED
        manuallyEditedContent: row.manually_edited_content,    // ADDED
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) || [];
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  },

  async deleteReport(userId: string, reportId: string) {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('user_id', userId)
        .eq('report_id', reportId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  // Saved comment operations
  async saveRatedComments(userId: string, comments: any[]) {
    try {
      const commentData = comments.map(comment => ({
        user_id: userId,
        comment_name: comment.name,
        comment_data: comment,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('rated_comments')
        .upsert(commentData);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving rated comments:', error);
      throw error;
    }
  },

  async getRatedComments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('rated_comments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(row => row.comment_data) || [];
    } catch (error) {
      console.error('Error getting rated comments:', error);
      throw error;
    }
  },

  async deleteRatedComment(userId: string, commentName: string) {
    try {
      const { error } = await supabase
        .from('rated_comments')
        .delete()
        .eq('user_id', userId)
        .eq('comment_name', commentName);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting rated comment:', error);
      throw error;
    }
  },

  // Similar methods for other comment types...
  async saveStandardComments(userId: string, comments: any[]) {
    try {
      const commentData = comments.map(comment => ({
        user_id: userId,
        comment_name: comment.name,
        comment_data: comment,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('standard_comments')
        .upsert(commentData);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving standard comments:', error);
      throw error;
    }
  },

  async getStandardComments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('standard_comments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(row => row.comment_data) || [];
    } catch (error) {
      console.error('Error getting standard comments:', error);
      throw error;
    }
  },

  // Add similar methods for assessment_comments, personalised_comments, next_steps_comments
  // ...
};