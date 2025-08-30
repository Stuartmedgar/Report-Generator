import { TemplateSection } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateTemplate = (
  templateName: string,
  sections: TemplateSection[]
): ValidationResult => {
  const errors: string[] = [];
  
  // Check template name
  if (!templateName.trim()) {
    errors.push('Template name is required');
  }
  
  // Check if template has sections
  if (sections.length === 0) {
    errors.push('Template must have at least one section');
  }
  
  // Check each section for common issues
  sections.forEach((section, index) => {
    const sectionNum = index + 1;
    
    // Check for section name (except new-line sections)
    if (section.type !== 'new-line' && !section.name?.trim()) {
      errors.push(`Section ${sectionNum} (${getSectionDisplayName(section.type)}) is missing a name`);
    }
    
    // Check rated comments
    if (section.type === 'rated-comment') {
      const comments = section.data?.comments || section.data?.ratings;
      if (!comments) {
        errors.push(`Section ${sectionNum} (${section.name || 'Rated Comment'}) has no comment options`);
      } else {
        const levels = ['excellent', 'good', 'satisfactory', 'needsImprovement'];
        levels.forEach(level => {
          if (!comments[level] || comments[level].length === 0) {
            errors.push(`Section ${sectionNum} (${section.name || 'Rated Comment'}) is missing ${level} comments`);
          }
        });
      }
    }
    
    // Check assessment comments
    if (section.type === 'assessment-comment') {
      const comments = section.data?.comments;
      if (!comments) {
        errors.push(`Section ${sectionNum} (${section.name || 'Assessment Comment'}) has no comment options`);
      } else {
        const levels = ['excellent', 'good', 'satisfactory', 'needsImprovement', 'notCompleted'];
        levels.forEach(level => {
          if (!comments[level] || comments[level].length === 0) {
            errors.push(`Section ${sectionNum} (${section.name || 'Assessment Comment'}) is missing ${level} comments`);
          }
        });
      }
    }
    
    // Check personalised comments
    if (section.type === 'personalised-comment') {
      const categories = section.data?.categories;
      const instruction = section.data?.instruction;
      
      if (!instruction?.trim()) {
        errors.push(`Section ${sectionNum} (${section.name || 'Personalised Comment'}) is missing instruction text`);
      }
      
      if (!categories || Object.keys(categories).length === 0) {
        errors.push(`Section ${sectionNum} (${section.name || 'Personalised Comment'}) has no comment categories`);
      } else {
        Object.entries(categories).forEach(([category, comments]) => {
          if (!Array.isArray(comments) || comments.length === 0) {
            errors.push(`Section ${sectionNum} (${section.name || 'Personalised Comment'}) category "${category}" has no comments`);
          }
        });
      }
    }
    
    // Check next steps
    if (section.type === 'next-steps') {
      const focusAreas = section.data?.focusAreas;
      
      if (!focusAreas || Object.keys(focusAreas).length === 0) {
        errors.push(`Section ${sectionNum} (${section.name || 'Next Steps'}) has no focus areas`);
      } else {
        Object.entries(focusAreas).forEach(([area, steps]) => {
          if (!Array.isArray(steps) || steps.length === 0) {
            errors.push(`Section ${sectionNum} (${section.name || 'Next Steps'}) focus area "${area}" has no steps`);
          }
        });
      }
    }
    
    // Check standard comments
    if (section.type === 'standard-comment') {
      const content = section.data?.content;
      if (!content?.trim()) {
        errors.push(`Section ${sectionNum} (${section.name || 'Standard Comment'}) has no content`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getSectionDisplayName = (type: string): string => {
  const nameMap: Record<string, string> = {
    'rated-comment': 'Rated Comment',
    'standard-comment': 'Standard Comment',
    'assessment-comment': 'Assessment Comment',
    'personalised-comment': 'Personalised Comment',
    'optional-additional-comment': 'Optional Comment',
    'next-steps': 'Next Steps',
    'new-line': 'New Line'
  };
  return nameMap[type] || type;
};

export const getSectionColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'rated-comment': '#3b82f6',
    'standard-comment': '#10b981',
    'assessment-comment': '#8b5cf6',
    'personalised-comment': '#f59e0b',
    'optional-additional-comment': '#ef4444',
    'next-steps': '#06b6d4',
    'new-line': '#6b7280'
  };
  return colorMap[type] || '#6b7280';
};