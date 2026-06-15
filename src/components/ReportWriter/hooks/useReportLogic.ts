import { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '../../../contexts/DataContext';

interface UseReportLogicParams {
  template: any;
  classData: any;
  currentStudent: any;
  dynamicSections: any[];
  setDynamicSections: React.Dispatch<React.SetStateAction<any[]>>;
}

// ─── PRONOUN SUBSTITUTION ─────────────────────────────────────────────────────
// Maps male → female → neutral for whole-word replacement.
// Uses word boundaries so "his" doesn't match "this", "he" doesn't match "the" etc.

const PRONOUN_MAPS: Record<string, Record<string, string>> = {
  she: {
    '\\bhe\\b': 'she',
    '\\bhis\\b': 'her',
    '\\bhim\\b': 'her',
    '\\bhimself\\b': 'herself',
    '\\bHe\\b': 'She',
    '\\bHis\\b': 'Her',
    '\\bHim\\b': 'Her',
    '\\bHimself\\b': 'Herself',
  },
  he: {
    '\\bshe\\b': 'he',
    '\\bher\\b': 'his',
    '\\bherself\\b': 'himself',
    '\\bShe\\b': 'He',
    '\\bHer\\b': 'His',
    '\\bHerself\\b': 'Himself',
  },
  they: {
    '\\bhe\\b': 'they',
    '\\bshe\\b': 'they',
    '\\bhis\\b': 'their',
    '\\bher\\b': 'their',
    '\\bhim\\b': 'them',
    '\\bhimself\\b': 'themselves',
    '\\bherself\\b': 'themselves',
    '\\bHe\\b': 'They',
    '\\bShe\\b': 'They',
    '\\bHis\\b': 'Their',
    '\\bHer\\b': 'Their',
    '\\bHim\\b': 'Them',
    '\\bHimself\\b': 'Themselves',
    '\\bHerself\\b': 'Themselves',
  },
};

function applyGlobalPronoun(text: string, pronoun: string): string {
  if (!pronoun || !PRONOUN_MAPS[pronoun]) return text;
  let result = text;
  const map = PRONOUN_MAPS[pronoun];
  for (const [pattern, replacement] of Object.entries(map)) {
    result = result.replace(new RegExp(pattern, 'g'), replacement);
  }
  return result;
}

// ─── CAPITAL AFTER FULL STOP ──────────────────────────────────────────────────

function replaceNameWithCapital(text: string, replacement: string): string {
  return text.replace(/\[Name\]/g, (match, offset, str) => {
    const before = str.slice(0, offset);
    const followsFullStop = /\.\s+$/.test(before) || offset === 0;
    if (followsFullStop) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
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

  const [workingTemplate, setWorkingTemplate] = useState<any>(() => ({
    ...template,
    sections: template.sections.map((s: any) => ({ ...s, data: { ...s.data } }))
  }));
  const [hasTemplateChanges, setHasTemplateChanges] = useState(false);

  const lastStudentIdRef = useRef<string | null>(null);
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
          const showHeader = section.data.showHeader !== undefined ? section.data.showHeader : false;
          initialData[section.id] = { showHeader, ...section.data };
        });
        setSectionData(initialData);
        setEditableReportContent('');
        setIsPreviewEditing(false);
        setDynamicSections([]);
      }
      setHasUnsavedChanges(false);
    }
  }, [currentStudent, template.id, workingTemplate.sections, getReport, setDynamicSections]);

  // ─── REORDER SECTIONS ─────────────────────────────────────────────────────

  const handleReorderSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    setWorkingTemplate((prev: any) => {
      const sections = [...prev.sections];
      const idx = sections.findIndex((s: any) => s.id === sectionId);
      if (idx === -1) return prev;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= sections.length) return prev;
      [sections[idx], sections[target]] = [sections[target], sections[idx]];
      return { ...prev, sections };
    });
    setHasTemplateChanges(true);
  }, []);

  // ─── TEMPLATE ACTION HANDLER ──────────────────────────────────────────────

  const handleTemplateAction = useCallback((action: {
    type: 'replace' | 'add-to-button' | 'add-to-new-button';
    sectionId: string;
    commentText: string;
    buttonName?: string;
    newButtonName?: string;
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
            const options = [...(comments[action.buttonName] || [])];
            const replaceIdx = options.length > 0 ? 0 : 0;
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

  // ─── ADD NEW BUTTON ───────────────────────────────────────────────────────

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

  // ─── MERGE SECTIONS ───────────────────────────────────────────────────────
  // FIX: replaced [...new Set(combined)] with .filter() deduplication
  // to avoid TypeScript downlevelIteration requirement.

  const handleMergeSections = useCallback((sourceId: string, targetId: string) => {
    setWorkingTemplate((prev: any) => {
      const source = prev.sections.find((s: any) => s.id === sourceId);
      const target = prev.sections.find((s: any) => s.id === targetId);
      if (!source || !target || source.type !== target.type) return prev;

      const mergedData = JSON.parse(JSON.stringify(target.data));

      if (source.type === 'qualities') {
        const sourceComments = source.data?.comments || {};
        const targetComments = mergedData.comments || {};
        for (const [key, options] of Object.entries(sourceComments)) {
          if (targetComments[key]) {
            const combined = [...targetComments[key], ...(options as string[])];
            targetComments[key] = combined.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
          } else {
            targetComments[key] = options;
          }
        }
        mergedData.comments = targetComments;
      } else if (source.type === 'next-steps') {
        const sourceFocusAreas = source.data?.focusAreas || {};
        const targetFocusAreas = mergedData.focusAreas || {};
        for (const [key, options] of Object.entries(sourceFocusAreas)) {
          if (targetFocusAreas[key]) {
            const combined = [...targetFocusAreas[key], ...(options as string[])];
            targetFocusAreas[key] = combined.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
          } else {
            targetFocusAreas[key] = options;
          }
        }
        mergedData.focusAreas = targetFocusAreas;
      } else if (source.type === 'personalised-comment') {
        const sourceCategories = source.data?.categories || {};
        const targetCategories = mergedData.categories || {};
        for (const [key, options] of Object.entries(sourceCategories)) {
          if (targetCategories[key]) {
            const combined = [...targetCategories[key], ...(options as string[])];
            targetCategories[key] = combined.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
          } else {
            targetCategories[key] = options;
          }
        }
        mergedData.categories = targetCategories;
      }

      const updatedSections = prev.sections
        .map((s: any) => s.id === targetId ? { ...s, data: mergedData } : s)
        .filter((s: any) => s.id !== sourceId);

      return { ...prev, sections: updatedSections };
    });
    setHasTemplateChanges(true);
  }, []);

  // ─── INSERT SECTION ───────────────────────────────────────────────────────

  const handleRenameSection = useCallback((sectionId: string, newName: string) => {
    setWorkingTemplate((prev: any) => ({
      ...prev,
      sections: prev.sections.map((s: any) => s.id === sectionId ? { ...s, name: newName } : s),
    }));
    setHasTemplateChanges(true);
  }, []);

  const handleInsertSection = useCallback((newSection: any, afterIndex: number) => {
    setWorkingTemplate((prev: any) => {
      const sections = [...prev.sections];
      sections.splice(afterIndex + 1, 0, newSection);
      return { ...prev, sections };
    });
    setSectionData((prev: any) => ({
      ...prev,
      [newSection.id]: { showHeader: newSection.data?.showHeader || false, ...newSection.data },
    }));
    setHasTemplateChanges(true);
  }, []);

  // ─── SAVE WORKING TEMPLATE ────────────────────────────────────────────────

  const handleSaveWorkingTemplate = useCallback(async () => {
    try {
      await updateTemplate(workingTemplate);
      setHasTemplateChanges(false);
      return true;
    } catch (e) {
      return false;
    }
  }, [workingTemplate, updateTemplate]);

  // ─── SAVE REPORT ──────────────────────────────────────────────────────────

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
      sectionData,
      isManuallyEdited,
      manuallyEditedContent,
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

  // ─── UPDATE SECTION DATA ──────────────────────────────────────────────────

  const updateSectionData = useCallback((sectionId: string, data: any) => {
    console.log('updateSectionData called:', sectionId, data);
    setSectionData((prev: Record<string, any>) => {
      const newData = { ...prev, [sectionId]: { ...prev[sectionId], ...data } };
      const section = workingTemplate.sections.find((s: any) => s.id === sectionId) ||
        dynamicSections.find((s: any) => s.id === sectionId);

      if (section?.type === 'rated-comment' && data.rating && data.rating !== 'no-comment') {
        const comments = section.data?.comments?.[data.rating] || section.data?.ratings?.[data.rating];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
        }
      }
      if (section?.type === 'assessment-comment' && data.performance && data.performance !== 'no-comment') {
        const comments = section.data?.comments?.[data.performance];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
        }
      }
      if (section?.type === 'personalised-comment' && data.category) {
        const comments = section.data?.categories?.[data.category] || section.data?.comments?.[data.category];
        if (comments && comments.length > 0) {
          const randomIndex = Math.floor(Math.random() * comments.length);
          newData[sectionId].selectedComment = comments[randomIndex];
          newData[sectionId].selectedCommentIndex = randomIndex;
        }
      }
      if (section?.type === 'next-steps' && data.focusArea) {
        const suggestions = section.data?.focusAreas?.[data.focusArea] || section.data?.comments?.[data.focusArea];
        if (suggestions && suggestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          newData[sectionId].selectedSuggestion = suggestions[randomIndex];
          newData[sectionId].selectedSuggestionIndex = randomIndex;
        }
      }
      if (section?.type === 'qualities' && data.qualityArea) {
        const qualities = section.data?.comments?.[data.qualityArea];
        if (qualities && qualities.length > 0) {
          const randomIndex = Math.floor(Math.random() * qualities.length);
          newData[sectionId].selectedQuality = qualities[randomIndex];
          newData[sectionId].selectedQualityIndex = randomIndex;
        }
      }
      return newData;
    });
    setHasUnsavedChanges(true);
    // Persist header settings to template when explicitly changed
    if ('showHeader' in data || 'headerStyle' in data) {
      setWorkingTemplate((prev: any) => ({
        ...prev,
        sections: prev.sections.map((s: any) => s.id === sectionId ? {
          ...s,
          data: {
            ...s.data,
            ...('showHeader' in data ? { showHeader: data.showHeader } : {}),
            ...('headerStyle' in data ? { headerStyle: data.headerStyle } : {}),
          },
        } : s),
      }));
      setHasTemplateChanges(true);
    }
  }, [workingTemplate.sections, dynamicSections]);

  // ─── GET ALL SECTIONS ─────────────────────────────────────────────────────

  const getAllSections = useCallback(() => {
    const result: any[] = [];
    workingTemplate.sections.forEach((section: any, index: number) => {
      result.push(section);
      const toInsert = dynamicSections.filter((ds: any) => ds.insertAfter === index);
      toInsert.forEach((ds: any) => result.push(ds));
    });
    return result;
  }, [workingTemplate.sections, dynamicSections]);

  // ─── NAME/PRONOUN HELPER ──────────────────────────────────────────────────

  const getNameOrPronoun = useCallback((sectionId: string) => {
    const sd = sectionData[sectionId] || {};
    switch (sd.pronounOverride) {
      case 'he': return 'he';
      case 'she': return 'she';
      case 'they': return 'they';
      default: return currentStudent?.firstName || '';
    }
  }, [sectionData, currentStudent]);

  // ─── GENERATE REPORT CONTENT ──────────────────────────────────────────────

  const generateReportContent = useCallback(() => {
    let content = '';
    const allSections = getAllSections();
    const globalPronoun = sectionData['__student__']?.pronounOverride || '';

    allSections.forEach((section: any) => {
      const data = sectionData[section.id] || {};
      if (data.exclude) return;

      const showHeader = data.showHeader !== undefined ? data.showHeader :
        section.data?.showHeader !== undefined ? section.data.showHeader : false;
      const headerStyle = data.headerStyle || section.data?.headerStyle || 'inline';

      const applyHeader = (name: string) => {
        if (!showHeader || !name) return;
        if (headerStyle === 'newline') content += `${name}\n`;
        else if (headerStyle === 'caps') content += `${name.toUpperCase()}: `;
        else if (headerStyle === 'caps-newline') content += `${name.toUpperCase()}\n`;
        else content += `${name}: `;
      };

      const nameToken = getNameOrPronoun(section.id);

      switch (section.type) {
        case 'rated-comment':
          if (data.rating && data.rating !== 'no-comment') {
            applyHeader(section.name);
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            content += replaceNameWithCapital(comment, nameToken) + ' ';
          }
          break;

        case 'assessment-comment':
          if (data.performance && data.performance !== 'no-comment') {
            applyHeader(section.name);
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            let processed = replaceNameWithCapital(comment, nameToken);
            const scoreValues: Record<string, string> = data.scoreValues || {};
            processed = processed.replace(/\[Score (\d+)\]/gi, (_m: string, num: string) => {
              return scoreValues[`Score ${num}`] || `[Score ${num}]`;
            });
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
            applyHeader(section.name);
            const comment = data.customEditedComment || data.selectedComment || '[No comment selected]';
            let processed = replaceNameWithCapital(comment, nameToken);
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
            applyHeader(section.name);
            const suggestion = data.customEditedSuggestion || data.selectedSuggestion || '[No suggestion selected]';
            content += replaceNameWithCapital(suggestion, nameToken) + ' ';
          }
          break;

        case 'qualities':
          if (data.qualityArea) {
            applyHeader(section.name);
            const quality = data.customEditedQuality || data.selectedQuality || '[No quality selected]';
            content += replaceNameWithCapital(quality, nameToken) + ' ';
          }
          break;

        case 'optional-additional-comment':
          if (data.comment && data.comment.trim()) {
            applyHeader(section.name);
            content += replaceNameWithCapital(data.comment, nameToken) + ' ';
          }
          break;

        case 'standard-comment':
          const standardContent = data.comment || section.data?.content;
          if (standardContent && standardContent.trim()) {
            applyHeader(section.name);
            content += replaceNameWithCapital(standardContent, nameToken) + ' ';
          }
          break;

        case 'new-line':
          content += '\n\n';
          break;

        default:
          console.log('Unknown section type:', section.type);
      }
    });

    let result = content.trim();
    if (globalPronoun) {
      result = applyGlobalPronoun(result, globalPronoun);
    }
    return result;
  }, [sectionData, currentStudent, getAllSections, getNameOrPronoun]);

  // ─── DYNAMIC SECTIONS ─────────────────────────────────────────────────────

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
        name,
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
    workingTemplate,
    hasTemplateChanges,
    handleTemplateAction,
    handleAddButton,
    handleDuplicateSection,
    handleMergeSections,
    handleReorderSection,
    handleSaveWorkingTemplate,
    handleInsertSection,
    handleRenameSection,
  };
};