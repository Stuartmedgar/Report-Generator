// src/pages/ImportTemplate.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';
import PageNav from '../components/PageNav';
import { SUBJECTS } from '../data/starterComments';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type PronounSet = 'he/his' | 'she/her' | 'they/their';
type OpenerType = 'name' | 'pronoun';
type MainStep = 'setup' | 'paste' | 'builder' | 'variety' | 'generating' | 'preview' | 'saved';
type SectionType = 'qualities' | 'next-steps' | 'assessment-comment' | 'standard-comment' | 'personalised-comment' | 'rated-comment' | 'optional-additional-comment';

interface BuiltSection {
  id: string;
  type: SectionType;
  name: string;
  openerType: OpenerType;
  positionType: string;
  data: any;
}

interface Heading { name: string; comments: string[]; }
interface GeneratedTemplate { name: string; sections: TemplateSection[]; }

const SUPABASE_URL = 'https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template';

function getPronounCapital(p: PronounSet) {
  return p.split('/')[0].charAt(0).toUpperCase() + p.split('/')[0].slice(1);
}

function stripPercent(text: string) {
  return text.replace(/\[Score\]%/g, '[Score]').replace(/\b\d{1,3}%/g, '[Score]');
}

function makeId() { return `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function normalisePronouns(text: string, pronounSet: PronounSet): string {
  if (pronounSet === 'he/his') {
    return text
      .replace(/\bshe\b/g, 'he').replace(/\bShe\b/g, 'He')
      .replace(/\bher(?=\s+\w)/g, 'his').replace(/\bHer(?=\s+\w)/g, 'His')
      .replace(/\bher\b/g, 'him').replace(/\bHer\b/g, 'Him')
      .replace(/\bhers\b/g, 'his').replace(/\bHers\b/g, 'His')
      .replace(/\bherself\b/g, 'himself').replace(/\bHerself\b/g, 'Himself')
      .replace(/\bthey\b/g, 'he').replace(/\bThey\b/g, 'He')
      .replace(/\bthem\b/g, 'him').replace(/\bThem\b/g, 'Him')
      .replace(/\btheir\b/g, 'his').replace(/\bTheir\b/g, 'His')
      .replace(/\bthemselves\b/g, 'himself').replace(/\bThemselves\b/g, 'Himself');
  } else if (pronounSet === 'she/her') {
    return text
      .replace(/\bhe\b/g, 'she').replace(/\bHe\b/g, 'She')
      .replace(/\bhim\b/g, 'her').replace(/\bHim\b/g, 'Her')
      .replace(/\bhis\b/g, 'her').replace(/\bHis\b/g, 'Her')
      .replace(/\bhimself\b/g, 'herself').replace(/\bHimself\b/g, 'Herself')
      .replace(/\bthey\b/g, 'she').replace(/\bThey\b/g, 'She')
      .replace(/\bthem\b/g, 'her').replace(/\bThem\b/g, 'Her')
      .replace(/\btheir\b/g, 'her').replace(/\bTheir\b/g, 'Her')
      .replace(/\bthemselves\b/g, 'herself').replace(/\bThemselves\b/g, 'Herself');
  } else {
    return text
      .replace(/\bhe\b/g, 'they').replace(/\bHe\b/g, 'They')
      .replace(/\bshe\b/g, 'they').replace(/\bShe\b/g, 'They')
      .replace(/\bhim\b/g, 'them').replace(/\bHim\b/g, 'Them')
      .replace(/\bher(?=\s+\w)/g, 'their').replace(/\bHer(?=\s+\w)/g, 'Their')
      .replace(/\bher\b/g, 'them').replace(/\bHer\b/g, 'Them')
      .replace(/\bhis\b/g, 'their').replace(/\bHis\b/g, 'Their')
      .replace(/\bhers\b/g, 'their').replace(/\bHers\b/g, 'Their')
      .replace(/\bhimself\b/g, 'themselves').replace(/\bHimself\b/g, 'Themselves')
      .replace(/\bherself\b/g, 'themselves').replace(/\bHerself\b/g, 'Themselves');
  }
}

function normaliseTemplateSections(sections: any[], pronounSet: PronounSet): any[] {
  return sections.map(section => {
    if (section.type === 'qualities' || section.type === 'rated-comment') {
      const comments: Record<string, string[]> = {};
      Object.entries(section.data?.comments || {}).forEach(([heading, options]) => {
        if (!heading.includes('-led') || heading.toLowerCase().includes('[name]')) {
          comments[heading] = (options as string[]).map(o => {
            const startsWithName = o.startsWith('[Name]');
            const startsWithPronoun = /^(He|She|They)/.test(o);
            if (startsWithName) {
              const afterName = o.slice('[Name]'.length);
              return '[Name]' + normalisePronouns(afterName, pronounSet);
            } else if (startsWithPronoun) {
              return normalisePronouns(o, pronounSet);
            }
            return normalisePronouns(o, pronounSet);
          });
        } else {
          comments[heading] = options as string[];
        }
      });
      return { ...section, data: { ...section.data, comments } };
    }
    if (section.type === 'next-steps') {
      const focusAreas: Record<string, string[]> = {};
      Object.entries(section.data?.focusAreas || {}).forEach(([area, options]) => {
        const isNameLed = !area.includes('He-led') && !area.includes('She-led') && !area.includes('They-led');
        if (isNameLed) {
          focusAreas[area] = (options as string[]).map(o => {
            const startsWithName = o.startsWith('[Name]');
            if (startsWithName) {
              const afterName = o.slice('[Name]'.length);
              return '[Name]' + normalisePronouns(afterName, pronounSet);
            }
            return normalisePronouns(o, pronounSet);
          });
        } else {
          focusAreas[area] = options as string[];
        }
      });
      return { ...section, data: { ...section.data, focusAreas } };
    }
    return section;
  });
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ImportTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const classId = (location.state as { classId?: string } | null)?.classId;
  const { addTemplate } = useData();

  // Core state
  const [mainStep, setMainStep] = useState<MainStep>('setup');
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [pronounSet, setPronounSet] = useState<PronounSet>('they/their');
  const [rawReportText, setRawReportText] = useState('');
  const [builtSections, setBuiltSections] = useState<BuiltSection[]>([]);
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [restructuredReports, setRestructuredReports] = useState<string | null>(null);
  const [reportStructureSections, setReportStructureSections] = useState<{name: string; contents: string}[]>([{ name: '', contents: '' }]);
  const [showStructureForm, setShowStructureForm] = useState(false);
  const [previewSections, setPreviewSections] = useState<TemplateSection[]>([]);
  const [previewFinalName, setPreviewFinalName] = useState('');

  // Selection state
  const [selectedText, setSelectedText] = useState('');
  const [selectionActive, setSelectionActive] = useState(false);
  const [accumulatedText, setAccumulatedText] = useState('');
  const [pendingSelection, setPendingSelection] = useState('');
  const reportPanelRef = useRef<HTMLDivElement>(null);

  // Current section being built
  const [currentSection, setCurrentSection] = useState<{
    type: string;
    name: string;
    openerType: OpenerType;
    scaleType?: 'four-level' | 'own';
  } | null>(null);

  // Standard comment state
  const [stdName, setStdName] = useState('');
  const [stdContent, setStdContent] = useState('');
  const [stdOptions, setStdOptions] = useState<{label: string; content: string}[]>([{label: '', content: ''}]);
  const [stdType, setStdType] = useState<'single' | 'multi'>('single');

  // Assessment state
  const [assessType, setAssessType] = useState<'same' | 'different'>('same');
  const [assessCount, setAssessCount] = useState<'one' | 'multiple'>('one');
  const [assessSentType, setAssessSentType] = useState<'one-sentence' | 'separate'>('separate');
  const [assessPartIndex, setAssessPartIndex] = useState(1);
  const [assessTotalParts, setAssessTotalParts] = useState(2);
  const [assessSectionName, setAssessSectionName] = useState('');

  // Personal information state
  const [piName, setPiName] = useState('');
  const [piInstruction, setPiInstruction] = useState('');

  // Variety generation state
  const [sectionsForVariety, setSectionsForVariety] = useState<{section: BuiltSection; selected: boolean}[]>([]);
  const [isGeneratingVariety, setIsGeneratingVariety] = useState(false);
  const [varietyProgress, setVarietyProgress] = useState(0);

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<string | null>(null);

  const pronounCapital = getPronounCapital(pronounSet);

  // ─── STYLES ────────────────────────────────────────────────────────────────

  const btnP: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
  const btnS: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 18px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' };
  const btnG: React.CSSProperties = { backgroundColor: '#10b981', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
  const btnV: React.CSSProperties = { backgroundColor: '#8b5cf6', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const txa: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' };
  const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '12px' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '5px' };

  // ─── TEXT SELECTION ────────────────────────────────────────────────────────

  const handleTextSelection = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest && target.closest('[data-selection-control]')) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (text.length < 20) return;
    const range = selection.getRangeAt(0);
    if (reportPanelRef.current && reportPanelRef.current.contains(range.commonAncestorContainer)) {
      setPendingSelection(text);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => handleTextSelection(e);
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, [handleTextSelection]);

  useEffect(() => { setRestructuredReports(null); }, [rawReportText]);

  const clearSelection = () => {
    setSelectedText('');
    setAccumulatedText('');
    setPendingSelection('');
    setSelectionActive(false);
    window.getSelection()?.removeAllRanges();
  };

  const addToSelection = () => {
    if (!pendingSelection) return;
    const newAccumulated = accumulatedText ? accumulatedText + '\n\n' + pendingSelection : pendingSelection;
    setAccumulatedText(newAccumulated);
    setSelectedText(newAccumulated);
    setSelectionActive(true);
    setPendingSelection('');
    window.getSelection()?.removeAllRanges();
  };

  // ─── API CALLS ─────────────────────────────────────────────────────────────

  const getReportStructureText = () =>
    reportStructureSections.filter(s => s.name.trim() || s.contents.trim()).map(s => `${s.name.trim()}: ${s.contents.trim()}`).join('\n');

  const ensureRestructured = async (): Promise<string> => {
    if (restructuredReports) return restructuredReports;
    try {
      const res = await fetch(SUPABASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'restructure', reportText: rawReportText, subject: subject || '', reportStructure: getReportStructureText() }) });
      if (res.ok) {
        const data = await res.json();
        if (data.restructuredText) { setRestructuredReports(data.restructuredText); return data.restructuredText; }
      }
    } catch { /* fall back to raw */ }
    return rawReportText;
  };

  const callApi = async (body: any) => {
    const response = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('API call failed');
    return response.json();
  };

  // ─── SPLIT SECTIONS ───────────────────────────────────────────────────────

  const splitSections = (sections: any[], typicalCounts: Record<string, number>): any[] => {
    const result: any[] = [];
    sections.forEach(section => {
      if (section.type === 'new-line') { result.push(section); return; }
      const typicalCount = typicalCounts[section.name] || 1;
      if (typicalCount > 1 && (section.type === 'qualities' || section.type === 'next-steps')) {
        const isNextSteps = section.type === 'next-steps';
        const headings = isNextSteps ? Object.entries(section.data?.focusAreas || {}) : Object.entries(section.data?.comments || {});
        if (headings.length <= 1) { result.push(section); return; }
        const countToUse = Math.min(typicalCount, headings.length);
        const chunkSize = Math.ceil(headings.length / countToUse);
        for (let i = 0; i < countToUse; i++) {
          const chunk = headings.slice(i * chunkSize, (i + 1) * chunkSize);
          if (chunk.length === 0) continue;
          const sectionName = i === 0 ? section.name : `${section.name} (${i + 1})`;
          if (isNextSteps) {
            const focusAreas: Record<string, string[]> = {};
            chunk.forEach(([key, val]) => { focusAreas[key] = val as string[]; });
            result.push({ ...section, id: makeId(), name: sectionName, data: { ...section.data, focusAreas } });
          } else {
            const comments: Record<string, string[]> = {};
            chunk.forEach(([key, val]) => { comments[key] = val as string[]; });
            result.push({ ...section, id: makeId(), name: sectionName, data: { ...section.data, comments } });
          }
        }
      } else {
        result.push(section);
      }
    });
    return result;
  };

  // ─── QUICK BUILD ──────────────────────────────────────────────────────────

  const mergeDuplicateSectionTypes = (sections: any[]): any[] => {
    const result: any[] = [];
    let mergedQualities: any = null;
    let mergedNextSteps: any = null;
    for (const sec of sections) {
      if (sec.type === 'qualities') {
        if (!mergedQualities) {
          mergedQualities = { ...sec, data: { ...sec.data, comments: { ...(sec.data?.comments || {}) } } };
          result.push(mergedQualities);
        } else {
          Object.assign(mergedQualities.data.comments, sec.data?.comments || {});
        }
      } else if (sec.type === 'next-steps') {
        if (!mergedNextSteps) {
          mergedNextSteps = { ...sec, data: { ...sec.data, focusAreas: { ...(sec.data?.focusAreas || {}) } } };
          result.push(mergedNextSteps);
        } else {
          Object.assign(mergedNextSteps.data.focusAreas, sec.data?.focusAreas || {});
        }
      } else {
        result.push(sec);
      }
    }
    return result;
  };

  const assembleSampleReport = (sections: TemplateSection[]): string => {
    const parts: string[] = [];
    for (const sec of sections) {
      if (sec.type === 'new-line') continue;
      if (sec.type === 'standard-comment') {
        const text = sec.data?.content || sec.data?.comment || '';
        if (text) parts.push(text);
      } else if (sec.type === 'rated-comment') {
        const c = sec.data?.comments || {};
        const opt = c.good?.[0] || c.excellent?.[0] || c.satisfactory?.[0] || c.needsImprovement?.[0] || '';
        if (opt) parts.push(opt);
      } else if (sec.type === 'qualities') {
        const c = sec.data?.comments || {};
        const firstHeading = Object.keys(c)[0];
        if (firstHeading && c[firstHeading]?.[0]) parts.push(c[firstHeading][0]);
      } else if (sec.type === 'next-steps') {
        const f = sec.data?.focusAreas || {};
        const firstArea = Object.keys(f)[0];
        if (firstArea && f[firstArea]?.[0]) parts.push(f[firstArea][0]);
      } else if (sec.type === 'personalised-comment') {
        const cats = sec.data?.categories || sec.data?.comments || {};
        const firstCat = Object.keys(cats)[0];
        if (firstCat && cats[firstCat]?.[0]) parts.push(cats[firstCat][0]);
      } else if (sec.type === 'assessment-comment') {
        const c = sec.data?.comments || {};
        const opt = c.good?.[0] || c.excellent?.[0] || '';
        if (opt) parts.push(opt);
      }
    }
    return parts.join(' ').replace(/\[Name\]/g, 'Alex').replace(/\[Score\]/g, '72%').replace(/\[Info \d\]/g, '(personal detail)');
  };

  const handleQuickBuild = async () => {
    if (!subject.trim()) { setError('Please enter the subject.'); return; }
    if (!rawReportText.trim()) { setError('Please paste your reports.'); return; }
    setError(null);
    setIsLoading(true);
    setLoadingMessage(restructuredReports ? 'Reading your reports and identifying sections...' : 'Structuring your reports...');
    try {
      const reportTextForAI = await ensureRestructured();
      setLoadingMessage('Reading your reports and identifying sections...');
      const structureText = getReportStructureText();
      const identified = await callApi({ mode: 'identify-sections', subject, yearGroup, reportText: reportTextForAI, reportStructure: structureText });
      const identifiedSections = (identified.sections || []).filter((s: any) => s.type !== 'new-line');
      if (identifiedSections.length === 0) throw new Error('Could not identify sections');
      setLoadingMessage('Building your template automatically...');
      const result = await callApi({ mode: 'auto-build', subject, yearGroup, pronounSet, reportText: reportTextForAI, builtSections: identifiedSections, reportStructure: structureText });
      const typicalCountMap: Record<string, number> = {};
      identifiedSections.forEach((s: any) => { typicalCountMap[s.name] = s.typicalCount || 1; });
      if (!result.sections || result.sections.length === 0) throw new Error('No sections returned');
      const sections = result.sections.map((s: any) => ({ ...s, id: makeId(), data: s.data || {} }));
      const normalisedSections = normaliseTemplateSections(sections, pronounSet);
      const mergedSections = mergeDuplicateSectionTypes(normalisedSections);
      const splitResult = splitSections(mergedSections, typicalCountMap);
      const finalName = templateName.trim() || result.templateName || `${subject}${yearGroup ? ' ' + yearGroup : ''} Report Template`;
      if (classId) {
        const newId = addTemplate({ name: finalName, sections: splitResult });
        navigate('/write-reports', {
          state: { preselectedClassId: classId, preselectedTemplateId: newId, autoStart: true, tourSource: 'ai-builder' },
        });
      } else {
        setPreviewSections(splitResult);
        setPreviewFinalName(finalName);
        setMainStep('preview');
      }
    } catch (err: any) {
      setError('Quick build failed. Please try the guided wizard instead.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── SECTION BUILDING ─────────────────────────────────────────────────────

  const addSection = (section: BuiltSection) => {
    setBuiltSections(prev => [...prev, section]);
    setCurrentSection(null);
    setSubMenu(null);
    setMenuOpen(false);
    setError(null);
    clearSelection();
  };

  const handleExtractAndAdd = async (positionType: string, openerType: OpenerType, sectionName: string, scaleType?: string) => {
    if (!selectedText) { setError('Please highlight some text from your reports first.'); return; }
    setError(null);
    setIsLoading(true);
    setLoadingMessage(restructuredReports ? `Reading all reports to extract ${sectionName} sentences...` : 'Structuring your reports (once only)...');
    try {
      const reportTextForAI = await ensureRestructured();
      setLoadingMessage(`Reading all reports to extract ${sectionName} sentences...`);
      const result = await callApi({ mode: 'extract-only', subject, yearGroup, reportText: reportTextForAI, pronounSet, openerType, sectionName, positionType, scaleType: scaleType || 'own', selectedText, piInstruction });
      const isNextSteps = positionType === 'next-steps' || positionType === 'development';
      const isAssessment = positionType === 'assessment-comment';
      const isPersonalisedComment = positionType === 'personalised-comment';
      const newSection: BuiltSection = {
        id: makeId(),
        type: isNextSteps ? 'next-steps' : isAssessment ? 'assessment-comment' : isPersonalisedComment ? 'personalised-comment' : 'qualities',
        name: result.sectionName || sectionName,
        openerType,
        positionType,
        data: isNextSteps
          ? { focusAreas: Object.fromEntries((result.headings || []).map((h: Heading) => [h.name, h.comments])) }
          : isAssessment
          ? { scoreType: 'percentage', comments: buildAssessmentComments(result.headings || []) }
          : isPersonalisedComment
          ? { instruction: result.instruction || piInstruction, categories: Object.fromEntries((result.headings || []).map((h: Heading) => [h.name, h.comments])) }
          : { comments: Object.fromEntries((result.headings || []).map((h: Heading) => [h.name, h.comments])) },
      };
      addSection(newSection);
    } catch (err: any) {
      setError(err.message || 'Extraction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySection = async (sourceSection: BuiltSection, openerType: OpenerType) => {
    setIsLoading(true);
    setLoadingMessage(`Rewriting with ${openerType === 'pronoun' ? pronounCapital : '[Name]'}...`);
    try {
      const sourceForRewrite = {
        sectionName: sourceSection.name,
        headings: sourceSection.type === 'next-steps'
          ? Object.entries(sourceSection.data?.focusAreas || {}).map(([name, comments]) => ({ name, comments }))
          : Object.entries(sourceSection.data?.comments || {}).map(([name, comments]) => ({ name, comments })),
      };
      const rewritten = await callApi({ mode: 'rewrite', pronounSet, openerType, sourceSection: sourceForRewrite });
      const isNextSteps = sourceSection.type === 'next-steps';
      const newSection: BuiltSection = {
        id: makeId(),
        type: sourceSection.type,
        name: sourceSection.name + (openerType === 'pronoun' ? ` — ${pronounCapital}-led` : ' — [Name]-led'),
        openerType,
        positionType: sourceSection.positionType,
        data: isNextSteps
          ? { focusAreas: Object.fromEntries((rewritten.headings || []).map((h: Heading) => [h.name, h.comments])) }
          : { comments: Object.fromEntries((rewritten.headings || []).map((h: Heading) => [h.name, h.comments])) },
      };
      addSection(newSection);
    } catch (err: any) {
      setError('Rewrite failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const buildAssessmentComments = (headings: Heading[]) => {
    const levels: Record<string, string[]> = { excellent: [], good: [], satisfactory: [], needsImprovement: [], notCompleted: [] };
    headings.forEach(h => {
      const n = h.name.toLowerCase();
      if (n.includes('excellent') || n.includes('outstanding') || n.includes('very well')) levels.excellent.push(...h.comments.map(stripPercent));
      else if (n.includes('good') || n.includes('solid') || n.includes('well')) levels.good.push(...h.comments.map(stripPercent));
      else if (n.includes('satisfactory') || n.includes('some') || n.includes('challenge')) levels.satisfactory.push(...h.comments.map(stripPercent));
      else if (n.includes('improvement') || n.includes('difficult') || n.includes('poor')) levels.needsImprovement.push(...h.comments.map(stripPercent));
      else if (n.includes('completed') || n.includes('absent') || n.includes('missed')) levels.notCompleted.push(...h.comments.map(stripPercent));
      else levels.good.push(...h.comments.map(stripPercent));
    });
    if (!levels.notCompleted.length) levels.notCompleted = ['[Name] has not yet completed this assessment.', '[Name] was absent for this assessment.'];
    return levels;
  };

  // ─── handleBuildSameAssessment — must be before builder render block ──────

  const handleBuildSameAssessment = (name: string) => {
    if (!selectedText.trim()) { setError('Please highlight the assessment sentence from your reports.'); return; }
    const safeWords = new Set(['Monday','Tuesday','Wednesday','Thursday','Friday','National','Maths','Mathematics','English','History','Science','French','Spanish','Biology','Chemistry','Physics','Computing','Geography','Drama','Music','Art','Business','Black','Death','Mary','Queen','Scots','Romans']);
    let cleaned = selectedText.trim();
    cleaned = cleaned.replace(/\u0000NAME\u0000/g, '[Name]').replace(/\u0000SCORE\u0000/g, '[Score]');
    cleaned = cleaned.replace(/\[Name\]/g, '\u0000NAME\u0000').replace(/\[Score\]/g, '\u0000SCORE\u0000');
    cleaned = cleaned.replace(/\b([A-Z][a-z]{2,})\b/g, (m: string) => safeWords.has(m) ? m : '[Name]');
    cleaned = stripPercent(cleaned);
    cleaned = cleaned.replace(/\u0000NAME\u0000/g, '[Name]').replace(/\u0000SCORE\u0000/g, '[Score]');
    addSection({
      id: makeId(), type: 'personalised-comment', name, openerType: 'name', positionType: 'personalised-comment',
      data: { instruction: 'Enter the score or information for this pupil', categories: { 'Assessment Score': [cleaned] } },
    });
  };

  // ─── VARIETY GENERATION ───────────────────────────────────────────────────

  const handleGenerateVariety = async () => {
    const selected = sectionsForVariety.filter(s => s.selected);
    if (selected.length === 0) { navigate('/template-review', { state: { template: { name: generatedTemplate?.name, sections: generatedTemplate?.sections } } }); return; }
    setIsGeneratingVariety(true);
    setVarietyProgress(0);
    let updatedSections = [...(generatedTemplate?.sections || [])];
    for (let i = 0; i < selected.length; i++) {
      const { section } = selected[i];
      setVarietyProgress(Math.round((i / selected.length) * 100));
      setLoadingMessage(`Adding variety to "${section.name}"... (${i + 1}/${selected.length})`);
      try {
        const isNextSteps = section.type === 'next-steps';
        const existingHeadings = isNextSteps
          ? Object.entries(section.data?.focusAreas || {}).map(([name, comments]) => ({ name, comments }))
          : Object.entries(section.data?.comments || {}).map(([name, comments]) => ({ name, comments }));
        const result = await callApi({ mode: 'generate-variety', subject, yearGroup, pronounSet, sectionName: section.name, openerType: section.openerType, existingHeadings });
        updatedSections = updatedSections.map(s => {
          if (s.name !== section.name) return s;
          if (isNextSteps) {
            const focusAreas = { ...s.data.focusAreas };
            result.headings?.forEach((h: { name: string; newOptions: string[] }) => { const opts = h.newOptions || []; if (opts.length === 0) return; if (focusAreas[h.name]) focusAreas[h.name] = [...focusAreas[h.name], ...opts]; });
            return { ...s, data: { ...s.data, focusAreas } };
          } else {
            const comments = { ...s.data.comments };
            result.headings?.forEach((h: { name: string; newOptions: string[] }) => { const opts = h.newOptions || []; if (opts.length === 0) return; if (comments[h.name]) comments[h.name] = [...comments[h.name], ...opts]; });
            return { ...s, data: { ...s.data, comments } };
          }
        });
      } catch { console.error(`Variety generation failed for ${section.name}`); }
    }
    setVarietyProgress(100);
    setIsGeneratingVariety(false);
    navigate('/template-review', { state: { template: { name: generatedTemplate?.name, sections: updatedSections } } });
  };

  const handleAssemble = () => {
    setIsLoading(true);
    setLoadingMessage('Assembling your template...');
    setMainStep('generating');
    callApi({ mode: 'assemble', subject, yearGroup, pronounSet, builtSections })
      .then(data => {
        if (!data.templateName || !data.sections) throw new Error('Invalid template');
        const normalisedSections = normaliseTemplateSections(data.sections, pronounSet);
        setGeneratedTemplate({ name: templateName.trim() || data.templateName, sections: normalisedSections });
        const varietyEligible = builtSections.filter(s => s.type === 'qualities' || s.type === 'next-steps');
        setSectionsForVariety(varietyEligible.map(s => ({ section: s, selected: true })));
        setMainStep('variety');
      })
      .catch(err => { setError(err.message); setMainStep('builder'); })
      .finally(() => setIsLoading(false));
  };

  const handleReset = () => {
    setMainStep('paste'); setSubject(''); setYearGroup(''); setRawReportText('');
    setPronounSet('they/their'); setBuiltSections([]); setGeneratedTemplate(null);
    setError(null); clearSelection(); setCurrentSection(null); setSubMenu(null);
    setMenuOpen(false); setAssessPartIndex(1); setAssessSectionName('');
    setPiName(''); setPiInstruction('');
  };

  const getSectionTypeColor = (type: string) => ({
    'standard-comment': '#10b981', 'assessment-comment': '#8b5cf6', 'personalised-comment': '#f59e0b',
    'next-steps': '#06b6d4', 'qualities': '#f59e0b', 'rated-comment': '#3b82f6',
    'new-line': '#9ca3af', 'optional-additional-comment': '#ef4444',
  }[type] || '#6b7280');

  const getBuiltSectionTypeLabel = (type: string) => ({
    'standard-comment': 'Standard', 'assessment-comment': 'Assessment', 'personalised-comment': 'Personal Info',
    'next-steps': 'Next Steps', 'qualities': 'Choice', 'rated-comment': 'Rated',
    'new-line': 'Line Break', 'optional-additional-comment': 'Optional',
  }[type] || type);

  // ─── LOADING SCREEN ───────────────────────────────────────────────────────

  if (isLoading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>{mainStep === 'generating' ? '🪄' : '🔍'}</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
          {mainStep === 'generating' ? 'Building Your Template' : 'Reading Your Reports'}
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>{loadingMessage}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i*0.2}s` }} />)}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
        <p style={{ margin: '20px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>This may take 15–30 seconds</p>
      </div>
    </div>
  );

  // ─── STEP: PREVIEW ───────────────────────────────────────────────────────

  if (mainStep === 'preview') {
    const sampleText = assembleSampleReport(previewSections);
    const sectionCounts: Record<string, number> = {};
    previewSections.forEach(s => { if (s.type !== 'new-line') sectionCounts[s.type] = (sectionCounts[s.type] || 0) + 1; });
    const sectionTypeLabels: Record<string, string> = { 'rated-comment': 'Progress', 'qualities': 'Qualities', 'next-steps': 'Next Steps', 'standard-comment': 'Fixed text', 'personalised-comment': 'Personalised', 'assessment-comment': 'Assessment' };
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{previewFinalName}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{subject} · Template preview</div>
          </div>
          <button onClick={() => setMainStep('paste')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Try again</button>
        </div>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>✅</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#15803d', marginBottom: '4px' }}>Template built successfully</div>
              <div style={{ fontSize: '13px', color: '#166534' }}>{previewSections.filter(s => s.type !== 'new-line').length} sections built. Below is a sample report assembled automatically from your template — one option picked from each section.</div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample Report — Alex</div>
            <p style={{ margin: 0, fontSize: '14px', color: '#111827', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{sampleText || 'No sample could be assembled — check that sections have content.'}</p>
          </div>

          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>Sections built</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(sectionCounts).map(([type, count]) => (
                <span key={type} style={{ backgroundColor: '#f3f4f6', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  {sectionTypeLabels[type] || type} × {count}
                </span>
              ))}
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>In Report Writer you'll see all options for each section and pick the right one for each pupil.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => { const newId = addTemplate({ name: previewFinalName, sections: previewSections }); navigate('/write-reports', { state: { preselectedClassId: classId, preselectedTemplateId: newId } }); }} style={{ backgroundColor: '#10b981', color: 'white', padding: '16px', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>
              Save Template and Continue
            </button>
            <button onClick={() => setMainStep('paste')} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px', fontSize: '14px', color: '#6b7280', cursor: 'pointer', width: '100%' }}>
              Go back and try again with different reports or settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: SETUP ─────────────────────────────────────────────────────────

  const SUBJECT_ICONS: Record<string, string> = { 'PE': '🏃', 'English': '📖', 'Maths': '📐', 'Science': '🔬', 'History': '🏛️', 'Geography': '🌍', 'Modern Languages': '💬', 'Art & Design': '🎨', 'Music': '🎵', 'Generic': '📋' };

  if (mainStep === 'setup') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>AI Quick Build</div>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>AI Quick Build</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 28px 0', lineHeight: '1.6' }}>Name your template and choose your subject, then paste your reports and the AI will build your template automatically.</p>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Template Name *</label>
            <input type="text" value={templateName} onChange={e => { setTemplateName(e.target.value); if (error) setError(null); }} placeholder="e.g. S3 History Reports" style={{ width: '100%', padding: '10px 14px', border: `2px solid ${error ? '#ef4444' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} autoFocus onKeyDown={e => { if (e.key === 'Enter' && templateName.trim()) { setError(null); setMainStep('paste'); } }} />
          </div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>Select your subject:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => { if (!templateName.trim()) { setError('Please enter a template name first.'); return; } setError(null); setSubject(s); setMainStep('paste'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: 'white', border: `2px solid ${subject === s ? '#8b5cf6' : '#e5e7eb'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left' as const, fontSize: '14px', fontWeight: '600', color: '#111827', fontFamily: 'inherit' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.backgroundColor = '#f5f3ff'; }} onMouseLeave={e => { if (subject !== s) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; } }}>
                <span style={{ fontSize: '22px' }}>{SUBJECT_ICONS[s]}</span><span>{s}</span>
              </button>
            ))}
          </div>
          {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: '12px 0 0 0' }}>{error}</p>}
        </div>
      </div>
    </div>
  );

  // ─── STEP: PASTE ──────────────────────────────────────────────────────────

  if (mainStep === 'paste') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{templateName}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{subject} · AI Quick Build</div>
        </div>
        <button onClick={() => setMainStep('setup')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>Year Group (optional)</label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} style={inp}><option value="">Select...</option>{['S1','S2','S3','S4','S5','S6','Mixed'].map(y => <option key={y}>{y}</option>)}</select></div>
          </div>
        </div>
        <div style={card}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Pronoun Set</h2>
          <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
            Choose the pronoun set used in the reports you are pasting. This will be applied consistently throughout your template.
            Once built, you can automatically create additional versions of the template for other pronoun sets.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {(['he/his', 'she/her', 'they/their'] as PronounSet[]).map(p => (
              <button key={p} onClick={() => setPronounSet(p)} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', border: pronounSet === p ? '2px solid #3b82f6' : '2px solid #e5e7eb', backgroundColor: pronounSet === p ? '#eff6ff' : 'white' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: pronounSet === p ? '#1d4ed8' : '#111827' }}>{p === 'he/his' ? 'He / His' : p === 'she/her' ? 'She / Her' : 'They / Their'}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div><h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Paste Your Reports *</h2><p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Paste all reports — the more the better. Up to ~60,000 characters.</p></div>
            <span style={{ fontSize: '12px', color: rawReportText.length > 55000 ? '#ef4444' : '#6b7280' }}>{rawReportText.length.toLocaleString()} / 60,000</span>
          </div>
          <textarea value={rawReportText} onChange={e => setRawReportText(e.target.value)} placeholder="Paste all your reports here..." style={{ ...txa, minHeight: '300px' }} />
        </div>
        <div style={card}>
          <button onClick={() => setShowStructureForm(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Describe your report structure <span style={{ fontSize: '13px', fontWeight: '400', color: '#6b7280' }}>— recommended</span></h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Tell the AI what each part of your report contains — this greatly improves accuracy for unstructured reports</p>
            </div>
            <span style={{ fontSize: '18px', color: '#9ca3af', flexShrink: 0, marginLeft: '12px' }}>{showStructureForm ? '▲' : '▼'}</span>
          </button>
          {showStructureForm && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                Add a row for each part of your report, in order. Describe what content it contains — the AI will use this to correctly classify every sentence.
              </p>
              {reportStructureSections.map((sec, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <input
                    type="text" value={sec.name} placeholder={`Section ${i + 1} name`}
                    onChange={e => setReportStructureSections(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                    style={{ ...inp, flex: '0 0 160px', fontSize: '13px' }}
                  />
                  <input
                    type="text" value={sec.contents} placeholder="What this section contains, e.g. Progress statement. Strengths. Target grade."
                    onChange={e => setReportStructureSections(prev => prev.map((s, j) => j === i ? { ...s, contents: e.target.value } : s))}
                    style={{ ...inp, flex: 1, fontSize: '13px' }}
                  />
                  {reportStructureSections.length > 1 && (
                    <button onClick={() => setReportStructureSections(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', padding: '6px', flexShrink: 0 }}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setReportStructureSections(prev => [...prev, { name: '', contents: '' }])} style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '6px', color: '#6b7280', cursor: 'pointer', fontSize: '13px', padding: '6px 14px', marginTop: '4px' }}>+ Add section</button>
            </div>
          )}
        </div>
        {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '12px', color: '#b91c1c', fontSize: '14px' }}>⚠️ {error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleQuickBuild} style={{ ...btnP, width: '100%', padding: '16px', fontSize: '16px' }}>⚡ Quick Build with AI — 2 minutes</button>
          <button onClick={() => {
            if (!subject.trim()) { setError('Please enter the subject.'); return; }
            if (!rawReportText.trim()) { setError('Please paste your reports.'); return; }
            setError(null); setMainStep('builder');
          }} style={{ ...btnS, width: '100%', padding: '16px', fontSize: '16px', textAlign: 'center' }}>
            🪄 Guided Wizard — highlight section by section
          </button>
        </div>
      </main>
    </div>
  );

  // ─── STEP: BUILDER ────────────────────────────────────────────────────────

  if (mainStep === 'builder') {
    const lastBuiltSection = builtSections.length > 0 ? builtSections[builtSections.length - 1] : null;
    const canCopyLast = lastBuiltSection && (lastBuiltSection.type === 'qualities' || lastBuiltSection.type === 'next-steps');
    return (
      <div style={{ height: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, zIndex: 10, position: 'sticky', top: 0 }}>
          <button onClick={() => setMainStep('paste')} style={btnS}>← Back</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>🪄 {subject} {yearGroup} — Build Template</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{builtSections.length} section{builtSections.length !== 1 ? 's' : ''} built — highlight text from reports, then choose section type</p>
          </div>
          {builtSections.length > 0 && <button onClick={handleAssemble} style={{ ...btnG, padding: '10px 20px' }}>🪄 Generate Template</button>}
        </header>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 65px)' }}>
          <div style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', borderRight: '2px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>📄 Your Reports</span>
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{rawReportText.length.toLocaleString()} characters</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {pendingSelection && <button data-selection-control="true" onClick={addToSelection} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Add to selection ({pendingSelection.length} chars)</button>}
                {accumulatedText && <span style={{ fontSize: '12px', color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '3px 8px' }}>✓ {accumulatedText.split('\n\n').length} extract{accumulatedText.split('\n\n').length !== 1 ? 's' : ''} — {accumulatedText.length} chars</span>}
                {accumulatedText && <button data-selection-control="true" onClick={clearSelection} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', padding: '0' }}>Clear all</button>}
                {!accumulatedText && !pendingSelection && <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Highlight text with your mouse, then click + Add</span>}
              </div>
            </div>
            <div ref={reportPanelRef} style={{ flex: 1, overflow: 'auto', padding: '16px', fontSize: '13px', lineHeight: '1.8', color: '#374151', whiteSpace: 'pre-wrap', userSelect: 'text', cursor: 'text', backgroundColor: 'white', textAlign: 'left' }}>
              {rawReportText}
            </div>
          </div>
          <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {(accumulatedText || pendingSelection) && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', margin: '8px 12px 0', borderRadius: '8px', padding: '10px 12px', flexShrink: 0 }}>
                {pendingSelection && !accumulatedText && <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#1e40af' }}>💡 Click <strong>+ Add to selection</strong> in the top bar to add this highlight</p>}
                {accumulatedText && <>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#166534' }}>✓ {accumulatedText.split('\n\n').length} extract{accumulatedText.split('\n\n').length !== 1 ? 's' : ''} ready — {accumulatedText.length} chars total</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#15803d', lineHeight: '1.4' }}>"{accumulatedText.substring(0, 120)}{accumulatedText.length > 120 ? '...' : ''}"</p>
                  {pendingSelection && <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#1e40af' }}>+ New highlight ready to add</p>}
                </>}
              </div>
            )}
            {error && <div style={{ margin: '8px 12px 0', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#b91c1c', flexShrink: 0 }}>⚠️ {error}</div>}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {canCopyLast && (
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#1e40af' }}>📋 Add a copy of "{lastBuiltSection!.name}"?</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#3b82f6' }}>Same headings and options — different opener for building flowing paragraphs</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleCopySection(lastBuiltSection!, 'name')} style={{ ...btnP, padding: '6px 12px', fontSize: '12px' }}>+ Copy with [Name]</button>
                    <button onClick={() => handleCopySection(lastBuiltSection!, 'pronoun')} style={{ ...btnV, padding: '6px 12px', fontSize: '12px' }}>+ Copy with {pronounCapital}</button>
                  </div>
                </div>
              )}
              {!subMenu && (
                <div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{selectionActive ? 'What type of section is this?' : 'What would you like to add?'}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => setSubMenu('rating')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}><div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>⭐ Rating / Judgement Statement</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Progress, effort, attainment — how well they are doing</div></button>
                    <button onClick={() => setSubMenu('qualities')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}><div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>🎯 Pupil Qualities</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Character, effort, behaviour, attitude, working style</div></button>
                    <button onClick={() => setSubMenu('personalinfo')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}><div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>👤 Personal Information</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Sentences where a unique detail per pupil is typed in — sport, grade, personal goal</div></button>
                    <button onClick={() => setSubMenu('standard')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}><div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>📌 Standard Comment or Comments</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Fixed text or selectable options — no AI</div></button>
                    <button onClick={() => setSubMenu('assessment')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}><div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>📊 Assessment Score</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Test results, with or without a numeric score</div></button>
                    <button onClick={() => setSubMenu('development')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#06b6d4'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}><div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>📈 Areas for Development</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>What the pupil needs to improve</div></button>
                    <button onClick={() => setSubMenu('nextsteps')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#06b6d4'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}><div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>🚀 Next Steps</div><div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Forward-looking improvement suggestions</div></button>
                  </div>
                  {builtSections.length > 0 && <button onClick={handleAssemble} style={{ ...btnG, width: '100%', padding: '14px', marginTop: '16px', fontSize: '15px' }}>🪄 Generate My Template ({builtSections.length} sections)</button>}
                </div>
              )}
              {subMenu === 'rating' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}><p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the progress/rating sentences from several reports on the left, then choose your scale below.</p></div>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" placeholder="e.g. Overall Progress, Effort" style={inp} id="rating-name-input" defaultValue="Progress" /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button disabled={!accumulatedText} onClick={() => { const nameEl = document.getElementById('rating-name-input') as HTMLInputElement; handleExtractAndAdd('rating', 'name', nameEl?.value || 'Progress', 'four-level'); }} style={{ ...btnP, opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', textAlign: 'left', padding: '12px' }}><div style={{ fontWeight: '700' }}>A) Standard 4-level scale</div><div style={{ fontSize: '12px', opacity: 0.9 }}>Excellent · Good · Satisfactory · Needs Improvement</div></button>
                    <button disabled={!accumulatedText} onClick={() => { const nameEl = document.getElementById('rating-name-input') as HTMLInputElement; handleExtractAndAdd('rating', 'name', nameEl?.value || 'Progress', 'own'); }} style={{ ...btnV, opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', textAlign: 'left', padding: '12px' }}><div style={{ fontWeight: '700' }}>B) My own scale from my reports</div><div style={{ fontSize: '12px', opacity: 0.9 }}>Claude identifies your own groupings</div></button>
                  </div>
                </div>
              )}
              {subMenu === 'qualities' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}><p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the qualities/strengths sentences from several reports on the left. Include a range of different types of pupil. Claude will find ALL similar sentences across all reports.</p></div>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" placeholder="e.g. Personal Qualities, Strengths" style={inp} id="qualities-name-input" defaultValue="Personal Qualities" /></div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Opener</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button id="q-name-btn" onClick={() => { document.getElementById('q-name-btn')!.style.border='2px solid #3b82f6'; document.getElementById('q-pron-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '2px solid #3b82f6', borderRadius: '6px', backgroundColor: '#eff6ff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>[Name]</button>
                      <button id="q-pron-btn" onClick={() => { document.getElementById('q-pron-btn')!.style.border='2px solid #8b5cf6'; document.getElementById('q-name-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}>{pronounCapital}</button>
                    </div>
                  </div>
                  <button disabled={!accumulatedText} onClick={() => { const nameEl = document.getElementById('qualities-name-input') as HTMLInputElement; const prnBtn = document.getElementById('q-pron-btn') as HTMLButtonElement; const opener: OpenerType = prnBtn?.style.border.includes('8b5cf6') ? 'pronoun' : 'name'; handleExtractAndAdd('qualities', opener, nameEl?.value || 'Personal Qualities'); }} style={{ ...btnP, width: '100%', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', padding: '12px' }}>{selectionActive ? '✓ Extract all quality sentences from reports' : '← Highlight & add text from reports first'}</button>
                </div>
              )}
              {subMenu === 'personalinfo' && (
                <div>
                  <button onClick={() => { setSubMenu(null); setPiName(''); setPiInstruction(''); setError(null); }} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}><p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight example sentences that contain a personal detail unique to each pupil — like a sport, target grade, or personal goal. Claude will find all similar sentences and replace the unique detail with [Info 1], [Info 2] etc.</p></div>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" value={piName} onChange={e => setPiName(e.target.value)} placeholder="e.g. Focus Sport, Target Grade, Personal Goal" style={inp} /></div>
                  <div style={{ marginBottom: '12px' }}><label style={lbl}>Instruction for teacher</label><input type="text" value={piInstruction} onChange={e => setPiInstruction(e.target.value)} placeholder="e.g. Enter this pupil's chosen sport" style={inp} /></div>
                  <button disabled={!accumulatedText || !piName.trim()} onClick={() => handleExtractAndAdd('personalised-comment', 'name', piName.trim() || 'Personal Information')} style={{ ...btnP, width: '100%', opacity: (accumulatedText && piName.trim()) ? 1 : 0.4, cursor: (accumulatedText && piName.trim()) ? 'pointer' : 'not-allowed', padding: '12px' }}>{accumulatedText ? '✓ Extract all sentences of this type from reports' : '← Highlight & add text from reports first'}</button>
                </div>
              )}
              {subMenu === 'standard' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}><p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 No AI involvement. Paste the text directly. Replace any pupil names with [Name] before pasting.</p></div>
                  {!subMenu?.includes('|') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => { setStdType('single'); setSubMenu('standard|single'); }} style={{ ...btnP, textAlign: 'left', padding: '12px' }}><div style={{ fontWeight: '700' }}>A) One fixed text for all reports</div><div style={{ fontSize: '12px', opacity: 0.9 }}>Course description, assessment analysis, etc.</div></button>
                      <button onClick={() => { setStdType('multi'); setSubMenu('standard|multi'); }} style={{ ...btnV, textAlign: 'left', padding: '12px' }}><div style={{ fontWeight: '700' }}>B) Different options per pupil</div><div style={{ fontSize: '12px', opacity: 0.9 }}>Pathway options, course levels, etc.</div></button>
                    </div>
                  )}
                </div>
              )}
              {subMenu === 'standard|single' && (
                <div>
                  <button onClick={() => setSubMenu('standard')} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" value={stdName} onChange={e => setStdName(e.target.value)} placeholder="e.g. Course Content, Assessment Analysis" style={inp} /></div>
                  <div style={{ marginBottom: '12px' }}><label style={lbl}>Text (replace pupil names with [Name])</label><textarea value={stdContent} onChange={e => setStdContent(e.target.value)} placeholder="Paste the text here..." style={{ ...txa, minHeight: '100px' }} /></div>
                  <button onClick={() => { if (!stdName.trim() || !stdContent.trim()) { setError('Please enter a name and content.'); return; } addSection({ id: makeId(), type: 'standard-comment', name: stdName.trim(), openerType: 'name', positionType: 'standard', data: { content: stdContent.trim() } }); setStdName(''); setStdContent(''); }} style={{ ...btnG, width: '100%' }}>Add Standard Comment</button>
                </div>
              )}
              {subMenu === 'standard|multi' && (
                <div>
                  <button onClick={() => setSubMenu('standard')} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" value={stdName} onChange={e => setStdName(e.target.value)} placeholder="e.g. Pathway Information" style={inp} /></div>
                  {stdOptions.map((opt, i) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', marginBottom: '8px', backgroundColor: '#f9fafb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Option {i+1}</span>
                        {i > 0 && <button onClick={() => setStdOptions(prev => prev.filter((_,j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>}
                      </div>
                      <input type="text" value={opt.label} onChange={e => { const u=[...stdOptions]; u[i]={...u[i],label:e.target.value}; setStdOptions(u); }} placeholder="Button label e.g. National 5 Pathway" style={{ ...inp, marginBottom: '6px' }} />
                      <textarea value={opt.content} onChange={e => { const u=[...stdOptions]; u[i]={...u[i],content:e.target.value}; setStdOptions(u); }} placeholder="Paste text (replace names with [Name])..." style={{ ...txa, minHeight: '80px' }} />
                    </div>
                  ))}
                  <button onClick={() => setStdOptions(prev => [...prev, {label:'', content:''}])} style={{ ...btnS, width: '100%', marginBottom: '8px', fontSize: '12px' }}>+ Add Another Option</button>
                  <button onClick={() => { const valid = stdOptions.filter(o => o.label.trim() && o.content.trim()); if (!stdName.trim() || valid.length === 0) { setError('Please enter a name and at least one option.'); return; } const comments: Record<string, string[]> = {}; valid.forEach(o => { comments[o.label.trim()] = [o.content.trim()]; }); addSection({ id: makeId(), type: 'qualities', name: stdName.trim(), openerType: 'name', positionType: 'standard-multi', data: { comments } }); setStdName(''); setStdOptions([{label:'', content:''}]); }} style={{ ...btnG, width: '100%' }}>Add Section</button>
                </div>
              )}
              {subMenu === 'assessment' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}><p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the assessment sentence(s) from your reports, name the section, then choose which type fits.</p></div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={lbl}>Section name <span style={{ color: '#9ca3af', fontWeight: '400' }}>(e.g. MQS Assessment, Calculator Test)</span></label>
                    <input type="text" value={assessSectionName} onChange={e => setAssessSectionName(e.target.value)} placeholder="Assessment" style={inp} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button disabled={!accumulatedText} onClick={() => { handleBuildSameAssessment(assessSectionName.trim() || 'Assessment'); setAssessSectionName(''); }} style={{ ...btnP, textAlign: 'left', padding: '12px', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed' }}><div style={{ fontWeight: '700' }}>A) Same sentence — only score changes per pupil</div><div style={{ fontSize: '12px', opacity: 0.9 }}>e.g. "[Name] scored [Score] in the assessment"</div></button>
                    <button disabled={!accumulatedText} onClick={() => { handleExtractAndAdd('assessment-comment', 'name', assessSectionName.trim() || 'Assessment'); setAssessSectionName(''); }} style={{ ...btnV, textAlign: 'left', padding: '12px', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed' }}><div style={{ fontWeight: '700' }}>B) Different sentences by performance level</div><div style={{ fontSize: '12px', opacity: 0.9 }}>Claude groups them by strong/good/satisfactory/struggling</div></button>
                  </div>
                  {!accumulatedText && <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>← Highlight assessment text from your reports first</p>}
                </div>
              )}
              {subMenu === 'development' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}><p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the Areas for Development sentences from several reports. Claude will find ALL development sentences across all reports and group by topic.</p></div>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" placeholder="e.g. Areas for Development" style={inp} id="dev-name-input" defaultValue="Areas for Development" /></div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Opener</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button id="dev-name-btn" onClick={() => { document.getElementById('dev-name-btn')!.style.border='2px solid #3b82f6'; document.getElementById('dev-pron-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '2px solid #3b82f6', borderRadius: '6px', backgroundColor: '#eff6ff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>[Name]</button>
                      <button id="dev-pron-btn" onClick={() => { document.getElementById('dev-pron-btn')!.style.border='2px solid #8b5cf6'; document.getElementById('dev-name-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}>{pronounCapital}</button>
                    </div>
                  </div>
                  <button disabled={!accumulatedText} onClick={() => { const nameEl = document.getElementById('dev-name-input') as HTMLInputElement; const prnBtn = document.getElementById('dev-pron-btn') as HTMLButtonElement; const opener: OpenerType = prnBtn?.style.border.includes('8b5cf6') ? 'pronoun' : 'name'; handleExtractAndAdd('development', opener, nameEl?.value || 'Areas for Development'); }} style={{ ...btnP, width: '100%', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', padding: '12px' }}>{selectionActive ? '✓ Extract all development sentences from reports' : '← Highlight & add text from reports first'}</button>
                </div>
              )}
              {subMenu === 'nextsteps' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}><p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the next steps sentences from several reports. Claude will group by topic.</p></div>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" placeholder="e.g. Next Steps, Moving Forward" style={inp} id="ns-name-input" defaultValue="Next Steps" /></div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Opener</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button id="ns-name-btn" onClick={() => { document.getElementById('ns-name-btn')!.style.border='2px solid #3b82f6'; document.getElementById('ns-pron-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '2px solid #3b82f6', borderRadius: '6px', backgroundColor: '#eff6ff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>[Name]</button>
                      <button id="ns-pron-btn" onClick={() => { document.getElementById('ns-pron-btn')!.style.border='2px solid #8b5cf6'; document.getElementById('ns-name-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}>{pronounCapital}</button>
                    </div>
                  </div>
                  <button disabled={!accumulatedText} onClick={() => { const nameEl = document.getElementById('ns-name-input') as HTMLInputElement; const prnBtn = document.getElementById('ns-pron-btn') as HTMLButtonElement; const opener: OpenerType = prnBtn?.style.border.includes('8b5cf6') ? 'pronoun' : 'name'; handleExtractAndAdd('next-steps', opener, nameEl?.value || 'Next Steps'); }} style={{ ...btnP, width: '100%', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', padding: '12px' }}>{selectionActive ? '✓ Extract all next steps sentences from reports' : '← Highlight & add text from reports first'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: VARIETY ────────────────────────────────────────────────────────

  if (mainStep === 'variety') {
    if (isGeneratingVariety) return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', textAlign: 'center', maxWidth: '440px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✨</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Generating Variety Options</h2>
          <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>{loadingMessage}</p>
          <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', height: '8px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ backgroundColor: '#8b5cf6', height: '100%', width: `${varietyProgress}%`, transition: 'width 0.3s ease', borderRadius: '8px' }} />
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{varietyProgress}% complete</p>
        </div>
      </div>
    );
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setMainStep('builder')} style={btnS}>← Back</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>✨ Add Variety Options?</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Your template contains your exact sentences. Claude can add extra options in your voice.</p>
          </div>
          <button onClick={() => { if (generatedTemplate) { addTemplate({ name: generatedTemplate.name, sections: generatedTemplate.sections }); alert(`"${generatedTemplate.name}" saved. You can continue to add variety or close.`); } }} style={{ ...btnG, padding: '10px 16px', fontSize: '14px' }}>💾 Save Now</button>
        </header>
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '2px solid #8b5cf6', padding: '16px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#111827' }}>What happens next?</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>Your template currently contains <strong>only your exact sentences</strong> from the reports — nothing AI-generated. If you want more variety (so teachers have more options to choose from per heading), select the sections below and Claude will add 1-2 additional options per heading, written to match your voice and style.</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Or skip this and go straight to the review page.</p>
          </div>
          {sectionsForVariety.length > 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '12px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>Select sections to add variety to:</h3>
              {sectionsForVariety.map((item, i) => (
                <div key={item.section.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < sectionsForVariety.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <input type="checkbox" checked={item.selected} onChange={() => setSectionsForVariety(prev => prev.map((s, idx) => idx === i ? { ...s, selected: !s.selected } : s))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ backgroundColor: getSectionTypeColor(item.section.type), color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '3px', marginRight: '6px' }}>{getBuiltSectionTypeLabel(item.section.type)}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{item.section.name}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>{item.section.type === 'next-steps' ? `${Object.keys(item.section.data?.focusAreas || {}).length} focus areas` : `${Object.keys(item.section.data?.comments || {}).length} headings`}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>No sections eligible for variety generation.</p>
            </div>
          )}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', fontSize: '13px', color: '#166534' }}>💡 Tip: Use <strong>Save Now</strong> in the top bar to save the exact-sentences version before adding variety.</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/template-review', { state: { template: { name: generatedTemplate?.name, sections: generatedTemplate?.sections } } })} style={{ ...btnS, flex: 1, padding: '14px', fontSize: '15px' }}>Skip — Go to Review</button>
            <button onClick={handleGenerateVariety} disabled={!sectionsForVariety.some(s => s.selected)} style={{ ...btnV, flex: 1, padding: '14px', fontSize: '15px', opacity: sectionsForVariety.some(s => s.selected) ? 1 : 0.4, cursor: sectionsForVariety.some(s => s.selected) ? 'pointer' : 'not-allowed' }}>✨ Generate Variety & Review</button>
          </div>
        </main>
      </div>
    );
  }

  // ─── STEP: GENERATING ────────────────────────────────────────────────────

  if (mainStep === 'generating') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🪄</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Assembling Your Template</h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>{loadingMessage}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i*0.2}s` }} />)}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    </div>
  );

  return null;
}