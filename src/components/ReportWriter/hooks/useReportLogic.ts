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

  // Initialize section data when student changes
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
  }, [currentStudent, template.id, template.sections, getReport, setDynamicSections]);

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

  // Update section data and handle comment selection
  const updateSectionData = useCallback((sectionId: string, data: any) => {
    setSectionData((prev: Record<string, any>) => {
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
        }
      }

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
      const showHeader = data.showHeader !== undefined ? data.showHeader : true;

      // FIXED: Check if section is excluded - if so, skip it completely
      if (data.exclude) {
        console.log(`Section ${section.name} is excluded, skipping`);
        return;
      }

      switch (section.type) {
        case 'rated-comment':
          console.log('Processing rated-comment section');
          console.log('data.rating:', data.rating);
          console.log('data.selectedComment:', data.selectedComment);
          console.log('data.customEditedComment:', data.customEditedComment);

          if (data.rating && data.rating !== 'no-comment') {
            if (showHeader && section.name) {
              content += `${section.name}: `;
              console.log('Added header:', section.name);
            }

            // Use custom edited comment first, then selected comment, then fallback
            let commentToUse = data.customEditedComment || data.selectedComment;
            
            if (commentToUse) {
              let processedComment = commentToUse.replace(/\[Name\]/g, currentStudent.firstName);
              content += processedComment + ' ';
              console.log('Added comment:', processedComment, '(source:', data.customEditedComment ? 'custom edit' : 'selected', ')');
            } else {
              console.log('No comment available, trying fallback');
              // Fallback: try to get from template data
              const comments = section.data?.comments?.[data.rating] || section.data?.ratings?.[data.rating];
              console.log('Fallback comments found:', comments);
              
              if (comments && comments.length > 0) {
                const randomComment = comments[Math.floor(Math.random() * comments.length)];
                let processedComment = randomComment.replace(/\[Name\]/g, currentStudent.firstName);
                content += processedComment + ' ';
                console.log('Added fallback comment:', processedComment);

                // Store for consistency
                data.selectedComment = randomComment;
              }
            }
          } else {
            console.log('No rating selected or rating is no-comment, skipping section');
          }
          break;

        case 'standard-comment':
          console.log('Processing standard-comment section');
          console.log('section.data.content:', section.data?.content);
          console.log('data.comment (user override):', data.comment);
          
          // Add section header if enabled
          if (showHeader && section.name) {
            content += `${section.name}: `;
            console.log('Added header:', section.name);
          }

          const commentText = data.comment || section.data?.content;
          if (commentText) {
            const processedContent = commentText.replace(/\[Name\]/g, currentStudent.firstName);
            content += processedContent + ' ';
            console.log('Added standard content:', processedContent);
          }
          break;

        case 'assessment-comment':
          console.log('Processing assessment-comment section');
          console.log('data.performance:', data.performance);
          console.log('data.selectedComment:', data.selectedComment);
          console.log('data.customEditedComment:', data.customEditedComment);
          console.log('data.score:', data.score);
          console.log('data.scoreType:', data.scoreType);
          console.log('data.maxScore:', data.maxScore);
          
          if (data.performance && data.performance !== 'no-comment') {
            if (showHeader && section.name) {
              content += `${section.name}: `;
              console.log('Added header:', section.name);
            }

            // Use custom edited comment first, then selected comment, then fallback
            let commentToUse = data.customEditedComment || data.selectedComment;
            
            if (commentToUse) {
              let processedComment = commentToUse.replace(/\[Name\]/g, currentStudent.firstName);
              
              // FIXED: Format score based on score type
              if (data.score !== undefined) {
                const currentScoreType = data.scoreType || section.data?.scoreType || 'outOf';
                const currentMaxScore = data.maxScore || section.data?.maxScore || 100;
                
                let formattedScore = '';
                if (currentScoreType === 'percentage') {
                  formattedScore = `${data.score}%`;
                } else {
                  // outOf format
                  formattedScore = `${data.score} out of ${currentMaxScore}`;
                }
                
                processedComment = processedComment.replace(/\[Score\]/g, formattedScore);
                console.log('Formatted score:', formattedScore);
              }
              
              content += processedComment + ' ';
              console.log('Added comment:', processedComment, '(source:', data.customEditedComment ? 'custom edit' : 'selected', ')');
            } else {
              console.log('No comment available, trying fallback');
              // Fallback: try to get from template data
              const comments = section.data?.comments?.[data.performance];
              console.log('Fallback comments found:', comments);
              
              if (comments && comments.length > 0) {
                const randomComment = comments[Math.floor(Math.random() * comments.length)];
                let processedComment = randomComment.replace(/\[Name\]/g, currentStudent.firstName);
                
                // FIXED: Format score in fallback comments too
                if (data.score !== undefined) {
                  const currentScoreType = data.scoreType || section.data?.scoreType || 'outOf';
                  const currentMaxScore = data.maxScore || section.data?.maxScore || 100;
                  
                  let formattedScore = '';
                  if (currentScoreType === 'percentage') {
                    formattedScore = `${data.score}%`;
                  } else {
                    // outOf format
                    formattedScore = `${data.score} out of ${currentMaxScore}`;
                  }
                  
                  processedComment = processedComment.replace(/\[Score\]/g, formattedScore);
                }
                
                content += processedComment + ' ';
                console.log('Added fallback comment:', processedComment);

                // Store for consistency
                data.selectedComment = randomComment;
              }
            }
          } else {
            console.log('No performance selected or performance is no-comment, skipping section');
          }
          break;

        case 'personalised-comment':
          console.log('Processing personalised-comment section');
          console.log('data.category:', data.category);
          console.log('data.selectedComment:', data.selectedComment);
          console.log('data.customEditedComment:', data.customEditedComment);
          console.log('data.personalisedInfo:', data.personalisedInfo);

          if (data.category) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
              console.log('Added header:', section.name);
            }

            // Use custom edited comment first, then selected comment, then fallback
            let commentToUse = data.customEditedComment || data.selectedComment;
            
            if (commentToUse) {
              let processedComment = commentToUse.replace(/\[Name\]/g, currentStudent.firstName);
              
              // FIXED: Replace [personalised information] with the user's input
              if (data.personalisedInfo) {
                processedComment = processedComment.replace(/\[personalised information\]/g, data.personalisedInfo);
              }
              
              content += processedComment + ' ';
              console.log('Added comment:', processedComment, '(source:', data.customEditedComment ? 'custom edit' : 'selected', ')');
            } else {
              console.log('No comment available, trying fallback');
              // Fallback: try to get from template data
              const comments = section.data?.categories?.[data.category] || section.data?.comments?.[data.category];
              console.log('Fallback comments found:', comments);
              
              if (comments && comments.length > 0) {
                const randomComment = comments[Math.floor(Math.random() * comments.length)];
                let processedComment = randomComment.replace(/\[Name\]/g, currentStudent.firstName);
                
                // FIXED: Replace [personalised information] in fallback comments too
                if (data.personalisedInfo) {
                  processedComment = processedComment.replace(/\[personalised information\]/g, data.personalisedInfo);
                }
                
                content += processedComment + ' ';
                console.log('Added fallback comment:', processedComment);

                // Store for consistency
                data.selectedComment = randomComment;
              }
            }
          } else {
            console.log('No category selected, skipping personalised-comment section');
          }
          break;

        case 'next-steps':
          console.log('Processing next-steps section');
          console.log('data.focusArea:', data.focusArea);
          console.log('data.selectedSuggestion:', data.selectedSuggestion);
          console.log('data.customEditedSuggestion:', data.customEditedSuggestion);

          if (data.focusArea) {
            if (showHeader && section.name) {
              content += `${section.name}: `;
              console.log('Added header:', section.name);
            }

            // Use custom edited suggestion first, then selected suggestion
            let suggestionToUse = data.customEditedSuggestion || data.selectedSuggestion;
            
            if (suggestionToUse) {
              let processedSuggestion = suggestionToUse.replace(/\[Name\]/g, currentStudent.firstName);
              content += processedSuggestion + ' ';
              console.log('Added suggestion:', processedSuggestion, '(source:', data.customEditedSuggestion ? 'custom edit' : 'selected', ')');
            }
          } else {
            console.log('No focus area selected, skipping next-steps section');
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