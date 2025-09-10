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
  lastLocalSave: Date | null; // Add this to track when we last saved locally
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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: Date | null }
  | { type: 'SET_LAST_LOCAL_SAVE'; payload: Date | null }
  | { type: 'LOAD_DATA'; payload: Partial<DataState> }
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
  | { type: 'DELETE_NEXT_STEPS_COMMENT'; payload: string };

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
  lastSyncTime: null,
  lastLocalSave: null,
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    case 'SET_LAST_LOCAL_SAVE':
      return { ...state, lastLocalSave: action.payload };
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.payload),
      };
    case 'ADD_CLASS':
      return { ...state, classes: [...state.classes, action.payload] };
    case 'UPDATE_CLASS':
      return {
        ...state,
        classes: state.classes.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CLASS':
      return {
        ...state,
        classes: state.classes.filter(c => c.id !== action.payload),
      };
    case 'ADD_REPORT':
      return { ...state, reports: [...state.reports, action.payload] };
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_REPORT':
      return {
        ...state,
        reports: state.reports.filter(r => r.id !== action.payload),
      };
    case 'ADD_RATED_COMMENT':
      return {
        ...state,
        savedRatedComments: [...state.savedRatedComments, action.payload],
      };
    case 'UPDATE_RATED_COMMENT':
      return {
        ...state,
        savedRatedComments: state.savedRatedComments.map(comment =>
          comment.name === action.payload.name ? action.payload : comment
        ),
      };
    case 'DELETE_RATED_COMMENT':
      return {
        ...state,
        savedRatedComments: state.savedRatedComments.filter(
          comment => comment.name !== action.payload
        ),
      };
    case 'ADD_STANDARD_COMMENT':
      return {
        ...state,
        savedStandardComments: [...state.savedStandardComments, action.payload],
      };
    case 'UPDATE_STANDARD_COMMENT':
      return {
        ...state,
        savedStandardComments: state.savedStandardComments.map(comment =>
          comment.name === action.payload.name ? action.payload : comment
        ),
      };
    case 'DELETE_STANDARD_COMMENT':
      return {
        ...state,
        savedStandardComments: state.savedStandardComments.filter(
          comment => comment.name !== action.payload
        ),
      };
    case 'ADD_ASSESSMENT_COMMENT':
      return {
        ...state,
        savedAssessmentComments: [...state.savedAssessmentComments, action.payload],
      };
    case 'UPDATE_ASSESSMENT_COMMENT':
      return {
        ...state,
        savedAssessmentComments: state.savedAssessmentComments.map(comment =>
          comment.name === action.payload.name ? action.payload : comment
        ),
      };
    case 'DELETE_ASSESSMENT_COMMENT':
      return {
        ...state,
        savedAssessmentComments: state.savedAssessmentComments.filter(
          comment => comment.name !== action.payload
        ),
      };
    case 'ADD_PERSONALISED_COMMENT':
      return {
        ...state,
        savedPersonalisedComments: [...state.savedPersonalisedComments, action.payload],
      };
    case 'UPDATE_PERSONALISED_COMMENT':
      return {
        ...state,
        savedPersonalisedComments: state.savedPersonalisedComments.map(comment =>
          comment.name === action.payload.name ? action.payload : comment
        ),
      };
    case 'DELETE_PERSONALISED_COMMENT':
      return {
        ...state,
        savedPersonalisedComments: state.savedPersonalisedComments.filter(
          comment => comment.name !== action.payload
        ),
      };
    case 'ADD_NEXT_STEPS_COMMENT':
      return {
        ...state,
        savedNextStepsComments: [...state.savedNextStepsComments, action.payload],
      };
    case 'UPDATE_NEXT_STEPS_COMMENT':
      return {
        ...state,
        savedNextStepsComments: state.savedNextStepsComments.map(comment =>
          comment.name === action.payload.name ? action.payload : comment
        ),
      };
    case 'DELETE_NEXT_STEPS_COMMENT':
      return {
        ...state,
        savedNextStepsComments: state.savedNextStepsComments.filter(
          comment => comment.name !== action.payload
        ),
      };
    default:
      return state;
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { user } = useAuth();

  // Load data from localStorage on mount and when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      loadLocalData();
    }
  }, [user]);

  // Save to localStorage when data changes (but avoid triggering infinite sync)
  useEffect(() => {
    if (!state.isLoading && !state.isSyncing) {
      const dataToSave = {
        templates: state.templates,
        classes: state.classes,
        reports: state.reports,
        savedRatedComments: state.savedRatedComments,
        savedStandardComments: state.savedStandardComments,
        savedAssessmentComments: state.savedAssessmentComments,
        savedPersonalisedComments: state.savedPersonalisedComments,
        savedNextStepsComments: state.savedNextStepsComments,
      };
      
      localStorage.setItem('reportGeneratorData', JSON.stringify(dataToSave));
      dispatch({ type: 'SET_LAST_LOCAL_SAVE', payload: new Date() });
      
      // Only sync to cloud if it's been more than 2 seconds since last sync
      // This prevents infinite sync loops
      const now = new Date();
      const timeSinceLastSync = state.lastSyncTime ? now.getTime() - state.lastSyncTime.getTime() : Infinity;
      
      if (user && timeSinceLastSync > 2000 && (dataToSave.templates.length > 0 || dataToSave.classes.length > 0 || dataToSave.reports.length > 0)) {
        console.log('Data changed and enough time passed - syncing to cloud');
        syncToCloud();
      }
    }
  }, [state.templates, state.classes, state.reports, state.savedRatedComments, state.savedStandardComments, state.savedAssessmentComments, state.savedPersonalisedComments, state.savedNextStepsComments, user, state.isLoading, state.isSyncing]);

  // Get user ID for data storage
  const getUserId = () => {
    return user ? `admin-test-2024-reportgenerator-com` : 'anonymous-user';
  };

  // Cloud sync functions
  const syncFromCloud = async () => {
    const userId = getUserId();
    if (!userId || userId === 'anonymous-user') return;

    try {
      console.log('Syncing from cloud for user:', userId);
      dispatch({ type: 'SET_SYNCING', payload: true });

      const [cloudTemplates, cloudClasses, cloudReports] = await Promise.all([
        supabaseOperations.getTemplates(userId),
        supabaseOperations.getClasses(userId),
        supabaseOperations.getReports(userId)
      ]);

      console.log('Loaded from cloud - Templates:', cloudTemplates.length, 'Classes:', cloudClasses.length, 'Reports:', cloudReports.length);

      dispatch({ type: 'LOAD_DATA', payload: {
        templates: cloudTemplates || [],
        classes: cloudClasses || [],
        reports: cloudReports || [],
      }});

      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date() });
      
    } catch (error) {
      console.error('Error syncing from cloud:', error);
      loadLocalData();
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const syncToCloud = async () => {
    const userId = getUserId();
    if (!userId || userId === 'anonymous-user' || state.isSyncing) return;

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
      
      // First load from localStorage for immediate display
      loadLocalData();
      
      // Then sync from cloud
      await syncFromCloud();
      
    } catch (error) {
      console.error('Error loading data:', error);
      loadLocalData();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadLocalData = () => {
    try {
      const savedData = localStorage.getItem('reportGeneratorData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: {
          templates: parsedData.templates || [],
          classes: parsedData.classes || [],
          reports: parsedData.reports || [],
          savedRatedComments: parsedData.savedRatedComments || [],
          savedStandardComments: parsedData.savedStandardComments || [],
          savedAssessmentComments: parsedData.savedAssessmentComments || [],
          savedPersonalisedComments: parsedData.savedPersonalisedComments || [],
          savedNextStepsComments: parsedData.savedNextStepsComments || [],
        }});
        console.log('Data loaded from localStorage successfully');
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // Template functions
  const addTemplate = (templateData: Omit<Template, 'id' | 'createdAt'>) => {
    const template: Template = {
      ...templateData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_TEMPLATE', payload: template });
  };

  const updateTemplate = (template: Template) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
  };

  const deleteTemplate = (id: string) => {
    dispatch({ type: 'DELETE_TEMPLATE', payload: id });
  };

  // Class functions
  const addClass = (classData: Omit<Class, 'id' | 'createdAt'>) => {
    const cls: Class = {
      ...classData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CLASS', payload: cls });
  };

  const updateClass = (cls: Class) => {
    dispatch({ type: 'UPDATE_CLASS', payload: cls });
  };

  const deleteClass = (id: string) => {
    dispatch({ type: 'DELETE_CLASS', payload: id });
  };

  // Report functions
  const addReport = (reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    const report: Report = {
      ...reportData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_REPORT', payload: report });
  };

  const updateReport = (report: Report) => {
    const updatedReport = {
      ...report,
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_REPORT', payload: updatedReport });
  };

  const deleteReport = (id: string) => {
    dispatch({ type: 'DELETE_REPORT', payload: id });
  };

  const saveReport = (reportData: any) => {
    const existingReport = state.reports.find(
      r => r.studentId === reportData.studentId && r.templateId === reportData.templateId
    );

    if (existingReport) {
      updateReport({ ...existingReport, ...reportData });
    } else {
      addReport(reportData);
    }
  };

  const getReport = (studentId: string, templateId: string): Report | undefined => {
    return state.reports.find(
      r => r.studentId === studentId && r.templateId === templateId
    );
  };

  // Comment functions
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

  // Test data function
  const createTestData = () => {
    console.log('Test data creation called');
  };

  // Manual sync function
  const syncData = async () => {
    if (user) {
      await syncFromCloud();
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