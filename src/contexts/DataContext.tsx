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

const initialState: DataState = {
  templates: [],
  classes: [],
  reports: [],
  savedRatedComments: [],
  savedStandardComments: [],
  savedAssessmentComments: [],
  savedPersonalisedComments: [],
  savedNextStepsComments: [],
  isLoading: true,
  isSyncing: false,
  lastSyncTime: null
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
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
        classes: state.classes.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    case 'DELETE_CLASS':
      return {
        ...state,
        classes: state.classes.filter(c => c.id !== action.payload),
        reports: state.reports.filter(r => r.classId !== action.payload)
      };
    
    case 'ADD_REPORT':
      return { ...state, reports: [...state.reports, action.payload] };
    
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r => 
          r.id === action.payload.id ? action.payload : r
        )
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
      return action.payload;
    
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

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { user } = useAuth();

  // Get user ID with fallback
  const getUserId = () => {
    return user?.id || user?.email || `admin-test-2024-reportgenerator-com`;
  };

  // CLOUD SYNC FUNCTIONS - RE-ENABLED WITH BETTER LOGIC
  const syncFromCloud = async () => {
    const userId = getUserId();
    if (!userId || userId === 'anonymous-user') return;

    try {
      console.log('Syncing from cloud for user:', userId);
      dispatch({ type: 'SET_SYNCING', payload: true });
      
      // Load data from Supabase
      const [cloudTemplates, cloudClasses, cloudReports] = await Promise.all([
        supabaseOperations.getTemplates(userId),
        supabaseOperations.getClasses(userId),
        supabaseOperations.getReports(userId)
      ]);

      console.log(`Loaded from cloud - Templates: ${cloudTemplates.length}, Classes: ${cloudClasses.length}, Reports: ${cloudReports.length}`);

      // Only update state if we got data from cloud
      if (cloudTemplates.length > 0 || cloudClasses.length > 0 || cloudReports.length > 0) {
        const updatedState = {
          ...state,
          templates: cloudTemplates,
          classes: cloudClasses,
          reports: cloudReports,
          isLoading: false,
          isSyncing: false,
          lastSyncTime: new Date()
        };
        dispatch({ type: 'LOAD_DATA', payload: updatedState });
      } else {
        // No cloud data found, keep local data
        console.log('No cloud data found, keeping local data');
      }
      
    } catch (error) {
      console.error('Error syncing from cloud:', error);
      // On error, keep local data
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const syncToCloud = async () => {
    const userId = getUserId();
    if (!userId || userId === 'anonymous-user' || state.isSyncing) return;

    // Only sync if we have data to sync
    if (state.templates.length === 0 && state.classes.length === 0 && state.reports.length === 0) {
      console.log('No data to sync to cloud');
      return;
    }

    try {
      console.log('Syncing to cloud for user:', userId);
      dispatch({ type: 'SET_SYNCING', payload: true });

      await Promise.all([
        supabaseOperations.saveTemplates(userId, state.templates),
        supabaseOperations.saveClasses(userId, state.classes),
        supabaseOperations.saveReports(userId, state.reports)
      ]);

      console.log('Synced to cloud successfully');
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date() });
      
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const loadAllData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Always load from localStorage first for immediate display
      loadLocalData();
      
      // Then sync from cloud if logged in
      if (user) {
        await syncFromCloud();
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      loadLocalData(); // Fallback to localStorage
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadLocalData = () => {
    try {
      console.log('Loading data from localStorage...');
      
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

      console.log(`Loaded from localStorage - Templates: ${loadedState.templates.length}, Classes: ${loadedState.classes.length}, Reports: ${loadedState.reports.length}`);
      
      dispatch({ type: 'LOAD_DATA', payload: loadedState });
    } catch (error) {
      console.error('Error loading local data:', error);
    }
  };

  // Load data when component mounts and when user changes
  useEffect(() => {
    loadAllData();
  }, [user]);

  // Save to localStorage whenever state changes (FIXED - no longer clears on logout)
  useEffect(() => {
    if (!state.isLoading && !state.isSyncing) {
      console.log(`Saving to localStorage - Templates: ${state.templates.length}, Classes: ${state.classes.length}, Reports: ${state.reports.length}`);
      
      localStorage.setItem('reportTemplates', JSON.stringify(state.templates));
      localStorage.setItem('reportClasses', JSON.stringify(state.classes));
      localStorage.setItem('reportReports', JSON.stringify(state.reports));
      localStorage.setItem('savedRatedComments', JSON.stringify(state.savedRatedComments));
      localStorage.setItem('savedStandardComments', JSON.stringify(state.savedStandardComments));
      localStorage.setItem('savedAssessmentComments', JSON.stringify(state.savedAssessmentComments));
      localStorage.setItem('savedPersonalisedComments', JSON.stringify(state.savedPersonalisedComments));
      localStorage.setItem('savedNextStepsComments', JSON.stringify(state.savedNextStepsComments));
      
      // Also sync to cloud if user is logged in (throttled)
      if (user && (state.templates.length > 0 || state.classes.length > 0 || state.reports.length > 0)) {
        // Debounce cloud sync to prevent infinite loops
        const timeoutId = setTimeout(() => {
          syncToCloud();
        }, 2000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [state, user]);

  // Template operations
  const addTemplate = (template: Omit<Template, 'id' | 'createdAt'>) => {
    const newTemplate: Template = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    console.log('Adding template:', newTemplate.name);
    dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
  };

  const updateTemplate = (template: Template) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
  };

  const deleteTemplate = (id: string) => {
    dispatch({ type: 'DELETE_TEMPLATE', payload: id });
  };

  // Class operations
  const addClass = (cls: Omit<Class, 'id' | 'createdAt'>) => {
    const newClass: Class = {
      ...cls,
      id: `class-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    console.log('Adding class:', newClass.name);
    dispatch({ type: 'ADD_CLASS', payload: newClass });
  };

  const updateClass = (cls: Class) => {
    dispatch({ type: 'UPDATE_CLASS', payload: cls });
  };

  const deleteClass = (id: string) => {
    dispatch({ type: 'DELETE_CLASS', payload: id });
  };

  // Report operations
  const addReport = (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReport: Report = {
      ...report,
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_REPORT', payload: newReport });
  };

  const updateReport = (report: Report) => {
    const updatedReport: Report = {
      ...report,
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: 'UPDATE_REPORT', payload: updatedReport });
  };

  const deleteReport = (id: string) => {
    dispatch({ type: 'DELETE_REPORT', payload: id });
  };

  const saveReport = (reportData: any) => {
    const existingReportIndex = state.reports.findIndex(
      r => r.studentId === reportData.studentId && r.templateId === reportData.templateId
    );

    if (existingReportIndex >= 0) {
      const updatedReport: Report = {
        ...state.reports[existingReportIndex],
        content: reportData.content,
        updatedAt: new Date().toISOString()
      };
      updateReport(updatedReport);
    } else {
      addReport({
        studentId: reportData.studentId,
        classId: reportData.classId,
        templateId: reportData.templateId,
        content: reportData.content
      });
    }
  };

  const getReport = (studentId: string, templateId: string) => {
    return state.reports.find(
      report => report.studentId === studentId && report.templateId === templateId
    );
  };

  const createTestData = () => {
    console.log('Creating test data...');
  };

  // Comment management functions
  const addRatedComment = (ratedComment: RatedComment) => {
    dispatch({ type: 'ADD_RATED_COMMENT', payload: ratedComment });
  };

  const updateRatedComment = (ratedComment: RatedComment) => {
    dispatch({ type: 'UPDATE_RATED_COMMENT', payload: ratedComment });
  };

  const deleteRatedComment = (name: string) => {
    dispatch({ type: 'DELETE_RATED_COMMENT', payload: name });
  };

  const addStandardComment = (standardComment: StandardComment) => {
    dispatch({ type: 'ADD_STANDARD_COMMENT', payload: standardComment });
  };

  const updateStandardComment = (standardComment: StandardComment) => {
    dispatch({ type: 'UPDATE_STANDARD_COMMENT', payload: standardComment });
  };

  const deleteStandardComment = (name: string) => {
    dispatch({ type: 'DELETE_STANDARD_COMMENT', payload: name });
  };

  const addAssessmentComment = (assessmentComment: AssessmentComment) => {
    dispatch({ type: 'ADD_ASSESSMENT_COMMENT', payload: assessmentComment });
  };

  const updateAssessmentComment = (assessmentComment: AssessmentComment) => {
    dispatch({ type: 'UPDATE_ASSESSMENT_COMMENT', payload: assessmentComment });
  };

  const deleteAssessmentComment = (name: string) => {
    dispatch({ type: 'DELETE_ASSESSMENT_COMMENT', payload: name });
  };

  const addPersonalisedComment = (personalisedComment: PersonalisedComment) => {
    dispatch({ type: 'ADD_PERSONALISED_COMMENT', payload: personalisedComment });
  };

  const updatePersonalisedComment = (personalisedComment: PersonalisedComment) => {
    dispatch({ type: 'UPDATE_PERSONALISED_COMMENT', payload: personalisedComment });
  };

  const deletePersonalisedComment = (name: string) => {
    dispatch({ type: 'DELETE_PERSONALISED_COMMENT', payload: name });
  };

  const addNextStepsComment = (nextStepsComment: NextStepsComment) => {
    dispatch({ type: 'ADD_NEXT_STEPS_COMMENT', payload: nextStepsComment });
  };

  const updateNextStepsComment = (nextStepsComment: NextStepsComment) => {
    dispatch({ type: 'UPDATE_NEXT_STEPS_COMMENT', payload: nextStepsComment });
  };

  const deleteNextStepsComment = (name: string) => {
    dispatch({ type: 'DELETE_NEXT_STEPS_COMMENT', payload: name });
  };

  const syncData = async () => {
    if (user) {
      await syncFromCloud();
    }
  };

  return (
    <DataContext.Provider value={{
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
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}