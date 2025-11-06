import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple user context - no RLS at all
export const setSupabaseUserContext = async (userId: string) => {
  console.log('User context set for:', userId);
  // No RLS setup needed
};

// Clean database operations without RLS complications
export const supabaseOperations = {
  // Template operations
  async saveTemplates(userId: string, templates: any[]) {
    console.log('Saving templates for user:', userId, 'Count:', templates.length);
    
    try {
      if (templates.length === 0) {
        console.log('No templates to save');
        return [];
      }

      const templateData = templates.map(template => ({
        user_id: userId,
        template_id: template.id,
        name: template.name,
        sections: template.sections,
        updated_at: new Date().toISOString()
      }));

      console.log('Upserting template data:', templateData[0]);

      // ✅ CRITICAL FIX: Use UPSERT instead of DELETE+INSERT
      // This prevents data loss if the insert fails
      const { data, error } = await supabase
        .from('templates')
        .upsert(templateData, {
          onConflict: 'user_id,template_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('Upsert error:', error);
        return [];
      }

      console.log('Templates saved successfully:', templateData.length);
      return data || [];
    } catch (error) {
      console.error('Error in saveTemplates:', error);
      return [];
    }
  },

  async getTemplates(userId: string) {
    console.log('Getting templates for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting templates:', error);
        return [];
      }
      
      console.log('Found templates:', data?.length || 0);
      
      return data?.map(row => ({
        id: row.template_id,
        name: row.name,
        sections: row.sections,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) || [];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return [];
    }
  },

  // Class operations
  async saveClasses(userId: string, classes: any[]) {
    console.log('Saving classes for user:', userId, 'Count:', classes.length);
    
    try {
      if (classes.length === 0) {
        console.log('No classes to save');
        return [];
      }

      const classData = classes.map(cls => ({
        user_id: userId,
        class_id: cls.id,
        name: cls.name,
        students: cls.students,
        updated_at: new Date().toISOString()
      }));

      // ✅ CRITICAL FIX: Use UPSERT instead of DELETE+INSERT
      const { data, error } = await supabase
        .from('classes')
        .upsert(classData, {
          onConflict: 'user_id,class_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('Error saving classes:', error);
        return [];
      }

      console.log('Classes saved successfully');
      return data || [];
    } catch (error) {
      console.error('Error in saveClasses:', error);
      return [];
    }
  },

  async getClasses(userId: string) {
    console.log('Getting classes for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting classes:', error);
        return [];
      }
      
      console.log('Found classes:', data?.length || 0);
      
      return data?.map(row => ({
        id: row.class_id,
        name: row.name,
        students: row.students,
        createdAt: row.created_at
      })) || [];
    } catch (error) {
      console.error('Error in getClasses:', error);
      return [];
    }
  },

  // Report operations
  async saveReports(userId: string, reports: any[]) {
    console.log('Saving reports for user:', userId, 'Count:', reports.length);
    
    try {
      if (reports.length === 0) {
        console.log('No reports to save');
        return [];
      }

      const reportData = reports.map(report => ({
        user_id: userId,
        report_id: report.id,
        student_id: report.studentId,
        template_id: report.templateId,
        class_id: report.classId,
        content: report.content || '',
        section_data: report.sectionData || null,
        is_manually_edited: report.isManuallyEdited || false,
        manually_edited_content: report.manuallyEditedContent || null,
        updated_at: new Date().toISOString()
      }));

      // ✅ CRITICAL FIX: Use UPSERT instead of DELETE+INSERT
      const { data, error } = await supabase
        .from('reports')
        .upsert(reportData, {
          onConflict: 'user_id,report_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('Error saving reports:', error);
        return [];
      }

      console.log('Reports saved successfully');
      return data || [];
    } catch (error) {
      console.error('Error in saveReports:', error);
      return [];
    }
  },

  async getReports(userId: string) {
    console.log('Getting reports for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false});
      
      if (error) {
        console.error('Error getting reports:', error);
        return [];
      }
      
      console.log('Found reports:', data?.length || 0);
      
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
      console.error('Error in getReports:', error);
      return [];
    }
  },

  // Delete individual items (for when user explicitly deletes)
  async deleteTemplate(userId: string, templateId: string) {
    console.log('Deleting template:', templateId, 'for user:', userId);
    
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('user_id', userId)
        .eq('template_id', templateId);
      
      if (error) {
        console.error('Error deleting template:', error);
        return false;
      }
      
      console.log('Template deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      return false;
    }
  },

  async deleteClass(userId: string, classId: string) {
    console.log('Deleting class:', classId, 'for user:', userId);
    
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('user_id', userId)
        .eq('class_id', classId);
      
      if (error) {
        console.error('Error deleting class:', error);
        return false;
      }
      
      console.log('Class deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteClass:', error);
      return false;
    }
  },

  async deleteReport(userId: string, reportId: string) {
    console.log('Deleting report:', reportId, 'for user:', userId);
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('user_id', userId)
        .eq('report_id', reportId);
      
      if (error) {
        console.error('Error deleting report:', error);
        return false;
      }
      
      console.log('Report deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteReport:', error);
      return false;
    }
  }
};