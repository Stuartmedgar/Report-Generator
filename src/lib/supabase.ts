import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set user context for Row Level Security
export const setSupabaseUserContext = async (userId: string) => {
  await supabase.rpc('set_config', {
    setting_name: 'app.current_user_id',
    setting_value: userId,
    is_local: true
  });
};

// Database operations
export const supabaseOperations = {
  // User operations
  async createOrUpdateUser(userId: string, userData: any) {
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
  },

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data;
  },

  // Template operations
  async saveTemplates(userId: string, templates: any[]) {
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
  },

  async getTemplates(userId: string) {
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
  },

  async deleteTemplate(userId: string, templateId: string) {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('user_id', userId)
      .eq('template_id', templateId);
    
    if (error) throw error;
  },

  // Class operations
  async saveClasses(userId: string, classes: any[]) {
    const classData = classes.map(cls => ({
      user_id: userId,
      class_id: cls.id,
      name: cls.name,
      students: cls.students,
      template_id: cls.templateId,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('classes')
      .upsert(classData);
    
    if (error) throw error;
    return data;
  },

  async getClasses(userId: string) {
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
      templateId: row.template_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) || [];
  },

  async deleteClass(userId: string, classId: string) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('user_id', userId)
      .eq('class_id', classId);
    
    if (error) throw error;
  },

  // Report operations
  async saveReports(userId: string, reports: any[]) {
    const reportData = reports.map(report => ({
      user_id: userId,
      report_id: report.id,
      class_id: report.classId,
      student_id: report.studentId,
      template_id: report.templateId,
      content: report.content,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('reports')
      .upsert(reportData);
    
    if (error) throw error;
    return data;
  },

  async getReports(userId: string, classId?: string) {
    let query = supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId);
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Convert back to your app's format
    return data?.map(row => ({
      id: row.report_id,
      classId: row.class_id,
      studentId: row.student_id,
      templateId: row.template_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) || [];
  },

  async deleteReport(userId: string, reportId: string) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('user_id', userId)
      .eq('report_id', reportId);
    
    if (error) throw error;
  }
};