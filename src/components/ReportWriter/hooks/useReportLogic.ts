import { useState, useEffect, useCallback } from 'react';
import { useData } from '../../../contexts/DataContext';

interface UseReportLogicParams {
  template: any;
  classData: any;
  currentStudent: any;
  dynamicSections: any[];
  setDynamicSections: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useReportLogic = ({
  template,
  classData,
  currentStudent,
  dynamicSections,
  setDynamicSections
}: UseReportLogicParams) => {
  const { addReport, updateReport, getReport, addTemplate } = useData();
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewEditing, setIsPreviewEditing] = useState(false);
  const [editableReportContent, setEditableReportContent] = useState('');

  // Initialize section data when student changes - FIXED: Removed template.sections from dependencies
  useEffect(() => {
    if (currentStudent) {
      const existingReport = getReport(currentStudent.id, template.id);
      if (existingReport?.sectionData) {
        setSectionData(existingReport.sectionData);
        setEditableReportContent(existingReport.content);
      } else {
        const initialData: Record<string, any> = {};
        template.sections.forEach((section: any) => {
          const showHeader = section.data.showHeader !== undefined ?
            section.data.showHeader : true;
          initialData[section.id] = { 
            showHeader,
            ...section.data 
          };
        });
        setSectionData(initialData);
        setEditableReportContent('');
        setIsPreviewEditing(false);
        setDynamicSections([]);
      }
      setHasUnsavedChanges(false);
    }
  }, [currentStudent, template.id, getReport, setDynamicSections]); // FIXED: Removed template.sections

  // Handle saving the report
  const handleSaveReport = () => {
    // Check if we have manually edited content that should take precedence
    const existingReport = getReport(currentStudent.id, template.id);
    
    // Determine the correct content to save
    let reportContent: string;
    let isManuallyEdited = false;
    let manuallyEditedContent: string | undefined;

    if (isPreviewEditing && editableReportContent.trim() !== generateReportContent().trim()) {
      // User is currently editing preview and has made changes
      reportContent = editableReportContent;
      isManuallyEdited = true;
      manuallyEditedContent = editableReportContent;
    } else if (existingReport?.isManuallyEdited && existingReport?.manuallyEditedContent) {
      // Preserve existing manual edits
      reportContent = existingReport.manuallyEditedContent;
      isManuallyEdited = true;
      manuallyEditedContent = existingReport.manuallyEditedContent;
    } else {
      // Use generated content
      reportContent = generateReportContent();
      isManuallyEdited = false;
      manuallyEditedContent = undefined;
    }

    const reportData = {
      id: existingReport?.id || `${currentStudent.id}-${template.id}-${Date.now()}`,
      studentId: currentStudent.id,
      templateId: template.id,
      classId: classData.id,
      content: reportContent,
      sectionData: sectionData,
      isManuallyEdited: isManuallyEdited,
      manuallyEditedContent: manuallyEditedContent,
      createdAt: existingReport?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingReport) {
      updateReport(reportData);
    } else {
      addReport(reportData);
    }

    setHasUnsavedChanges(false);
    alert('Report saved successfully!');
  };

  // Update section data and handle comment selection - FIXED: Added debugging
  const updateSectionData = useCallback((sectionId: string, data: any) => {
    console.log('updateSectionData called:', sectionId, data); // DEBUG: Add this line
    
    setSectionData((prev: Record<string, any>) => {
      console.log('Previous sectionData:', prev); // DEBUG: Add this line
      
      const newData = {
        ...prev,
        [sectionId]: { ...prev[sectionId], ...data }
      };

      const section = template.sections.find((s: any) => s.id === sectionId) || 
                     dynamicSections.find((s: any) => s.id === sectionId);

      // Handle rated comments - select new comment if rating is clicked (even if same rating)
      if (section?.type === 'rated-comment' && data.rating && data.rating !== 'no-comment') {
        const comments = section.data?.comments?.[data.rating] || section.data?.ratings?.[data.rating];
        if (comments && comments.length > 0) {
          // Always select a new random comment when rating is clicked
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
          console.log('Selected comment:', comments[randomIndex]); // DEBUG: Add this line
        }
      }

      // Handle assessment comments - select new comment if performance is clicked (even if same performance)
      if (section?.type === 'assessment-comment' && data.performance && data.performance !== 'no-comment') {
        const comments = section.data?.comments?.[data.performance];
        if (comments && comments.length > 0) {
          // Always select a new random comment when performance is clicked
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
          console.log('Selected assessment comment:', comments[randomIndex]); // DEBUG: Add this line
        }
      }

      // Handle personalised comments - select new comment if category is clicked (even if same category)
      if (section?.type === 'personalised-comment' && data.category) {
        const comments = section.data?.categories?.[data.category] || section.data?.comments?.[data.category];
        if (comments && comments.length > 0) {
          // Always select a new random comment when category is clicked
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
          console.log('Selected personalised comment:', comments[randomIndex]); // DEBUG: Add this line
        }
      }

      // Handle next steps - select new comment if focus area is clicked (even if same focus area)
      if (section?.type === 'next-steps' && data.focusArea) {
        const suggestions = section.data?.focusAreas?.[data.focusArea] || section.data?.comments?.[data.focusArea];
        if (suggestions && suggestions.length > 0) {
          // Always select a new random suggestion when focus area is clicked
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          newData[sectionId].selectedSuggestion = suggestions[randomIndex];
          newData[sectionId].selectedSuggestionIndex = randomIndex;
          console.log('Selected next steps suggestion:', suggestions[randomIndex]); // DEBUG: Add this line
        }
      }

      console.log('New sectionData after update:', newData); // DEBUG: Add this line
      return newData;
    });
    setHasUnsavedChanges(true);
  }, [template.sections, dynamicSections]);

