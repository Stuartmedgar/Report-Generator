import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { Template, Class, Student, Report, RatedComment, StandardComment, AssessmentComment, PersonalisedComment, NextStepsComment, QualitiesComment } from '../types';
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
  savedQualitiesComments: QualitiesComment[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

interface DataContextType {
  state: DataState;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => string;
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
  addQualitiesComment: (comment: QualitiesComment) => void;
  updateQualitiesComment: (comment: QualitiesComment) => void;
  deleteQualitiesComment: (name: string) => void;
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
  | { type: 'ADD_QUALITIES_COMMENT'; payload: QualitiesComment }
  | { type: 'UPDATE_QUALITIES_COMMENT'; payload: QualitiesComment }
  | { type: 'DELETE_QUALITIES_COMMENT'; payload: string }
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
  savedQualitiesComments: [],
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

    case 'ADD_QUALITIES_COMMENT':
      return { ...state, savedQualitiesComments: [...state.savedQualitiesComments, action.payload] };

    case 'UPDATE_QUALITIES_COMMENT':
      return {
        ...state,
        savedQualitiesComments: state.savedQualitiesComments.map(qc =>
          qc.name === action.payload.name ? action.payload : qc
        )
      };

    case 'DELETE_QUALITIES_COMMENT':
      return {
        ...state,
        savedQualitiesComments: state.savedQualitiesComments.filter(qc => qc.name !== action.payload)
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

  // Track whether we're in the middle of initial load to prevent premature saves
  const isInitialLoadRef = useRef(true);
  // Ref to debounce cloud sync without causing re-renders
  const cloudSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user ID with fallback
  const getUserId = () => {
    return user?.id || user?.email || `admin-test-2024-reportgenerator-com`;
  };

  // Generate user-specific localStorage keys
  const getStorageKey = (key: string) => {
    const userId = getUserId();
    return `${key}_${userId}`;
  };

  // ─── CLOUD SYNC ───────────────────────────────────────────────────────────

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

      console.log(`Loaded from cloud - Templates: ${cloudTemplates.length}, Classes: ${cloudClasses.length}, Reports: ${cloudReports.length}`);

      if (cloudTemplates.length > 0 || cloudClasses.length > 0 || cloudReports.length > 0) {
        // Merge cloud data into current state (keep comment banks from local)
        dispatch({
          type: 'LOAD_DATA',
          payload: {
            ...state,
            templates: cloudTemplates,
            classes: cloudClasses,
            reports: cloudReports,
            isLoading: false,
            isSyncing: false,
            lastSyncTime: new Date()
          }
        });
      } else {
        console.log('No cloud data found, keeping local data');
        dispatch({ type: 'SET_SYNCING', payload: false });
      }
    } catch (error) {
      console.error('Error syncing from cloud:', error);
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  const syncToCloud = async (currentState: DataState) => {
    const userId = getUserId();
    if (!userId || userId === 'anonymous-user') return;

    if (
      currentState.templates.length === 0 &&
      currentState.classes.length === 0 &&
      currentState.reports.length === 0
    ) {
      console.log('No data to sync to cloud');
      return;
    }

    try {
      console.log('Syncing to cloud for user:', userId);
      // Note: we do NOT dispatch SET_SYNCING here to avoid triggering the save useEffect
      await Promise.all([
        supabaseOperations.saveTemplates(userId, currentState.templates),
        supabaseOperations.saveClasses(userId, currentState.classes),
        supabaseOperations.saveReports(userId, currentState.reports)
      ]);
      console.log('Synced to cloud successfully');
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date() });
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  };

  // ─── LOAD DATA ────────────────────────────────────────────────────────────

  const loadLocalData = () => {
    try {
      console.log('Loading data from localStorage...');

      const savedTemplates = localStorage.getItem(getStorageKey('reportTemplates'));
      const savedClasses = localStorage.getItem(getStorageKey('reportClasses'));
      const savedReports = localStorage.getItem(getStorageKey('reportReports'));
      const savedRatedComments = localStorage.getItem(getStorageKey('savedRatedComments'));
      const savedStandardComments = localStorage.getItem(getStorageKey('savedStandardComments'));
      const savedAssessmentComments = localStorage.getItem(getStorageKey('savedAssessmentComments'));
      const savedPersonalisedComments = localStorage.getItem(getStorageKey('savedPersonalisedComments'));
      const savedNextStepsComments = localStorage.getItem(getStorageKey('savedNextStepsComments'));
      const savedQualitiesComments = localStorage.getItem(getStorageKey('savedQualitiesComments'));

      const loadedState: DataState = {
        templates: savedTemplates ? JSON.parse(savedTemplates) : [],
        classes: savedClasses ? JSON.parse(savedClasses) : [],
        reports: savedReports ? JSON.parse(savedReports) : [],
        savedRatedComments: savedRatedComments ? JSON.parse(savedRatedComments) : [],
        savedStandardComments: savedStandardComments ? JSON.parse(savedStandardComments) : [],
        savedAssessmentComments: savedAssessmentComments ? JSON.parse(savedAssessmentComments) : [],
        savedPersonalisedComments: savedPersonalisedComments ? JSON.parse(savedPersonalisedComments) : [],
        savedNextStepsComments: savedNextStepsComments ? JSON.parse(savedNextStepsComments) : [],
        savedQualitiesComments: savedQualitiesComments ? JSON.parse(savedQualitiesComments) : [],
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

  const loadAllData = async () => {
    try {
      isInitialLoadRef.current = true;
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
      // Allow saves after initial load completes
      isInitialLoadRef.current = false;
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── SAVE TO LOCALSTORAGE (always, immediately) ───────────────────────────
  //
  // KEY FIX: This effect no longer checks isSyncing. It saves on every
  // meaningful data change. We skip only during the very first load so we
  // don't overwrite existing localStorage with empty arrays.
  //
  useEffect(() => {
    // Don't save while the initial load is still running
    if (state.isLoading) return;

    console.log(`Saving to localStorage - Templates: ${state.templates.length}, Classes: ${state.classes.length}, Reports: ${state.reports.length}`);

    localStorage.setItem(getStorageKey('reportTemplates'), JSON.stringify(state.templates));
    localStorage.setItem(getStorageKey('reportClasses'), JSON.stringify(state.classes));
    localStorage.setItem(getStorageKey('reportReports'), JSON.stringify(state.reports));
    localStorage.setItem(getStorageKey('savedRatedComments'), JSON.stringify(state.savedRatedComments));
    localStorage.setItem(getStorageKey('savedStandardComments'), JSON.stringify(state.savedStandardComments));
    localStorage.setItem(getStorageKey('savedAssessmentComments'), JSON.stringify(state.savedAssessmentComments));
    localStorage.setItem(getStorageKey('savedPersonalisedComments'), JSON.stringify(state.savedPersonalisedComments));
    localStorage.setItem(getStorageKey('savedNextStepsComments'), JSON.stringify(state.savedNextStepsComments));
    localStorage.setItem(getStorageKey('savedQualitiesComments'), JSON.stringify(state.savedQualitiesComments));

    // Debounce cloud sync separately — pass current state snapshot via ref
    // so the timeout always sees the latest data, and changing isSyncing
    // doesn't re-trigger this effect.
    if (user && !state.isSyncing) {
      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }
      const snapshot = state; // capture current state for the closure
      cloudSyncTimerRef.current = setTimeout(() => {
        syncToCloud(snapshot);
      }, 3000);
    }

    return () => {
      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.templates,
    state.classes,
    state.reports,
    state.savedRatedComments,
    state.savedStandardComments,
    state.savedAssessmentComments,
    state.savedPersonalisedComments,
    state.savedNextStepsComments,
    state.savedQualitiesComments,
    state.isLoading
  ]);

  // ─── CRUD OPERATIONS ──────────────────────────────────────────────────────

  const addTemplate = (template: Omit<Template, 'id' | 'createdAt'>): string => {
    const newTemplate: Template = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    console.log('Adding template:', newTemplate.name);
    dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
    return newTemplate.id;
  };

  const updateTemplate = (template: Template) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
  };

  const deleteTemplate = (id: string) => {
    dispatch({ type: 'DELETE_TEMPLATE', payload: id });
  };

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
    dispatch({ type: 'UPDATE_REPORT', payload: { ...report, updatedAt: new Date().toISOString() } });
  };

  const deleteReport = (id: string) => {
    dispatch({ type: 'DELETE_REPORT', payload: id });
  };

  const saveReport = (reportData: any) => {
    const existingReport = state.reports.find(
      r => r.studentId === reportData.studentId && r.templateId === reportData.templateId
    );

    if (existingReport) {
      updateReport({ ...existingReport, ...reportData, updatedAt: new Date().toISOString() });
    } else {
      addReport(reportData);
    }
  };

  const getReport = (studentId: string, templateId: string) => {
    return state.reports.find(r => r.studentId === studentId && r.templateId === templateId);
  };

  const createTestData = () => {
    console.log('createTestData called');
  };

  // Comment bank operations
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

  const addQualitiesComment = (comment: QualitiesComment) => {
    dispatch({ type: 'ADD_QUALITIES_COMMENT', payload: comment });
  };
  const updateQualitiesComment = (comment: QualitiesComment) => {
    dispatch({ type: 'UPDATE_QUALITIES_COMMENT', payload: comment });
  };
  const deleteQualitiesComment = (name: string) => {
    dispatch({ type: 'DELETE_QUALITIES_COMMENT', payload: name });
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
      addQualitiesComment,
      updateQualitiesComment,
      deleteQualitiesComment,
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