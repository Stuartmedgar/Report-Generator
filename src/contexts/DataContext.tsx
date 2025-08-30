import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Template, Class, Report, RatedComment, StandardComment, AssessmentComment, PersonalisedComment, NextStepsComment } from '../types';

interface DataState {
  templates: Template[];
  classes: Class[];
  reports: Report[];
  savedRatedComments: RatedComment[];
  savedStandardComments: StandardComment[];
  savedAssessmentComments: AssessmentComment[];
  savedPersonalisedComments: PersonalisedComment[];
  savedNextStepsComments: NextStepsComment[];
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
  | { type: 'LOAD_DATA'; payload: DataState };

const initialState: DataState = {
  templates: [],
  classes: [],
  reports: [],
  savedRatedComments: [],
  savedStandardComments: [],
  savedAssessmentComments: [],
  savedPersonalisedComments: [],
  savedNextStepsComments: []
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
        // Also delete all reports for this class
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
    
    default:
      return state;
  }
}

interface DataContextType {
  state: DataState;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  updateTemplate: (template: Template) => void;
  deleteTemplate: (id: string) => void;
  addClass: (classData: Omit<Class, 'id' | 'createdAt'>) => void;
  updateClass: (classData: Class) => void;
  deleteClass: (id: string) => void;
  addReport: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReport: (report: Report) => void;
  deleteReport: (id: string) => void;
  saveReport: (reportData: any) => void;
  getReport: (studentId: string, templateId: string) => any;
  createTestData: () => void;
  addRatedComment: (ratedComment: RatedComment) => void;
  updateRatedComment: (ratedComment: RatedComment) => void;
  deleteRatedComment: (name: string) => void;
  addStandardComment: (standardComment: StandardComment) => void;
  updateStandardComment: (standardComment: StandardComment) => void;
  deleteStandardComment: (name: string) => void;
  addAssessmentComment: (assessmentComment: AssessmentComment) => void;
  updateAssessmentComment: (assessmentComment: AssessmentComment) => void;
  deleteAssessmentComment: (name: string) => void;
  addPersonalisedComment: (personalisedComment: PersonalisedComment) => void;
  updatePersonalisedComment: (personalisedComment: PersonalisedComment) => void;
  deletePersonalisedComment: (name: string) => void;
  addNextStepsComment: (nextStepsComment: NextStepsComment) => void;
  updateNextStepsComment: (nextStepsComment: NextStepsComment) => void;
  deleteNextStepsComment: (name: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Load data from localStorage on startup
  useEffect(() => {
    const savedData = localStorage.getItem('reportGeneratorData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Add missing fields if they don't exist (for existing users)
        if (!parsedData.savedNextStepsComments) {
          parsedData.savedNextStepsComments = [];
        }
        if (!parsedData.classes) {
          parsedData.classes = [];
        }
        if (!parsedData.reports) {
          parsedData.reports = [];
        }
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('reportGeneratorData', JSON.stringify(state));
  }, [state]);

  const addTemplate = (templateData: Omit<Template, 'id' | 'createdAt'>) => {
    const template: Template = {
      ...templateData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_TEMPLATE', payload: template });
  };

  const updateTemplate = (template: Template) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
  };

  const deleteTemplate = (id: string) => {
    dispatch({ type: 'DELETE_TEMPLATE', payload: id });
  };

  const addClass = (classData: Omit<Class, 'id' | 'createdAt'>) => {
    const newClass: Class = {
      ...classData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_CLASS', payload: newClass });
  };

  const updateClass = (classData: Class) => {
    dispatch({ type: 'UPDATE_CLASS', payload: classData });
  };

  const deleteClass = (id: string) => {
    dispatch({ type: 'DELETE_CLASS', payload: id });
  };

  const addReport = (reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    const report: Report = {
      ...reportData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_REPORT', payload: report });
  };

  const updateReport = (report: Report) => {
    const updatedReport = {
      ...report,
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: 'UPDATE_REPORT', payload: updatedReport });
  };

  const deleteReport = (id: string) => {
    dispatch({ type: 'DELETE_REPORT', payload: id });
  };

  // Report save/load methods for ReportWriter
  const saveReport = (reportData: any) => {
    const existingReport = state.reports.find(r => r.id === reportData.id);
    
    if (existingReport) {
      // Update existing report
      const updatedReport: Report = {
        ...existingReport,
        content: reportData.content,
        sectionData: reportData.sectionData,
        updatedAt: new Date().toISOString()
      };
      dispatch({ type: 'UPDATE_REPORT', payload: updatedReport });
    } else {
      // Create new report
      const newReport: Report = {
        id: reportData.id,
        studentId: reportData.studentId,
        templateId: reportData.templateId,
        classId: reportData.classId || '',
        content: reportData.content,
        sectionData: reportData.sectionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_REPORT', payload: newReport });
    }
  };

  const getReport = (studentId: string, templateId: string) => {
    return state.reports.find(r => 
      r.studentId === studentId && r.templateId === templateId
    );
  };

  // Test data generator function
  const createTestData = () => {
    // Create a comprehensive test template with all section types
    const testTemplate = {
      name: "🧪 Test Template - All Sections",
      sections: [
        {
          id: 'rated-1',
          type: 'rated-comment' as const,
          name: 'Class Participation',
          data: {
            ratings: {
              excellent: [
                "[Name] consistently contributes excellent ideas to class discussions.",
                "[Name] demonstrates outstanding engagement in all class activities.",
                "[Name] shows exceptional leadership during group work."
              ],
              good: [
                "[Name] regularly participates in class discussions with good insights.",
                "[Name] shows good engagement in most class activities.",
                "[Name] works well with others during group tasks."
              ],
              satisfactory: [
                "[Name] participates in class discussions when prompted.",
                "[Name] shows satisfactory engagement in class activities.",
                "[Name] cooperates well with classmates."
              ],
              needsImprovement: [
                "[Name] needs to participate more actively in class discussions.",
                "[Name] should show more engagement during class activities.",
                "[Name] would benefit from contributing more to group work."
              ]
            }
          }
        },
        {
          id: 'standard-1',
          type: 'standard-comment' as const,
          name: 'General Progress',
          data: {
            content: "[Name] has made steady progress throughout this term. They have shown good understanding of the key concepts covered and consistently completes work to a satisfactory standard."
          }
        },
        {
          id: 'assessment-1',
          type: 'assessment-comment' as const,
          name: 'Recent Test Results',
          data: {
            scoreType: 'outOf',
            maxScore: 50,
            comments: {
              excellent: [
                "[Name] achieved an excellent score of [Score] demonstrating thorough understanding.",
                "[Name]'s result of [Score] shows outstanding grasp of the material."
              ],
              good: [
                "[Name] achieved a good score of [Score] showing solid understanding.",
                "[Name]'s result of [Score] demonstrates good progress in this area."
              ],
              satisfactory: [
                "[Name] achieved [Score] which meets expectations for this assessment.",
                "[Name]'s score of [Score] shows satisfactory understanding of the topics."
              ],
              needsImprovement: [
                "[Name] scored [Score] and would benefit from additional support in this area.",
                "[Name]'s result of [Score] indicates areas that need more focus."
              ],
              notCompleted: [
                "[Name] was unable to complete this assessment and should arrange to catch up.",
                "This assessment was not completed by [Name] - please see me to arrange makeup."
              ]
            }
          }
        },
        {
          id: 'personalised-1',
          type: 'personalised-comment' as const,
          name: 'Target Grade',
          data: {
            instruction: "Enter the student's target grade for this subject",
            headings: ['Achievable', 'Realistic', 'Aspirational'],
            comments: {
              'Achievable': [
                "[Name] has set an achievable target of [personalised information] and is well positioned to reach this goal with consistent effort.",
                "[Name]'s target grade of [personalised information] is very achievable given their current performance level."
              ],
              'Realistic': [
                "[Name] has set a realistic target of [personalised information]. With continued hard work, this grade is definitely within reach.",
                "[Name]'s target of [personalised information] represents a realistic and motivating goal for them to work towards."
              ],
              'Aspirational': [
                "[Name] has set an aspirational target of [personalised information]. This will require significant effort and dedication to achieve.",
                "[Name]'s ambitious target of [personalised information] shows great motivation, though it will require considerable hard work."
              ]
            }
          }
        },
        {
          id: 'next-steps-1',
          type: 'next-steps' as const,
          name: 'Areas for Development',
          data: {
            headings: ['Study Skills', 'Class Participation', 'Organisation', 'Homework Completion', 'Exam Technique'],
            comments: {
              'Study Skills': [
                "[Name] should focus on developing more effective study techniques for better retention.",
                "[Name] would benefit from creating study schedules and using active learning methods."
              ],
              'Class Participation': [
                "[Name] should aim to contribute more regularly to class discussions.",
                "[Name] would benefit from asking more questions and sharing ideas during lessons."
              ],
              'Organisation': [
                "[Name] needs to work on keeping notes and materials better organised.",
                "[Name] should focus on developing better organisational systems for schoolwork."
              ],
              'Homework Completion': [
                "[Name] should ensure all homework is completed on time to reinforce learning.",
                "[Name] needs to establish a regular homework routine to improve consistency."
              ],
              'Exam Technique': [
                "[Name] should practice exam techniques to better demonstrate their knowledge under timed conditions.",
                "[Name] would benefit from learning strategies for managing time effectively during assessments."
              ]
            }
          }
        },
        {
          id: 'newline-1',
          type: 'new-line' as const,
          name: 'Paragraph Break',
          data: {}
        },
        {
          id: 'optional-1',
          type: 'optional-additional-comment' as const,
          name: 'Additional Comments',
          data: {}
        }
      ]
    };

    // Create a test class with diverse student names
    const testClass = {
      name: "🧪 Test Class 9B",
      students: [
        { id: 'student-1', firstName: 'Emma', lastName: 'Thompson', studentId: '001', email: 'emma.t@school.edu' },
        { id: 'student-2', firstName: 'Liam', lastName: 'Rodriguez', studentId: '002', email: 'liam.r@school.edu' },
        { id: 'student-3', firstName: 'Sophia', lastName: 'Chen', studentId: '003', email: 'sophia.c@school.edu' },
        { id: 'student-4', firstName: 'Noah', lastName: 'Patel', studentId: '004', email: 'noah.p@school.edu' },
        { id: 'student-5', firstName: 'Olivia', lastName: 'Johnson', studentId: '005', email: 'olivia.j@school.edu' },
        { id: 'student-6', firstName: 'Ethan', lastName: 'Williams', studentId: '006', email: 'ethan.w@school.edu' }
      ]
    };

    // Add the test data
    addTemplate(testTemplate);
    addClass(testClass);

    // Show confirmation
    alert('✅ Test data created!\n\n📝 Template: "🧪 Test Template - All Sections"\n👥 Class: "🧪 Test Class 9B" (6 students)\n\nYou can now go to Write Reports to test all section types!');
  };

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
    deleteNextStepsComment
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