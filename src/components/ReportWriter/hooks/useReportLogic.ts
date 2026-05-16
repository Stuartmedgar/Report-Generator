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
  const { addReport, updateReport, getReport, addTemplate, updateTemplate } = useData();
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewEditing, setIsPreviewEditing] = useState(false);
  const [editableReportContent, setEditableReportContent] = useState('');

  // Working template — starts as a copy of the loaded template and accumulates
  // changes made during the session. Teachers choose whether to save at the end.
  const [workingTemplate, setWorkingTemplate] = useState<any>(() => ({
    ...template,
    sections: template.sections.map((s: any) => ({ ...s, data: { ...s.data } }))
  }));
  const [hasTemplateChanges, setHasTemplateChanges] = useState(false);

  // Use ref to track the last student ID to prevent unnecessary resets
  const lastStudentIdRef = useRef<string | null>(null);

  // Keep workingTemplate in sync if the underlying template prop changes (e.g. after a save)
  // but only on initial mount — don't overwrite in-session changes
  const templateIdRef = useRef(template.id);
  useEffect(() => {
    if (template.id !== templateIdRef.current) {
      templateIdRef.current = template.id;
      setWorkingTemplate({
        ...template,
        sections: template.sections.map((s: any) => ({ ...s, data: { ...s.data } }))
      });
      setHasTemplateChanges(false);
    }
  }, [template.id]);

  // Initialize section data when student changes
  useEffect(() => {
    if (currentStudent && currentStudent.id !== lastStudentIdRef.current) {
      lastStudentIdRef.current = currentStudent.id;

      const existingReport = getReport(currentStudent.id, template.id);
      if (existingReport?.sectionData) {
        setSectionData(existingReport.sectionData);
        setEditableReportContent(existingReport.content);
      } else {
        const initialData: Record<string, any> = {};
        workingTemplate.sections.forEach((section: any) => {
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
  }, [currentStudent, template.id, workingTemplate.sections, getReport, setDynamicSections]);

  // ─── TEMPLATE ACTION HANDLER ──────────────────────────────────────────────
  // Called from section components when a teacher wants to modify the template
  // during a report-writing session. Updates workingTemplate in memory.
  // The original saved template is untouched until the teacher confirms at the end.

  const handleTemplateAction = useCallback((action: {
    type: 'replace' | 'add-to-button' | 'add-to-new-button';
    sectionId: string;
    commentText: string;
    buttonName?: string;   // for add-to-button: which button to add under
    newButtonName?: string; // for add-to-new-button: name of the new button
  }) => {
    setWorkingTemplate((prev: any) => {
      const updatedSections = prev.sections.map((section: any) => {
        if (section.id !== action.sectionId) return section;

        const newData = { ...section.data };

        if (section.type === 'standard-comment' && action.type === 'replace') {
          newData.content = action.commentText;
        }

        if (section.type === 'qualities') {
          const comments = { ...newData.comments };
          if (action.type === 'replace' && action.buttonName) {
            // Replace the specific option that was selected — find it by matching selectedQuality
            const options = [...(comments[action.buttonName] || [])];
            const idx = options.indexOf(action.buttonName);
            // Replace first occurrence or append if not found
            const replaceIdx = options.findIndex(o => o === action.commentText) === -1
              ? 0 : options.findIndex(o => o === action.commentText);
            options[replaceIdx] = action.commentText;
            comments[action.buttonName] = options;
          } else if (action.type === 'add-to-button' && action.buttonName) {
            comments[action.buttonName] = [...(comments[action.buttonName] || []), action.commentText];
          } else if (action.type === 'add-to-new-button' && action.newButtonName) {
            comments[action.newButtonName] = [action.commentText];
          }
          newData.comments = comments;
        }

        if (section.type === 'next-steps') {
          const focusAreas = { ...newData.focusAreas };
          if (action.type === 'replace' && action.buttonName) {
            const options = [...(focusAreas[action.buttonName] || [])];
            options[0] = action.commentText;
            focusAreas[action.buttonName] = options;
          } else if (action.type === 'add-to-button' && action.buttonName) {
            focusAreas[action.buttonName] = [...(focusAreas[action.buttonName] || []), action.commentText];
          } else if (action.type === 'add-to-new-button' && action.newButtonName) {
            focusAreas[action.newButtonName] = [action.commentText];
          }
          newData.focusAreas = focusAreas;
        }

        if (section.type === 'personalised-comment') {
          const categories = { ...newData.categories };
          if (action.type === 'replace' && action.buttonName) {
            const options = [...(categories[action.buttonName] || [])];
            options[0] = action.commentText;
            categories[action.buttonName] = options;
          } else if (action.type === 'add-to-button' && action.buttonName) {
            categories[action.buttonName] = [...(categories[action.buttonName] || []), action.commentText];
          } else if (action.type === 'add-to-new-button' && action.newButtonName) {
            categories[action.newButtonName] = [action.commentText];
          }
          newData.categories = categories;
        }

        if (section.type === 'rated-comment') {
          const comments = { ...newData.comments };
          if (action.type === 'replace' && action.buttonName) {
            const options = [...(comments[action.buttonName] || [])];
            options[0] = action.commentText;
            comments[action.buttonName] = options;
          } else if (action.type === 'add-to-button' && action.buttonName) {
            comments[action.buttonName] = [...(comments[action.buttonName] || []), action.commentText];
          } else if (action.type === 'add-to-new-button' && action.newButtonName) {
            comments[action.newButtonName] = [action.commentText];
          }
          newData.comments = comments;
        }

        return { ...section, data: newData };
      });

      return { ...prev, sections: updatedSections };
    });

    setHasTemplateChanges(true);
  }, []);

  // ─── ADD NEW BUTTON TO SECTION ────────────────────────────────────────────
  // Used by the + button beside headings in qualities/next-steps/personalised sections

  const handleAddButton = useCallback((sectionId: string, buttonName: string, firstOption: string) => {
    setWorkingTemplate((prev: any) => {
      const updatedSections = prev.sections.map((section: any) => {
        if (section.id !== sectionId) return section;
        const newData = { ...section.data };

        if (section.type === 'qualities') {
          newData.comments = { ...newData.comments, [buttonName]: [firstOption] };
        } else if (section.type === 'next-steps') {
          newData.focusAreas = { ...newData.focusAreas, [buttonName]: [firstOption] };
        } else if (section.type === 'personalised-comment') {
          newData.categories = { ...newData.categories, [buttonName]: [firstOption] };
        }

        return { ...section, data: newData };
      });
      return { ...prev, sections: updatedSections };
    });
    setHasTemplateChanges(true);
  }, []);

  // ─── DUPLICATE SECTION ────────────────────────────────────────────────────

  const handleDuplicateSection = useCallback((sectionId: string) => {
    setWorkingTemplate((prev: any) => {
      const idx = prev.sections.findIndex((s: any) => s.id === sectionId);
      if (idx === -1) return prev;
      const original = prev.sections[idx];
      const duplicate = {
        ...original,
        id: `${original.id}_copy_${Date.now()}`,
        name: `${original.name} (copy)`,
        data: JSON.parse(JSON.stringify(original.data))
      };
      const updatedSections = [...prev.sections];
      updatedSections.splice(idx + 1, 0, duplicate);
      return { ...prev, sections: updatedSections };
    });
    setHasTemplateChanges(true);
  }, []);

  // ─── SAVE WORKING TEMPLATE ────────────────────────────────────────────────
  // Called at end of session if teacher wants to persist changes

  const handleSaveWorkingTemplate = useCallback(async () => {
    try {
      await updateTemplate(workingTemplate);
      setHasTemplateChanges(false);
      return true;
    } catch (e) {
      return false;
    }
  }, [workingTemplate, updateTemplate]);

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

      const section = workingTemplate.sections.find((s: any) => s.id === sectionId) ||
        dynamicSections.find((s: any) => s.id === sectionId);

      // Handle rated comments
      if (section?.type === 'rated-comment' && data.rating && data.rating !== 'no-comment') {
        const comments = section.data?.comments?.[data.rating] || section.data?.ratings?.[data.rating];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
        }
      }

      // Handle assessment comments
      if (section?.type === 'assessment-comment' && data.performance && data.performance !== 'no-comment') {
        const comments = section.data?.comments?.[data.performance];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
        }
      }

      // Handle personalised comments
      if (section?.type === 'personalised-comment' && data.category) {
        const comments = section.data?.categories?.[data.category] || section.data?.comments?.[data.category];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
        }
      }

      // Handle next steps
      if (section?.type === 'next-steps' && data.focusArea) {
        const suggestions = section.data?.focusAreas?.[data.focusArea] || section.data?.comments?.[data.focusArea];
        if (suggestions && suggestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          newData[sectionId].selectedSuggestion = suggestions[randomIndex];
          newData[sectionId].selectedSuggestionIndex = randomIndex;
        }
      }

      // Handle qualities
      if (section?.type === 'qualities' && data.qualityArea) {
        const qualities = section.data?.comments?.[data.qualityArea];
        if (qualities && qualities.length > 0) {
          const randomIndex = Math.floor(Math.random() * qualities.length);
          newData[sectionId].selectedQuality = qualities[randomIndex];
          newData[sectionId].selectedQualityIndex = randomIndex;
        }
      }

      console.log('New sectionData after update:', newData);
      return newData;
    });
    setHasUnsavedChanges(true);
  }, [workingTemplate.sections, dynamicSections]);

  // Get all sections correctly interleaved by insertAfter position
  const getAllSections = useCallback(() => {
    const result: any[] = [];
    workingTemplate.sections.forEach((section: any, index: number) => {
      result.push(section);
      const toInsert = dynamicSections.filter((ds: any) => ds.insertAfter === index);
      toInsert.forEach((ds: any) => result.push(ds));
    });
    return result;
  }, [workingTemplate.sections, dynamicSections]);

  // ─── PRONOUN HELPER ───────────────────────────────────────────────────────
  // Returns the display name or pronoun for the current student in this section

  const getNameOrPronoun = useCallback((sectionId: string) => {
    const sd = sectionData[sectionId] || {};
    switch (sd.pronounOverride) {
      case 'he': return 'he';
      case 'she': return 'she';
      case 'they': return 'they';
      default: return currentStudent?.firstName || '';
    }
  }, [sectionData, currentStudent]);

  // Generate report content from section data
  const generateReportContent = useCallback(() => {
    let content = '';
    const allSections = getAllSections();

    allSections.forEach((section: any) => {
      const data = sectionData[section.id] || {};

      if (data.exclude) return;

      const showHeader = data.showHeader !== undefined ? data.showHeader :
        section.data?.showHeader !== undefined ? section.data.showHeader : false;

      // Resolve name/pronoun for this section
      const nameToken = getNameOrPronoun(section.id);

      switch (section.type) {
        case 'rated-comment':
          if (data.rating && data.rating !== 'no-comment') {
            if (showHeader && section.name) content += `${section.name}: `;
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            content += comment.replace(/\[Name\]/g, nameToken) + ' ';
          }
          break;

        case 'assessment-comment':
          if (data.performance && data.performance !== 'no-comment') {
            if (showHeader && section.name) content += `${section.name}: `;
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            let processed = comment.replace(/\[Name\]/g, nameToken);
            if (data.score !== undefined && data.score !== null) {
              const scoreType = data.scoreType || section.data?.scoreType || 'outOf';
              const maxScore = data.maxScore || section.data?.maxScore || 100;
              const scoreText = scoreType === 'percentage' ? `${data.score}%` : `${data.score} out of ${maxScore}`;
              processed = processed.replace(/\[Score\]/g, scoreText);
            }
            content += processed + ' ';
          }
          break;

        case 'personalised-comment':
          if (data.category) {
            if (showHeader && section.name) content += `${section.name}: `;
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            let processed = comment.replace(/\[Name\]/g, nameToken);
            const infoValues: Record<string, string> = data.infoValues || {};
            processed = processed.replace(/\[Info (\d+)\]/gi, (_match: string, num: string) => {
              return infoValues[`Info ${num}`] || `[Info ${num}]`;
            });
            if (infoValues['Info 1']) {
              processed = processed.replace(/\[Personal Information\]/gi, infoValues['Info 1']);
              processed = processed.replace(/\[Personalised Information\]/gi, infoValues['Info 1']);
              processed = processed.replace(/\[Information\]/gi, infoValues['Info 1']);
            }
            content += processed + ' ';
          }
          break;

        case 'next-steps':
          if (data.focusArea) {
            if (showHeader && section.name) content += `${section.name}: `;
            const suggestion = data.customEditedSuggestion || data.selectedSuggestion || '[No suggestion selected]';
            content += suggestion.replace(/\[Name\]/g, nameToken) + ' ';
          }
          break;

        case 'qualities':
          if (data.qualityArea) {
            if (showHeader && section.name) content += `${section.name}: `;
            const quality = data.customEditedQuality || data.selectedQuality || '[No quality selected]';
            content += quality.replace(/\[Name\]/g, nameToken) + ' ';
          }
          break;

        case 'optional-additional-comment':
          if (data.comment && data.comment.trim()) {
            if (showHeader && section.name) content += `${section.name}: `;
            content += data.comment.replace(/\[Name\]/g, nameToken) + ' ';
          }
          break;

        case 'standard-comment':
          const standardContent = data.comment || section.data?.content;
          if (standardContent && standardContent.trim()) {
            if (showHeader && section.name) content += `${section.name}: `;
            content += standardContent.replace(/\[Name\]/g, nameToken) + ' ';
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
  }, [sectionData, currentStudent, getAllSections, getNameOrPronoun]);

  // Dynamic section handlers
  const handleAddDynamicSection = (sectionType: string, afterIndex: number = 0) => {
    const newSection = {
      id: `dynamic-${Date.now()}`,
      type: sectionType,
      name: `New ${sectionType}`,
      data: { showHeader: true },
      insertAfter: afterIndex
    };

    setDynamicSections((prev: any[]) => {
      const insertAt = prev.filter(s => s.insertAfter <= afterIndex).length;
      const updated = [...prev];
      updated.splice(insertAt, 0, newSection);
      return updated;
    });

    setSectionData((prev: Record<string, any>) => ({
      ...prev,
      [newSection.id]: { ...newSection.data, showHeader: false }
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

  const handlePreviewEdit = () => {
    setIsPreviewEditing(true);
    setEditableReportContent(generateReportContent());
  };

  const handleSavePreviewEdit = () => {
    setIsPreviewEditing(false);
    setHasUnsavedChanges(true);
  };

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
    handleRefreshPreviewWithNewContent,
    // Template editing
    workingTemplate,
    hasTemplateChanges,
    handleTemplateAction,
    handleAddButton,
    handleDuplicateSection,
    handleSaveWorkingTemplate,
  };
};