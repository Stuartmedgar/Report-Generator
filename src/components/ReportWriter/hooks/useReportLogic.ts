import { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '../../../contexts/DataContext';

interface UseReportLogicParams {
  template: any;
  classData: any;
  currentStudent: any;
  dynamicSections: any[];
  setDynamicSections: React.Dispatch<React.SetStateAction<any[]>>;
  disableReportSaving?: boolean;
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

// ─── COMMENT BANK LOCATION ────────────────────────────────────────────────────
// Next Steps / Personalised sections built in Create Template keep their
// statements under `comments`; imported and wizard-built ones use
// `focusAreas` / `categories`. Always read and write whichever key the section
// already uses, otherwise edits land in a second bank and buttons vanish.

export function bankKey(section: any): string {
  if (section.type === 'next-steps') {
    return section.data?.focusAreas || !section.data?.comments ? 'focusAreas' : 'comments';
  }
  if (section.type === 'personalised-comment') {
    return section.data?.categories || !section.data?.comments ? 'categories' : 'comments';
  }
  return 'comments';
}

// Button names in display order: explicit headings first (only those that
// still exist), then any buttons the headings list doesn't know about.
export function orderedButtonNames(section: any): string[] {
  const bank = section.data?.[bankKey(section)] || {};
  const keys = Object.keys(bank);
  const headings: string[] = (section.data?.headings || []).filter((h: string) => keys.includes(h));
  return [...headings, ...keys.filter(k => !headings.includes(k))];
}

const BUTTON_SECTION_TYPES = ['qualities', 'next-steps', 'personalised-comment', 'rated-comment', 'assessment-comment'];

function selectedTextField(sectionType: string): string {
  if (sectionType === 'next-steps') return 'selectedSuggestion';
  if (sectionType === 'qualities') return 'selectedQuality';
  return 'selectedComment';
}

export const useReportLogic = ({
  template,
  classData,
  currentStudent,
  dynamicSections,
  setDynamicSections,
  disableReportSaving = false
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
  // Latest values for callbacks that are memoised with no dependencies
  const sectionDataRef = useRef(sectionData);
  sectionDataRef.current = sectionData;
  const workingTemplateSectionsRef = useRef<any[]>(workingTemplate.sections);
  workingTemplateSectionsRef.current = workingTemplate.sections;

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
          // Only per-pupil choices belong here — copying section.data stored the
          // whole comment bank in every report and filled browser storage.
          const showHeader = section.data.showHeader !== undefined ? section.data.showHeader : false;
          initialData[section.id] = { showHeader };
        });
        initialData['__student__'] = { pronounOverride: 'he' };
        setSectionData(initialData);
        setEditableReportContent('');
        setIsPreviewEditing(false);
        setDynamicSections([]);
      }
      setHasUnsavedChanges(false);
    }
  }, [currentStudent, template.id, workingTemplate.sections, getReport, setDynamicSections]);

  // ─── REORDER SECTIONS ─────────────────────────────────────────────────────

  const handleDeleteSection = useCallback((sectionId: string) => {
    setWorkingTemplate((prev: any) => ({
      ...prev,
      sections: prev.sections.filter((s: any) => s.id !== sectionId),
    }));
    setHasTemplateChanges(true);
  }, []);

  const handleUpdateWorkingSection = useCallback((sectionIndex: number, updatedSection: any) => {
    setWorkingTemplate((prev: any) => ({
      ...prev,
      sections: prev.sections.map((s: any, i: number) => i === sectionIndex ? updatedSection : s),
    }));
    setHasTemplateChanges(true);
  }, []);

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
    type: 'replace' | 'add-to-button' | 'add-to-new-button' | 'rename-button' | 'delete-button' | 'move-statement' | 'reorder-button';
    sectionId: string;
    commentText?: string;
    buttonName?: string;
    newButtonName?: string;
    oldButtonName?: string;
    updatedComments?: Record<string, string[]>;
    fromButton?: string;
    toButton?: string;
    statement?: string;
    orderedButtons?: string[];
  }) => {
    // The statement this pupil was given, before any edit — used to replace or
    // move the right statement rather than always the first one.
    const pupilData = sectionDataRef.current[action.sectionId] || {};

    setWorkingTemplate((prev: any) => {
      const updatedSections = prev.sections.map((section: any) => {
        if (section.id !== action.sectionId) return section;
        const newData = { ...section.data };

        if (action.type === 'reorder-button' && action.orderedButtons) {
          newData.headings = action.orderedButtons;
          return { ...section, data: newData };
        }

        if (section.type === 'standard-comment') {
          if (action.type === 'replace') {
            newData.content = action.commentText;
            if ('comment' in newData) newData.comment = action.commentText;
          }
          return { ...section, data: newData };
        }

        if (!BUTTON_SECTION_TYPES.includes(section.type)) return section;

        const key = bankKey(section);
        let comments: Record<string, string[]> = { ...(newData[key] || {}) };
        // Keep an existing explicit order (headings) in sync with rename/delete/add,
        // otherwise a stale headings array would keep showing the old button name,
        // keep showing a deleted button, or hide a newly added one.
        let headings: string[] | undefined = section.data?.headings ? [...section.data.headings] : undefined;
        const text = action.commentText;
        const selectedText: string | undefined = pupilData[selectedTextField(section.type)];

        if (action.type === 'replace' && action.buttonName && text !== undefined) {
          const options = [...(comments[action.buttonName] || [])];
          const idx = selectedText ? options.indexOf(selectedText) : -1;
          if (idx >= 0) options[idx] = text;
          else options.push(text);
          comments[action.buttonName] = options;
        } else if (action.type === 'add-to-button' && action.buttonName && text !== undefined) {
          comments[action.buttonName] = [...(comments[action.buttonName] || []), text];
        } else if (action.type === 'add-to-new-button' && action.newButtonName && text !== undefined) {
          // An existing name gets the statement added, never overwritten
          comments[action.newButtonName] = [...(comments[action.newButtonName] || []), text];
          if (headings && !headings.includes(action.newButtonName)) headings.push(action.newButtonName);
        } else if (action.type === 'rename-button' && action.oldButtonName && action.newButtonName && action.oldButtonName !== action.newButtonName) {
          const oldName = action.oldButtonName;
          const newName = action.newButtonName;
          const moved = comments[oldName] || [];
          const existing = comments[newName];
          // Rebuild in place so the button keeps its position; renaming onto an
          // existing button combines the two instead of overwriting it.
          const rebuilt: Record<string, string[]> = {};
          Object.keys(comments).forEach(k => {
            if (k === oldName) {
              if (!existing) rebuilt[newName] = moved;
            } else if (k === newName) {
              rebuilt[k] = [...existing, ...moved.filter(s => !existing.includes(s))];
            } else {
              rebuilt[k] = comments[k];
            }
          });
          comments = rebuilt;
          if (headings) {
            headings = headings
              .map(h => h === oldName ? newName : h)
              .filter((h, i, a) => a.indexOf(h) === i);
          }
          if (section.type === 'rated-comment' && newData.labels) {
            const labels = { ...newData.labels };
            delete labels[oldName];
            newData.labels = labels;
          }
        } else if (action.type === 'delete-button' && action.buttonName) {
          // "Move all to" sends the merged bank as updatedComments
          if (action.updatedComments) comments = { ...action.updatedComments };
          else delete comments[action.buttonName];
          if (headings) headings = headings.filter(h => h !== action.buttonName);
          if (section.type === 'rated-comment' && newData.labels) {
            const labels = { ...newData.labels };
            delete labels[action.buttonName];
            newData.labels = labels;
          }
        } else if (action.type === 'move-statement' && action.fromButton && action.toButton && action.statement) {
          const statement = action.statement;
          // Remove the original wording too, in case it was edited before moving
          comments[action.fromButton] = (comments[action.fromButton] || []).filter(s => s !== statement && s !== selectedText);
          if (comments[action.fromButton].length === 0) {
            delete comments[action.fromButton];
            if (headings) headings = headings.filter(h => h !== action.fromButton);
          }
          const target = comments[action.toButton] || [];
          comments[action.toButton] = target.includes(statement) ? target : [...target, statement];
        }

        newData[key] = comments;
        if (headings) newData.headings = headings;
        return { ...section, data: newData };
      });
      return { ...prev, sections: updatedSections };
    });

    // Point this pupil at the replaced wording so a second Replace finds it
    if (action.type === 'replace' && action.commentText !== undefined) {
      setSectionData((prev: Record<string, any>) => {
        const section = workingTemplateSectionsRef.current.find((s: any) => s.id === action.sectionId);
        if (!section || !BUTTON_SECTION_TYPES.includes(section.type)) return prev;
        return { ...prev, [action.sectionId]: { ...prev[action.sectionId], [selectedTextField(section.type)]: action.commentText } };
      });
    }
    setHasTemplateChanges(true);
  }, []);

  // ─── ADD NEW BUTTON ───────────────────────────────────────────────────────

  const handleAddButton = useCallback((sectionId: string, buttonName: string, firstOption: string) => {
    setWorkingTemplate((prev: any) => {
      const updatedSections = prev.sections.map((section: any) => {
        if (section.id !== sectionId || !BUTTON_SECTION_TYPES.includes(section.type)) return section;
        const key = bankKey(section);
        const newData = { ...section.data };
        const bank = { ...(newData[key] || {}) };
        // An existing name gets the statement added, never overwritten
        bank[buttonName] = [...(bank[buttonName] || []), firstOption];
        newData[key] = bank;
        if (section.data?.headings && !section.data.headings.includes(buttonName)) {
          newData.headings = [...section.data.headings, buttonName];
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
        const sourceFocusAreas = source.data?.[bankKey(source)] || {};
        const targetFocusAreas = mergedData[bankKey(target)] || {};
        for (const [key, options] of Object.entries(sourceFocusAreas)) {
          if (targetFocusAreas[key]) {
            const combined = [...targetFocusAreas[key], ...(options as string[])];
            targetFocusAreas[key] = combined.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
          } else {
            targetFocusAreas[key] = options;
          }
        }
        mergedData[bankKey(target)] = targetFocusAreas;
      } else if (source.type === 'personalised-comment') {
        const sourceCategories = source.data?.[bankKey(source)] || {};
        const targetCategories = mergedData[bankKey(target)] || {};
        for (const [key, options] of Object.entries(sourceCategories)) {
          if (targetCategories[key]) {
            const combined = [...targetCategories[key], ...(options as string[])];
            targetCategories[key] = combined.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
          } else {
            targetCategories[key] = options;
          }
        }
        mergedData[bankKey(target)] = targetCategories;
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
    if (disableReportSaving) {
      setHasUnsavedChanges(false);
      return;
    }
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
    const globalPronoun = sectionData['__student__']?.pronounOverride || 'he';

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
            // Backward compat: bare [Score] — use free-text Score 1 if available, else numeric
            if (/\[Score\]/i.test(processed)) {
              if (scoreValues['Score 1']) {
                processed = processed.replace(/\[Score\]/gi, scoreValues['Score 1']);
              } else if (data.score !== undefined && data.score !== null) {
                const scoreType = data.scoreType || section.data?.scoreType || 'outOf';
                const maxScore = data.maxScore || section.data?.maxScore || 100;
                const scoreText = scoreType === 'percentage' ? `${data.score}%` : `${data.score} out of ${maxScore}`;
                processed = processed.replace(/\[Score\]/gi, scoreText);
              }
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
          const standardContent = data.comment || section.data?.content || section.data?.comment;
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
    handleDeleteSection,
    handleUpdateWorkingSection,
  };
};