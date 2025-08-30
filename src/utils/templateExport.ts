import { TemplateSection } from '../types';
import { getSectionDisplayName } from './templateValidation';

export const exportTemplateToText = (
  templateName: string,
  sections: TemplateSection[],
  validationErrors: string[]
): void => {
  let exportContent = `TEMPLATE EXPORT: ${templateName}\n`;
  exportContent += `Created: ${new Date().toLocaleDateString()}\n`;
  exportContent += `Sections: ${sections.length}\n`;
  exportContent += `\n${'='.repeat(60)}\n\n`;
  
  sections.forEach((section, index) => {
    exportContent += `SECTION ${index + 1}: ${getSectionDisplayName(section.type).toUpperCase()}\n`;
    
    if (section.name && section.type !== 'new-line') {
      exportContent += `Name: ${section.name}\n`;
    }
    
    exportContent += `-`.repeat(40) + '\n';
    
    // Export section-specific content
    switch (section.type) {
      case 'rated-comment':
        const ratedComments = section.data?.comments || section.data?.ratings;
        if (ratedComments) {
          ['excellent', 'good', 'satisfactory', 'needsImprovement'].forEach(level => {
            exportContent += `\n${level.toUpperCase()}:\n`;
            const comments = ratedComments[level] || [];
            comments.forEach((comment: string, i: number) => {
              exportContent += `  ${i + 1}. ${comment}\n`;
            });
          });
        }
        break;
        
      case 'assessment-comment':
        const assessmentComments = section.data?.comments;
        if (assessmentComments) {
          ['excellent', 'good', 'satisfactory', 'needsImprovement', 'notCompleted'].forEach(level => {
            exportContent += `\n${level.toUpperCase()}:\n`;
            const comments = assessmentComments[level] || [];
            comments.forEach((comment: string, i: number) => {
              exportContent += `  ${i + 1}. ${comment}\n`;
            });
          });
        }
        if (section.data?.scoreType) {
          exportContent += `\nScore Type: ${section.data.scoreType}\n`;
          if (section.data.maxScore) {
            exportContent += `Max Score: ${section.data.maxScore}\n`;
          }
        }
        break;
        
      case 'personalised-comment':
        if (section.data?.instruction) {
          exportContent += `\nInstruction: ${section.data.instruction}\n`;
        }
        const categories = section.data?.categories;
        if (categories) {
          Object.entries(categories).forEach(([category, comments]) => {
            exportContent += `\n${category.toUpperCase()}:\n`;
            if (Array.isArray(comments)) {
              comments.forEach((comment: string, i: number) => {
                exportContent += `  ${i + 1}. ${comment}\n`;
              });
            }
          });
        }
        break;
        
      case 'next-steps':
        const focusAreas = section.data?.focusAreas;
        if (focusAreas) {
          Object.entries(focusAreas).forEach(([area, steps]) => {
            exportContent += `\n${area.toUpperCase()}:\n`;
            if (Array.isArray(steps)) {
              steps.forEach((step: string, i: number) => {
                exportContent += `  ${i + 1}. ${step}\n`;
              });
            }
          });
        }
        break;
        
      case 'standard-comment':
        if (section.data?.content) {
          exportContent += `\nContent: ${section.data.content}\n`;
        }
        break;
        
      case 'new-line':
        exportContent += '\n[NEW LINE - Creates spacing in report]\n';
        break;
        
      default:
        exportContent += `\n[${section.type} - Content not exported]\n`;
    }
    
    exportContent += '\n' + '='.repeat(60) + '\n\n';
  });
  
  // Add validation summary
  if (validationErrors.length > 0) {
    exportContent += '\nVALIDATION ISSUES:\n';
    exportContent += '-'.repeat(20) + '\n';
    validationErrors.forEach((error, i) => {
      exportContent += `${i + 1}. ${error}\n`;
    });
  } else {
    exportContent += '\n✅ TEMPLATE VALIDATION: NO ISSUES FOUND\n';
  }
  
  // Download the file
  const blob = new Blob([exportContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${templateName || 'template'}_export.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateSampleReport = (sections: TemplateSection[]): string => {
  let reportContent = '';
  
  sections.forEach((section) => {
    if (section.type === 'new-line') {
      reportContent += '\n\n';
      return;
    }
    
    // Add section header if it has a name and it's not a new-line section
    if (section.name && (section.type as string) !== 'new-line') {
      reportContent += `${section.name}\n`;
    }
    
    // Add sample content based on section type
    switch (section.type) {
      case 'rated-comment':
        const ratedComments = section.data?.comments || section.data?.ratings;
        if (ratedComments?.excellent?.[0]) {
          reportContent += `${ratedComments.excellent[0]}\n\n`;
        } else {
          reportContent += '[Sample comment would appear here]\n\n';
        }
        break;
        
      case 'assessment-comment':
        const assessmentComments = section.data?.comments;
        if (assessmentComments?.excellent?.[0]) {
          reportContent += `${assessmentComments.excellent[0]}\n\n`;
        } else {
          reportContent += '[Sample assessment comment would appear here]\n\n';
        }
        break;
        
      case 'personalised-comment':
        if (section.data?.instruction) {
          reportContent += `${section.data.instruction}\n\n`;
        } else {
          reportContent += '[Personalised comment would appear here]\n\n';
        }
        break;
        
      case 'next-steps':
        const focusAreas = section.data?.focusAreas;
        if (focusAreas) {
          const firstArea = Object.keys(focusAreas)[0];
          if (firstArea && focusAreas[firstArea]?.[0]) {
            reportContent += `${firstArea}: ${focusAreas[firstArea][0]}\n\n`;
          } else {
            reportContent += '[Next steps would appear here]\n\n';
          }
        } else {
          reportContent += '[Next steps would appear here]\n\n';
        }
        break;
        
      case 'standard-comment':
        if (section.data?.content) {
          reportContent += `${section.data.content}\n\n`;
        } else {
          reportContent += '[Standard comment would appear here]\n\n';
        }
        break;
    }
  });
  
  return reportContent;
};