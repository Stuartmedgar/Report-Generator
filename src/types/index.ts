// Template types
export interface Template {
  id: string;
  name: string;
  sections: TemplateSection[];
  createdAt: string;
}

export interface TemplateSection {
  id: string;
  type: SectionType;
  name?: string;
  data: any;
}

export type SectionType = 
  | 'rated-comment'
  | 'standard-comment'
  | 'assessment-comment'
  | 'personalised-comment'
  | 'optional-additional-comment'
  | 'next-steps'
  | 'new-line';

// Rated Comment types
export interface RatedComment {
  name: string;
  comments: {
    excellent: string[];
    good: string[];
    satisfactory: string[];
    needsImprovement: string[];
  };
}

// Standard Comment types
export interface StandardComment {
  name: string;
  comment: string;
}

// Assessment Comment types
export interface AssessmentComment {
  name: string;
  scoreType: 'outOf' | 'percentage';
  maxScore?: number;
  comments: {
    excellent: string[];
    good: string[];
    satisfactory: string[];
    needsImprovement: string[];
    notCompleted: string[];
  };
}

// Personalised Comment types
export interface PersonalisedComment {
  name: string;
  instruction: string;
  headings?: string[];
  comments: { [heading: string]: string[] };
}

// Next Steps types
export interface NextStepsComment {
  name: string;
  headings: string[];
  comments: { [heading: string]: string[] };
}

// Student and Class types
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId?: string;  // Optional
  email?: string;      // Optional
}

export interface Class {
  id: string;
  name: string;
  students: Student[];
  createdAt: string;
}

// Report types
export interface Report {
  id: string;
  studentId: string;
  templateId: string;
  classId: string;
  content: string;
  sectionData?: Record<string, any>;  // Added this for saving form state
  createdAt: string;
  updatedAt: string;
}