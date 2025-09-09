import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug function to test basic connectivity
export const debugSupabase = async () => {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...');
    const { data, error } = await supabase.from('templates').select('count');
    console.log('Basic query result:', { data, error });

    // Test 2: Try to read from templates table
    console.log('Test 2: Testing templates table access...');
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .limit(1);
    console.log('Templates query:', { templates, templatesError });

    // Test 3: Try a simple insert
    console.log('Test 3: Testing insert permission...');
    const testData = {
      user_id: 'test-user',
      template_id: 'test-template-' + Date.now(),
      name: 'Test Template',
      sections: [],
      updated_at: new Date().toISOString()
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('templates')
      .insert([testData]);
    console.log('Insert test:', { insertResult, insertError });

    // Test 4: Clean up test data
    if (!insertError) {
      await supabase
        .from('templates')
        .delete()
        .eq('template_id', testData.template_id);
      console.log('Test data cleaned up');
    }

  } catch (error) {
    console.error('Debug test failed:', error);
  }
};

// Simple operations for testing
export const supabaseOperations = {
  async testConnection() {
    return await debugSupabase();
  },

  async getTemplates(userId: string) {
    console.log('🔍 Getting templates for user:', userId);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      console.log('Templates query result:', { data, error });
      
      if (error) {
        console.error('Templates error details:', error);
        return [];
      }
      
      return data?.map(row => ({
        id: row.template_id,
        name: row.name,
        sections: row.sections,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })) || [];
    } catch (error) {
      console.error('Templates catch block:', error);
      return [];
    }
  },

  async saveTemplates(userId: string, templates: any[]) {
    console.log('💾 Saving templates for user:', userId, 'Count:', templates.length);
    
    if (templates.length === 0) {
      console.log('No templates to save');
      return [];
    }

    try {
      // First, let's try a simple insert without deleting
      const templateData = templates.map(template => ({
        user_id: userId,
        template_id: template.id,
        name: template.name,
        sections: template.sections,
        updated_at: new Date().toISOString()
      }));

      console.log('Template data to insert:', templateData[0]); // Log first item for debugging

      const { data, error } = await supabase
        .from('templates')
        .upsert(templateData, {
          onConflict: 'user_id,template_id'
        });
      
      console.log('Save templates result:', { data, error });
      
      if (error) {
        console.error('Save templates error details:', error);
      }
      
      return data || [];
    } catch (error) {
      console.error('Save templates catch block:', error);
      return [];
    }
  }
};

// Set user context (simplified)
export const setSupabaseUserContext = async (userId: string) => {
  console.log('User context set for:', userId);
};