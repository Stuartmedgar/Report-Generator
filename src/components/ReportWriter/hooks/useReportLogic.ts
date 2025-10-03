import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Use ref to track the last student ID to prevent unnecessary resets
  const lastStudentIdRef = useRef<string | null>(null);

  // Initialize section data when student changes - FIXED: Only reset when student actually changes
  useEffect(() => {
    if (currentStudent && currentStudent.id !== lastStudentIdRef.current) {
      lastStudentIdRef.current = currentStudent.id;
      
      const existingReport = getReport(currentStudent.id, template.id);
      if (existingReport?.sectionData) {
        setSectionData(existingReport.sectionData);
        setEditableReportContent(existingReport.content);
      } else {
        const initialData: Record<string, any> = {};
        template.sections.forEach((section: any) => {
          const showHeader = section.data.showHeader !== undefined ?
            section.data.showHeader : false;
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
  }, [currentStudent, template.id, template.sections, getReport, setDynamicSections]);

  // Handle saving the report
  const handleSaveReport = () => {
    const existingReport = getReport(currentStudent.id, template.id);
    
    let reportContent: string;
    let isManuallyEdited = false;
    let manuallyEditedContent: string | undefined;

    if (isPreviewEditing && editableReportContent.trim() !== generateReportContent().trim()) {
      reportContent = editableReportContent;
      isManuallyEdited = true;
      manuallyEditedContent = editableReportContent;
    } else if (existingReport?.isManuallyEdited && existingReport?.manuallyEditedContent) {
      reportContent = existingReport.manuallyEditedContent;
      isManuallyEdited = true;
      manuallyEditedContent = existingReport.manuallyEditedContent;
    } else {
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

  // Update section data and handle comment selection
  const updateSectionData = useCallback((sectionId: string, data: any) => {
    console.log('updateSectionData called:', sectionId, data);
    
    setSectionData((prev: Record<string, any>) => {
      console.log('Previous sectionData:', prev);
      
      const newData = {
        ...prev,
        [sectionId]: { ...prev[sectionId], ...data }
      };

      const section = template.sections.find((s: any) => s.id === sectionId) || 
                     dynamicSections.find((s: any) => s.id === sectionId);

      // Handle rated comments
      if (section?.type === 'rated-comment' && data.rating && data.rating !== 'no-comment') {
        const comments = section.data?.comments?.[data.rating] || section.data?.ratings?.[data.rating];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
          console.log('Selected comment:', comments[randomIndex]);
        }
      }

      // Handle assessment comments
      if (section?.type === 'assessment-comment' && data.performance && data.performance !== 'no-comment') {
        const comments = section.data?.comments?.[data.performance];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
          console.log('Selected assessment comment:', comments[randomIndex]);
        }
      }

      // Handle personalised comments
      if (section?.type === 'personalised-comment' && data.category) {
        const comments = section.data?.categories?.[data.category] || section.data?.comments?.[data.category];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
          console.log('Selected personalised comment:', comments[randomIndex]);
        }
      }

      // Handle next steps
      if (section?.type === 'next-steps' && data.focusArea) {
        const suggestions = section.data?.focusAreas?.[data.focusArea] || section.data?.comments?.[data.focusArea];
        if (suggestions && suggestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          newData[sectionId].selectedSuggestion = suggestions[randomIndex];
          newData[sectionId].selectedSuggestionIndex = randomIndex;
          console.log('Selected next steps suggestion:', suggestions[randomIndex]);
        }
      }

      // Handle qualities - select new quality if quality area is clicked (even if same quality area)
    if (section?.type === 'qualities' && data.qualityArea) {
      const qualities = section.data?.comments?.[data.qualityArea];
      if (qualities && qualities.length > 0) {
        const randomIndex = Math.floor(Math.random() * qualities.length);
        newData[sectionId].selectedQuality = qualities[randomIndex];
        newData[sectionId].selectedQualityIndex = randomIndex;
        console.log('Selected quality:', qualities[randomIndex]);
        }
      }

      console.log('New sectionData after update:', newData);
      return newData;
    });
    setHasUnsavedChanges(true);
  }, [template.sections, dynamicSections]);

  // Get all sections (template + dynamic)
  const getAllSections = useCallback(() => {
    return [...template.sections, ...dynamicSections];
  }, [template.sections, dynamicSections]);

  // Generate report content from section data
  const generateReportContent = useCallback(() => {
    let content = '';
    const allSections = getAllSections();

    allSections.forEach((section: any) => {
      const data = sectionData[section.id] || {};
      const showHeader = data.showHeader !== undefined ? data.showHeader : section.data?.showHeader !== undefined ?
        section.data.showHeader : false;

      switch (section.type) {
        case 'rated-comment':
          if (data.rating && data.rating !== 'no-comment') {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            const processedComment = comment.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedComment + ' ';
          }
          break;

        case 'assessment-comment':
          if (data.performance && data.performance !== 'no-comment') {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }

            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            let processedComment = comment.replace(/\[Name\]/g, currentStudent.firstName);
            
            // FIXED: Replace [Score] placeholder with actual score
            if (data.score !== undefined && data.score !== null) {
              const scoreType = data.scoreType || section.data?.scoreType || 'outOf';
              const maxScore = data.maxScore || section.data?.maxScore || 100;
              
              let scoreText = '';
              if (scoreType === 'percentage') {
                scoreText = `${data.score}%`;
              } else {
                scoreText = `${data.score} out of ${maxScore}`;
              }
              
              processedComment = processedComment.replace(/\[Score\]/g, scoreText);
            }
            
            content += processedComment + ' ';
          }
          break;

        case 'personalised-comment':
          if (data.category) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            let processedComment = comment.replace(/\[Name\]/g, currentStudent.firstName);
            
            // FIXED: Replace personalised information placeholder
            if (data.personalisedInfo && data.personalisedInfo.trim()) {
              processedComment = processedComment.replace(/\[Personal Information\]/gi, data.personalisedInfo);
              processedComment = processedComment.replace(/\[Personalised Information\]/gi, data.personalisedInfo);
              processedComment = processedComment.replace(/\[Information\]/gi, data.personalisedInfo);
            }
            
            content += processedComment + ' ';
          }
          break;

        case 'next-steps':
          if (data.focusArea) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            
            const suggestion = data.customEditedSuggestion || data.selectedSuggestion || '[No suggestion selected]';
            const processedSuggestion = suggestion.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedSuggestion + ' ';
          }
          break;

        case 'qualities':
          if (data.qualityArea) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
    
            const quality = data.customEditedQuality || data.selectedQuality || '[No quality selected]';
            const processedQuality = quality.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedQuality + ' ';
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

        case 'standard-comment':
          const standardContent = data.comment || section.data?.content;
          
          if (standardContent && standardContent.trim()) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
            }
            const processedComment = standardContent.replace(/\[Name\]/g, currentStudent.firstName);
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
  }, [sectionData, currentStudent, getAllSections]);

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