  // Get all sections (template + dynamic)
  const getAllSections = () => {
    return [...template.sections, ...dynamicSections];
  };

  // Generate report content from section data
  const generateReportContent = () => {
    let content = '';
    const allSections = getAllSections();

    allSections.forEach((section: any) => {
      const data = sectionData[section.id] || {};
      const showHeader = data.showHeader !== undefined ? data.showHeader : section.data?.showHeader !== undefined ? section.data.showHeader : true;

      // Skip excluded sections
      if (data.exclude) {
        return;
      }

      switch (section.type) {
        case 'rated-comment':
          // Only include if we have a rating and it's not 'no-comment'
          if (data.rating && data.rating !== 'no-comment') {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            
            // Use custom edited comment if available, otherwise use selected comment
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            const processedComment = comment.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedComment + ' ';
            console.log('Generated rated comment content:', processedComment); // DEBUG
          }
          break;

        case 'standard-comment':
          if (data.content && data.content.trim()) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            const processedComment = data.content.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedComment + ' ';
          }
          break;

        case 'assessment-comment':
          if (data.performance && data.performance !== 'no-comment') {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            
            // Add score if provided
            if (data.score !== undefined && data.score !== null) {
              if (data.scoreType === 'percentage') {
                content += `${data.score}% - `;
              } else if (data.scoreType === 'outOf' && data.maxScore) {
                content += `${data.score}/${data.maxScore} - `;
              }
            }
            
            // Use custom edited comment if available, otherwise use selected comment
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            const processedComment = comment.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedComment + ' ';
            console.log('Generated assessment comment content:', processedComment); // DEBUG
          }
          break;

        case 'personalised-comment':
          if (data.category) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            
            // Use custom edited comment if available, otherwise use selected comment
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            const processedComment = comment.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedComment + ' ';
            console.log('Generated personalised comment content:', processedComment); // DEBUG
          }
          break;

        case 'next-steps':
          if (data.focusArea) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            
            // Use custom edited suggestion if available, otherwise use selected suggestion
            const suggestion = data.customEditedSuggestion || data.selectedSuggestion || '[No suggestion selected]';
            const processedSuggestion = suggestion.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedSuggestion + ' ';
            console.log('Generated next steps content:', processedSuggestion); // DEBUG
          }
          break;

        case 'optional-additional-comment':
          if (data.comment && data.comment.trim()) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            const processedComment = data.comment.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedComment + ' ';
          }
          break;

        case 'new-line':
          content += '\n\n';
          break;

        default:
          console.log('Unknown section type:', section.type);
      }
    });

    return content.trim();
  };

  // Dynamic section handlers
  const handleAddDynamicSection = (sectionType: string) => {
    const newSection = {
      id: `dynamic-${Date.now()}`,
      type: sectionType,
      name: `New ${sectionType}`,
      data: { showHeader: true }
    };

    setDynamicSections((prev: any[]) => [...prev, newSection]);
    
    setSectionData((prev: Record<string, any>) => ({
      ...prev,
      [newSection.id]: { 
        ...newSection.data,
        showHeader: false
      }
    }));

    setHasUnsavedChanges(true);
  };

  const handleRemoveDynamicSection = (sectionId: string) => {
    setDynamicSections((prev: any[]) => prev.filter(section => section.id !== sectionId));
    setSectionData((prev: Record<string, any>) => {
      const newData = { ...prev };
      delete newData[sectionId];
      return newData;
    });
    setHasUnsavedChanges(true);
  };

  // Save current template as new template
  const handleSaveAsNewTemplate = () => {
    const name = prompt('Enter a name for the new template:');
    if (name) {
      const allSections = getAllSections();
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: name,
        sections: allSections,
        createdAt: new Date().toISOString()
      };
      
      addTemplate(newTemplate);
      alert('Template saved successfully!');
    }
  };

  // Handle preview editing
  const handlePreviewEdit = () => {
    setIsPreviewEditing(true);
    setEditableReportContent(generateReportContent());
  };

  // Save preview edits
  const handleSavePreviewEdit = () => {
    setIsPreviewEditing(false);
    setHasUnsavedChanges(true);
  };

  // Refresh preview with new content (when regenerate is clicked)
  const handleRefreshPreviewWithNewContent = () => {
    setEditableReportContent(generateReportContent());
    setHasUnsavedChanges(true);
  };

  return {
    sectionData,
    setSectionData,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isPreviewEditing,
    setIsPreviewEditing,
    editableReportContent,
    setEditableReportContent,
    updateSectionData,
    generateReportContent,
    getAllSections,
    handleSaveReport,
    handleAddDynamicSection,
    handleRemoveDynamicSection,
    handleSaveAsNewTemplate,
    handlePreviewEdit,
    handleSavePreviewEdit,
    handleRefreshPreviewWithNewContent
  };
};