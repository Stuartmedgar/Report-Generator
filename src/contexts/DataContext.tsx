import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Template, Class, Student, Report, RatedComment, StandardComment, AssessmentComment, PersonalisedComment, NextStepsComment } from '../types';
import { supabaseOperations, setSupabaseUserContext } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface DataState {
  templates: Template[];
  classes: Class[];
  reports: Report[];
  savedRatedComments: RatedComment[];
  savedStandardComments: StandardComment[];
  savedAssessmentComments: AssessmentComment[];
  savedPersonalisedComments: PersonalisedComment[];
  savedNextStepsComments: NextStepsComment[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

interface DataContextType {
  state: DataState;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  updateTemplate: (template: Template) => void;
  deleteTemplate: (id: string) => void;
  addClass: (cls: Omit<Class, 'id' | 'createdAt'>) => void;
  updateClass: (cls: Class) => void;
  deleteClass: (id: string) => void;
  addReport: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReport: (report: Report) => void;
  deleteReport: (id: string) => void;
  saveReport: (reportData: any) => void;
  getReport: (studentId: string, templateId: string) => Report | undefined;
  createTestData: () => void;
  addRatedComment: (comment: RatedComment) => void;
  updateRatedComment: (comment: RatedComment) => void;
  deleteRatedComment: (name: string) => void;
  addStandardComment: (comment: StandardComment) => void;
  updateStandardComment: (comment: StandardComment) => void;
  deleteStandardComment: (name: string) => void;
  addAssessmentComment: (comment: AssessmentComment) => void;
  updateAssessmentComment: (comment: AssessmentComment) => void;
  deleteAssessmentComment: (name: string) => void;
  addPersonalisedComment: (comment: PersonalisedComment) => void;
  updatePersonalisedComment: (comment: PersonalisedComment) => void;
  deletePersonalisedComment: (name: string) => void;
  addNextStepsComment: (comment: NextStepsComment) => void;
  updateNextStepsComment: (comment: NextStepsComment) => void;
  deleteNextStepsComment: (name: string) => void;
  syncData: () => Promise<void>;
}

const initialState: DataState = {
  templates: [],
  classes: [],
  reports: [],
  savedRatedComments: [],
  savedStandardComments: [],
  savedAssessmentComments: [],
  savedPersonalisedComments: [],
  savedNextStepsComments: [],
  isLoading: false,
  isSyncing: false,
  lastSyncTime: null
};

type DataAction = 
  | { type: 'ADD_TEMPLATE'; payload: Template }
  | { type: 'UPDATE_TEMPLATE'; payload: Template }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'ADD_CLASS'; payload: Class }
  | { type: 'UPDATE_CLASS'; payload: Class }
  | { type: 'DELETE_CLASS'; payload: string }
  | { type: 'ADD_REPORT'; payload: Report }
  | { type: 'UPDATE_REPORT'; payload: Report }
  | { type: 'DELETE_REPORT'; payload: string }
  | { type: 'ADD_RATED_COMMENT'; payload: RatedComment }
  | { type: 'UPDATE_RATED_COMMENT'; payload: RatedComment }
  | { type: 'DELETE_RATED_COMMENT'; payload: string }
  | { type: 'ADD_STANDARD_COMMENT'; payload: StandardComment }
  | { type: 'UPDATE_STANDARD_COMMENT'; payload: StandardComment }
  | { type: 'DELETE_STANDARD_COMMENT'; payload: string }
  | { type: 'ADD_ASSESSMENT_COMMENT'; payload: AssessmentComment }
  | { type: 'UPDATE_ASSESSMENT_COMMENT'; payload: AssessmentComment }
  | { type: 'DELETE_ASSESSMENT_COMMENT'; payload: string }
  | { type: 'ADD_PERSONALISED_COMMENT'; payload: PersonalisedComment }
  | { type: 'UPDATE_PERSONALISED_COMMENT'; payload: PersonalisedComment }
  | { type: 'DELETE_PERSONALISED_COMMENT'; payload: string }
  | { type: 'ADD_NEXT_STEPS_COMMENT'; payload: NextStepsComment }
  | { type: 'UPDATE_NEXT_STEPS_COMMENT'; payload: NextStepsComment }
  | { type: 'DELETE_NEXT_STEPS_COMMENT'; payload: string }
  | { type: 'LOAD_DATA'; payload: DataState }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: Date };

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(t => t.id === action.payload.id ? action.payload : t)
      };
    
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.payload)
      };
    
    case 'ADD_CLASS':
      return { ...state, classes: [...state.classes, action.payload] };
    
    case 'UPDATE_CLASS':
      return {
        ...state,
        classes: state.classes.map(c => c.id === action.payload.id ? action.payload : c)
      };
    
    case 'DELETE_CLASS':
      return {
        ...state,
        classes: state.classes.filter(c => c.id !== action.payload)
      };
    
    case 'ADD_REPORT':
      return { ...state, reports: [...state.reports, action.payload] };
    
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r => r.id === action.payload.id ? action.payload : r)
      };
    
    case 'DELETE_REPORT':
      return {
        ...state,
        reports: state.reports.filter(r => r.id !== action.payload)
      };
    
    case 'ADD_RATED_COMMENT':
      return { ...state, savedRatedComments: [...state.savedRatedComments, action.payload] };
    
    case 'UPDATE_RATED_COMMENT':
      return {
        ...state,
        savedRatedComments: state.savedRatedComments.map(rc => 
          rc.name === action.payload.name ? action.payload : rc
        )
      };
    
    case 'DELETE_RATED_COMMENT':
      return {
        ...state,
        savedRatedComments: state.savedRatedComments.filter(rc => rc.name !== action.payload)
      };
    
    case 'ADD_STANDARD_COMMENT':
      return { ...state, savedStandardComments: [...state.savedStandardComments, action.payload] };
    
    case 'UPDATE_STANDARD_COMMENT':
      return {
        ...state,
        savedStandardComments: state.savedStandardComments.map(sc => 
          sc.name === action.payload.name ? action.payload : sc
        )
      };
    
    case 'DELETE_STANDARD_COMMENT':
      return {
        ...state,
        savedStandardComments: state.savedStandardComments.filter(sc => sc.name !== action.payload)
      };
    
    case 'ADD_ASSESSMENT_COMMENT':
      return { ...state, savedAssessmentComments: [...state.savedAssessmentComments, action.payload] };
    
    case 'UPDATE_ASSESSMENT_COMMENT':
      return {
        ...state,
        savedAssessmentComments: state.savedAssessmentComments.map(ac => 
          ac.name === action.payload.name ? action.payload : ac
        )
      };
    
    case 'DELETE_ASSESSMENT_COMMENT':
      return {
        ...state,
        savedAssessmentComments: state.savedAssessmentComments.filter(ac => ac.name !== action.payload)
      };
    
    case 'ADD_PERSONALISED_COMMENT':
      return { ...state, savedPersonalisedComments: [...state.savedPersonalisedComments, action.payload] };
    
    case 'UPDATE_PERSONALISED_COMMENT':
      return {
        ...state,
        savedPersonalisedComments: state.savedPersonalisedComments.map(pc => 
          pc.name === action.payload.name ? action.payload : pc
        )
      };
    
    case 'DELETE_PERSONALISED_COMMENT':
      return {
        ...state,
        savedPersonalisedComments: state.savedPersonalisedComments.filter(pc => pc.name !== action.payload)
      };
    
    case 'ADD_NEXT_STEPS_COMMENT':
      return { ...state, savedNextStepsComments: [...state.savedNextStepsComments, action.payload] };
    
    case 'UPDATE_NEXT_STEPS_COMMENT':
      return {
        ...state,
        savedNextStepsComments: state.savedNextStepsComments.map(nsc => 
          nsc.name === action.payload.name ? action.payload : nsc
        )
      };
    
    case 'DELETE_NEXT_STEPS_COMMENT':
      return {
        ...state,
        savedNextStepsComments: state.savedNextStepsComments.filter(nsc => nsc.name !== action.payload)
      };
    
    case 'LOAD_DATA':
      return { ...action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    
    default:
      return state;
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { user } = useAuth();

  // Get user ID for data storage
  const getUserId = () => {
    const userId = user ? `admin-test-2024-reportgenerator-com` : 'anonymous-user';
    console.log('🔍 DEBUG: Getting user ID:', userId, 'User object:', user);
    return userId;
  };

  // DEBUG LOGGING FOR SYNC FUNCTIONS
  const syncFromCloud = async () => {
    const userId = getUserId();
    console.log('🔄 DEBUG: Starting syncFromCloud for user:', userId);
    
    if (!userId || userId === 'anonymous-user') {
      console.log('❌ DEBUG: No valid user ID, skipping cloud sync');
      return;
    }

    try {
      console.log('⏳ DEBUG: Setting syncing to true');
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      console.log('🔐 DEBUG: Setting Supabase user context');
      await setSupabaseUserContext(userId);

      console.log('📡 DEBUG: Loading data from Supabase...');
      // Load data from Supabase
      const [cloudTemplates, cloudClasses, cloudReports] = await Promise.all([
        supabaseOperations.getTemplates(userId),
        supabaseOperations.getClasses(userId),
        supabaseOperations.getReports(userId)
      ]);

      console.log('✅ DEBUG: Cloud data loaded:', {
        templates: cloudTemplates?.length || 0,
        classes: cloudClasses?.length || 0,
        reports: cloudReports?.length || 0
      });

      // Update state with cloud data
      dispatch({ type: 'LOAD_DATA', payload: {
        ...state,
        templates: cloudTemplates || [],
        classes: cloudClasses || [],
        reports: cloudReports || [],
        savedRatedComments: state.savedRatedComments, // Keep comments local for now
        savedStandardComments: state.savedStandardComments,
        savedAssessmentComments: state.savedAssessmentComments,
        savedPersonalisedComments: state.savedPersonalisedComments,
        savedNextStepsComments: state.savedNextStepsComments,
        isLoading: false,
        isSyncing: false,
        lastSyncTime: new Date()
      }});

      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date() });
      console.log('✅ DEBUG: Cloud sync completed successfully');
      
    } catch (error) {
      console.error('❌ DEBUG: Error syncing from cloud:', error);
      console.log('🔄 DEBUG: Falling back to localStorage');
      // Fall back to localStorage if cloud sync fails
      loadLocalData();
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const syncToCloud = async () => {
    const userId = getUserId();
    console.log('📤 DEBUG: Starting syncToCloud for user:', userId);
    
    if (!userId || userId === 'anonymous-user' || state.isSyncing) {
      console.log('❌ DEBUG: Cannot sync to cloud - invalid user or already syncing');
      return;
    }

    try {
      console.log('⏳ DEBUG: Setting syncing to true for upload');
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      console.log('🔐 DEBUG: Setting Supabase user context for upload');
      await setSupabaseUserContext(userId);

      console.log('📤 DEBUG: Uploading data to Supabase:', {
        templates: state.templates?.length || 0,
        classes: state.classes?.length || 0,
        reports: state.reports?.length || 0
      });

      await Promise.all([
        supabaseOperations.saveTemplates(userId, state.templates || []),
        supabaseOperations.saveClasses(userId, state.classes || []),
        supabaseOperations.saveReports(userId, state.reports || [])
      ]);

      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date() });
      console.log('✅ DEBUG: Cloud upload completed successfully');
      
    } catch (error) {
      console.error('❌ DEBUG: Error syncing to cloud:', error);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  // Load data when user changes
  useEffect(() => {
    console.log('👤 DEBUG: User changed:', user ? 'logged in' : 'logged out');
    if (user) {
      loadAllData();
    } else {
      // Clear data when user logs out
      dispatch({ type: 'LOAD_DATA', payload: initialState });
    }
  }, [user]);

  // Save to localStorage and cloud whenever state changes
  useEffect(() => {
    if (!state.isLoading) {
      console.log('💾 DEBUG: Saving to localStorage and attempting cloud sync');
      localStorage.setItem('reportTemplates', JSON.stringify(state.templates));
      localStorage.setItem('reportClasses', JSON.stringify(state.classes));
      localStorage.setItem('reportReports', JSON.stringify(state.reports));
      localStorage.setItem('savedRatedComments', JSON.stringify(state.savedRatedComments));
      localStorage.setItem('savedStandardComments', JSON.stringify(state.savedStandardComments));
      localStorage.setItem('savedAssessmentComments', JSON.stringify(state.savedAssessmentComments));
      localStorage.setItem('savedPersonalisedComments', JSON.stringify(state.savedPersonalisedComments));
      localStorage.setItem('savedNextStepsComments', JSON.stringify(state.savedNextStepsComments));
      
      // Enable cloud sync
      if (user) {
        console.log('☁️ DEBUG: User is logged in, attempting cloud sync');
        syncToCloud();
      } else {
        console.log('🔒 DEBUG: No user logged in, skipping cloud sync');
      }
    }
  }, [state, user]);

  const loadAllData = async () => {
    try {
      console.log('📂 DEBUG: Starting loadAllData');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Try cloud sync first, fall back to localStorage
      await syncFromCloud();
      
    } catch (error) {
      console.error('❌ DEBUG: Error loading data:', error);
      loadLocalData(); // Fallback to localStorage
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadLocalData = () => {
    try {
      console.log('💽 DEBUG: Loading from localStorage');
      const savedTemplates = localStorage.getItem('reportTemplates');
      const savedClasses = localStorage.getItem('reportClasses');
      const savedReports = localStorage.getItem('reportReports');
      const savedRatedComments = localStorage.getItem('savedRatedComments');
      const savedStandardComments = localStorage.getItem('savedStandardComments');
      const savedAssessmentComments = localStorage.getItem('savedAssessmentComments');
      const savedPersonalisedComments = localStorage.getItem('savedPersonalisedComments');
      const savedNextStepsComments = localStorage.getItem('savedNextStepsComments');

      const loadedState: DataState = {
        templates: savedTemplates ? JSON.parse(savedTemplates) : [],
        classes: savedClasses ? JSON.parse(savedClasses) : [],
        reports: savedReports ? JSON.parse(savedReports) : [],
        savedRatedComments: savedRatedComments ? JSON.parse(savedRatedComments) : [],
        savedStandardComments: savedStandardComments ? JSON.parse(savedStandardComments) : [],
        savedAssessmentComments: savedAssessmentComments ? JSON.parse(savedAssessmentComments) : [],
        savedPersonalisedComments: savedPersonalisedComments ? JSON.parse(savedPersonalisedComments) : [],
        savedNextStepsComments: savedNextStepsComments ? JSON.parse(savedNextStepsComments) : [],
        isLoading: false,
        isSyncing: false,
        lastSyncTime: null
      };

      console.log('✅ DEBUG: Local data loaded:', {
        templates: loadedState.templates?.length || 0,
        classes: loadedState.classes?.length || 0,
        reports: loadedState.reports?.length || 0
      });

      dispatch({ type: 'LOAD_DATA', payload: loadedState });
    } catch (error) {
      console.error('❌ DEBUG: Error loading local data:', error);
    }
  };

  // Template management
  const addTemplate = (template: Omit<Template, 'id' | 'createdAt'>) => {
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    console.log('➕ DEBUG: Adding template:', newTemplate.name);
    dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
  };

  const updateTemplate = (template: Template) => {
    console.log('✏️ DEBUG: Updating template:', template.name);
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
  };

  const deleteTemplate = (id: string) => {
    console.log('🗑️ DEBUG: Deleting template:', id);
    dispatch({ type: 'DELETE_TEMPLATE', payload: id });
  };

  // Class management
  const addClass = (cls: Omit<Class, 'id' | 'createdAt'>) => {
    const newClass: Class = {
      ...cls,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    console.log('➕ DEBUG: Adding class:', newClass.name);
    dispatch({ type: 'ADD_CLASS', payload: newClass });
  };

  const updateClass = (cls: Class) => {
    console.log('✏️ DEBUG: Updating class:', cls.name);
    dispatch({ type: 'UPDATE_CLASS', payload: cls });
  };

  const deleteClass = (id: string) => {
    console.log('🗑️ DEBUG: Deleting class:', id);
    dispatch({ type: 'DELETE_CLASS', payload: id });
  };

  // Report management
  const addReport = (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReport: Report = {
      ...report,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    console.log('➕ DEBUG: Adding report for student:', report.studentId);
    dispatch({ type: 'ADD_REPORT', payload: newReport });
  };

  const updateReport = (report: Report) => {
    const updatedReport = {
      ...report,
      updatedAt: new Date().toISOString()
    };
    console.log('✏️ DEBUG: Updating report:', report.id);
    dispatch({ type: 'UPDATE_REPORT', payload: updatedReport });
  };

  const deleteReport = (id: string) => {
    console.log('🗑️ DEBUG: Deleting report:', id);
    dispatch({ type: 'DELETE_REPORT', payload: id });
  };

  const saveReport = (reportData: any) => {
    const existingReport = state.reports.find(
      r => r.studentId === reportData.studentId && r.templateId === reportData.templateId
    );

    if (existingReport) {
      updateReport({
        ...existingReport,
        content: reportData.content,
        updatedAt: new Date().toISOString()
      });
    } else {
      addReport({
        studentId: reportData.studentId,
        classId: reportData.classId,
        templateId: reportData.templateId,
        templateName: reportData.templateName,
        content: reportData.content
      });
    }
  };

  const getReport = (studentId: string, templateId: string): Report | undefined => {
    return state.reports.find(r => r.studentId === studentId && r.templateId === templateId);
  };

  // Test data creation
  const createTestData = () => {
    // Implementation for test data if needed
  };

  // Comment management functions
  const addRatedComment = (comment: RatedComment) => {
    dispatch({ type: 'ADD_RATED_COMMENT', payload: comment });
  };

  const updateRatedComment = (comment: RatedComment) => {
    dispatch({ type: 'UPDATE_RATED_COMMENT', payload: comment });
  };

  const deleteRatedComment = (name: string) => {
    dispatch({ type: 'DELETE_RATED_COMMENT', payload: name });
  };

  const addStandardComment = (comment: StandardComment) => {
    dispatch({ type: 'ADD_STANDARD_COMMENT', payload: comment });
  };

  const updateStandardComment = (comment: StandardComment) => {
    dispatch({ type: 'UPDATE_STANDARD_COMMENT', payload: comment });
  };

  const deleteStandardComment = (name: string) => {
    dispatch({ type: 'DELETE_STANDARD_COMMENT', payload: name });
  };

  const addAssessmentComment = (comment: AssessmentComment) => {
    dispatch({ type: 'ADD_ASSESSMENT_COMMENT', payload: comment });
  };

  const updateAssessmentComment = (comment: AssessmentComment) => {
    dispatch({ type: 'UPDATE_ASSESSMENT_COMMENT', payload: comment });
  };

  const deleteAssessmentComment = (name: string) => {
    dispatch({ type: 'DELETE_ASSESSMENT_COMMENT', payload: name });
  };

  const addPersonalisedComment = (comment: PersonalisedComment) => {
    dispatch({ type: 'ADD_PERSONALISED_COMMENT', payload: comment });
  };

  const updatePersonalisedComment = (comment: PersonalisedComment) => {
    dispatch({ type: 'UPDATE_PERSONALISED_COMMENT', payload: comment });
  };

  const deletePersonalisedComment = (name: string) => {
    dispatch({ type: 'DELETE_PERSONALISED_COMMENT', payload: name });
  };

  const addNextStepsComment = (comment: NextStepsComment) => {
    dispatch({ type: 'ADD_NEXT_STEPS_COMMENT', payload: comment });
  };

  const updateNextStepsComment = (comment: NextStepsComment) => {
    dispatch({ type: 'UPDATE_NEXT_STEPS_COMMENT', payload: comment });
  };

  const deleteNextStepsComment = (name: string) => {
    dispatch({ type: 'DELETE_NEXT_STEPS_COMMENT', payload: name });
  };

  // Manual sync function
  const syncData = async () => {
    console.log('🔄 DEBUG: Manual sync triggered');
    if (user) {
      await syncFromCloud();
    } else {
      console.log('❌ DEBUG: Cannot sync - no user logged in');
    }
  };

  const value: DataContextType = {
    state,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addClass,
    updateClass,
    deleteClass,
    addReport,
    updateReport,
    deleteReport,
    saveReport,
    getReport,
    createTestData,
    addRatedComment,
    updateRatedComment,
    deleteRatedComment,
    addStandardComment,
    updateStandardComment,
    deleteStandardComment,
    addAssessmentComment,
    updateAssessmentComment,
    deleteAssessmentComment,
    addPersonalisedComment,
    updatePersonalisedComment,
    deletePersonalisedComment,
    addNextStepsComment,
    updateNextStepsComment,
    deleteNextStepsComment,
    syncData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}