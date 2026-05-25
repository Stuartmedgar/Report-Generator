// src/pages/ImportTemplate.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';
import PageNav from '../components/PageNav';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type PronounSet = 'he/his' | 'she/her' | 'they/their';
type OpenerType = 'name' | 'pronoun';
type MainStep = 'paste' | 'builder' | 'variety' | 'generating' | 'preview' | 'saved';
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
  const { addTemplate } = useData();

  // Core state
  const [mainStep, setMainStep] = useState<MainStep>('paste');
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [pronounSet, setPronounSet] = useState<PronounSet>('they/their');
  const [rawReportText, setRawReportText] = useState('');
  const [builtSections, setBuiltSections] = useState<BuiltSection[]>([]);
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');



  // Selection state - accumulated
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

  // Standard comment state (no AI)
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

  const clearSelection = () => {
    setSelectedText('');
    setAccumulatedText('');
    setPendingSelection('');
    setSelectionActive(false);
    window.getSelection()?.removeAllRanges();
  };

  const addToSelection = () => {
    if (!pendingSelection) return;
    const newAccumulated = accumulatedText
      ? accumulatedText + '\n\n' + pendingSelection
      : pendingSelection;
    setAccumulatedText(newAccumulated);
    setSelectedText(newAccumulated);
    setSelectionActive(true);
    setPendingSelection('');
    window.getSelection()?.removeAllRanges();
  };

  // ─── API CALLS ─────────────────────────────────────────────────────────────

  const callApi = async (body: any) => {
    const response = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('API call failed');
    return response.json();
  };


  // ─── POST-PROCESS: SPLIT SECTIONS BY typicalCount ─────────────────────────

  const splitSections = (sections: any[], typicalCounts: Record<string, number>): any[] => {
    const result: any[] = [];
    sections.forEach(section => {
      if (section.type === 'new-line') { result.push(section); return; }
      const typicalCount = typicalCounts[section.name] || 1;
      if (typicalCount > 1 && (section.type === 'qualities' || section.type === 'next-steps')) {
        const isNextSteps = section.type === 'next-steps';
        const headings = isNextSteps
          ? Object.entries(section.data?.focusAreas || {})
          : Object.entries(section.data?.comments || {});
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

  const handleQuickBuild = async () => {
    if (!subject.trim()) { setError('Please enter the subject.'); return; }
    if (!rawReportText.trim()) { setError('Please paste your reports.'); return; }
    setError(null);
    setIsLoading(true);
    setLoadingMessage('Reading your reports and identifying sections...');
    try {
      const identified = await callApi({ mode: 'identify-sections', subject, yearGroup, reportText: rawReportText });
      const identifiedSections = (identified.sections || []).filter((s: any) => s.type !== 'new-line');
      if (identifiedSections.length === 0) throw new Error('Could not identify sections');
      setLoadingMessage('Building your template automatically...');
      const result = await callApi({
        mode: 'auto-build',
        subject,
        yearGroup,
        pronounSet,
        reportText: rawReportText,
        builtSections: identifiedSections,
      });
      // Build typicalCount map
      const typicalCountMap: Record<string, number> = {};
      identifiedSections.forEach((s: any) => { typicalCountMap[s.name] = s.typicalCount || 1; });

      if (!result.sections || result.sections.length === 0) throw new Error('No sections returned');

      // Add IDs and normalise section data
      const sections = result.sections.map((s: any) => ({
        ...s,
        id: makeId(),
        data: s.data || {},
      }));

      const normalisedSections = normaliseTemplateSections(sections, pronounSet);
      const splitResult = splitSections(normalisedSections, typicalCountMap);
      setGeneratedTemplate({ name: result.templateName || `${subject} ${yearGroup} Report Template`, sections: splitResult });

      // Set up variety for eligible sections
      const builtForVariety = splitResult
        .filter((s: any) => s.type === 'qualities' || s.type === 'next-steps')
        .map((s: any) => ({
          section: {
            id: s.id,
            type: s.type,
            name: s.name,
            openerType: 'name' as OpenerType,
            positionType: s.type,
            data: s.data,
          },
          selected: true,
        }));
      setSectionsForVariety(builtForVariety);
      setMainStep('variety');
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
    setLoadingMessage(`Reading all reports to extract ${sectionName} sentences...`);
    try {
      const result = await callApi({
        mode: 'extract-only',
        subject, yearGroup, reportText: rawReportText,
        pronounSet, openerType, sectionName, positionType,
        scaleType: scaleType || 'own',
        selectedText,
        piInstruction,
      });

      const isNextSteps = positionType === 'next-steps' || positionType === 'development';
      const isAssessment = positionType === 'assessment-comment';
      const isPersonalisedComment = positionType === 'personalised-comment';

      const newSection: BuiltSection = {
        id: makeId(),
        type: isNextSteps ? 'next-steps'
          : isAssessment ? 'assessment-comment'
          : isPersonalisedComment ? 'personalised-comment'
          : 'qualities',
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

        const result = await callApi({
          mode: 'generate-variety',
          subject, yearGroup, pronounSet,
          sectionName: section.name,
          openerType: section.openerType,
          existingHeadings,
        });

        updatedSections = updatedSections.map(s => {
          if (s.name !== section.name) return s;
          if (isNextSteps) {
            const focusAreas = { ...s.data.focusAreas };
            result.headings?.forEach((h: { name: string; newOptions: string[] }) => {
              const opts = h.newOptions || [];
              if (opts.length === 0) return;
              if (focusAreas[h.name]) focusAreas[h.name] = [...focusAreas[h.name], ...opts];
            });
            return { ...s, data: { ...s.data, focusAreas } };
          } else {
            const comments = { ...s.data.comments };
            result.headings?.forEach((h: { name: string; newOptions: string[] }) => {
              const opts = h.newOptions || [];
              if (opts.length === 0) return;
              if (comments[h.name]) comments[h.name] = [...comments[h.name], ...opts];
            });
            return { ...s, data: { ...s.data, comments } };
          }
        });
      } catch {
        console.error(`Variety generation failed for ${section.name}`);
      }
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
        setGeneratedTemplate({ name: data.templateName, sections: normalisedSections });
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

  // ─── STEP: PASTE ──────────────────────────────────────────────────────────

  if (mainStep === 'paste') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <PageNav />
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>🪄 Import from Reports</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>Build a template from your existing reports</p>
      </header>
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={card}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Template Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>Subject *</label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. History" style={inp} /></div>
            <div><label style={lbl}>Year Group</label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} style={inp}><option value="">Select...</option>{['S1','S2','S3','S4','S5','S6','Mixed'].map(y => <option key={y}>{y}</option>)}</select></div>
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
        {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '12px', color: '#b91c1c', fontSize: '14px' }}>⚠️ {error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleQuickBuild} style={{ ...btnP, width: '100%', padding: '16px', fontSize: '16px' }}>
            ⚡ Quick Build with AI — 2 minutes
          </button>
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


  // ─── STEP: BUILDER (split panel) ──────────────────────────────────────────

  if (mainStep === 'builder') {
    const lastBuiltSection = builtSections.length > 0 ? builtSections[builtSections.length - 1] : null;
    const canCopyLast = lastBuiltSection && (lastBuiltSection.type === 'qualities' || lastBuiltSection.type === 'next-steps');
    return (
      <div style={{ height: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, zIndex: 10, position: 'sticky', top: 0 }}>
          <button onClick={() => setMainStep('paste')} style={btnS}>← Back</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>🪄 {subject} {yearGroup} — Build Template</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{builtSections.length} section{builtSections.length !== 1 ? 's' : ''} built — highlight text from reports, then choose section type</p>
          </div>
          {builtSections.length > 0 && (
            <button onClick={handleAssemble} style={{ ...btnG, padding: '10px 20px' }}>🪄 Generate Template</button>
          )}
        </header>

        {/* Split panel body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 65px)' }}>

          {/* LEFT: Reports panel */}
          <div style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', borderRight: '2px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>📄 Your Reports</span>
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{rawReportText.length.toLocaleString()} characters</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {pendingSelection && (
                  <button data-selection-control="true" onClick={addToSelection} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    + Add to selection ({pendingSelection.length} chars)
                  </button>
                )}
                {accumulatedText && (
                  <span style={{ fontSize: '12px', color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '3px 8px' }}>
                    ✓ {accumulatedText.split('\n\n').length} extract{accumulatedText.split('\n\n').length !== 1 ? 's' : ''} — {accumulatedText.length} chars
                  </span>
                )}
                {accumulatedText && (
                  <button data-selection-control="true" onClick={clearSelection} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', padding: '0' }}>Clear all</button>
                )}
                {!accumulatedText && !pendingSelection && (
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Highlight text with your mouse, then click + Add</span>
                )}
              </div>
            </div>
            <div
              ref={reportPanelRef}
              style={{ flex: 1, overflow: 'auto', padding: '16px', fontSize: '13px', lineHeight: '1.8', color: '#374151', whiteSpace: 'pre-wrap', userSelect: 'text', cursor: 'text', backgroundColor: 'white', textAlign: 'left' }}
            >
              {rawReportText}
            </div>
          </div>

          {/* RIGHT: Builder panel */}
          <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

            {/* Selection indicator */}
            {(accumulatedText || pendingSelection) && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', margin: '8px 12px 0', borderRadius: '8px', padding: '10px 12px', flexShrink: 0 }}>
                {pendingSelection && !accumulatedText && (
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#1e40af' }}>
                    💡 Click <strong>+ Add to selection</strong> in the top bar to add this highlight
                  </p>
                )}
                {accumulatedText && (
                  <>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                      ✓ {accumulatedText.split('\n\n').length} extract{accumulatedText.split('\n\n').length !== 1 ? 's' : ''} ready — {accumulatedText.length} chars total
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#15803d', lineHeight: '1.4' }}>
                      "{accumulatedText.substring(0, 120)}{accumulatedText.length > 120 ? '...' : ''}"
                    </p>
                    {pendingSelection && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#1e40af' }}>+ New highlight ready to add</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ margin: '8px 12px 0', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#b91c1c', flexShrink: 0 }}>⚠️ {error}</div>
            )}

            {/* Main action area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>

              {/* Copy last section */}
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

              {/* Add section menu */}
              {!subMenu && (
                <div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    {selectionActive ? 'What type of section is this?' : 'What would you like to add?'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                    <button onClick={() => setSubMenu('rating')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>⭐ Rating / Judgement Statement</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Progress, effort, attainment — how well they are doing</div>
                    </button>

                    <button onClick={() => setSubMenu('qualities')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>🎯 Pupil Qualities</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Character, effort, behaviour, attitude, working style</div>
                    </button>

                    <button onClick={() => setSubMenu('personalinfo')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>👤 Personal Information</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Sentences where a unique detail per pupil is typed in — sport, grade, personal goal</div>
                    </button>

                    <button onClick={() => setSubMenu('standard')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>📌 Standard Comment or Comments</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Fixed text or selectable options — no AI</div>
                    </button>

                    <button onClick={() => setSubMenu('assessment')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>📊 Assessment Score</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Test results, with or without a numeric score</div>
                    </button>

                    <button onClick={() => setSubMenu('development')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#06b6d4'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>📈 Areas for Development</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>What the pupil needs to improve</div>
                    </button>

                    <button onClick={() => setSubMenu('nextsteps')} style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#06b6d4'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>🚀 Next Steps</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Forward-looking improvement suggestions</div>
                    </button>

                  </div>

                  {builtSections.length > 0 && (
                    <button onClick={handleAssemble} style={{ ...btnG, width: '100%', padding: '14px', marginTop: '16px', fontSize: '15px' }}>
                      🪄 Generate My Template ({builtSections.length} sections)
                    </button>
                  )}
                </div>
              )}

              {/* ── RATING sub-menu ── */}
              {subMenu === 'rating' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the progress/rating sentences from several reports on the left, then choose your scale below.</p>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Section name</label>
                    <input type="text" placeholder="e.g. Overall Progress, Effort" style={inp} id="rating-name-input"
                      defaultValue="Progress" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button disabled={!accumulatedText} onClick={() => {
                      const nameEl = document.getElementById('rating-name-input') as HTMLInputElement;
                      handleExtractAndAdd('rating', 'name', nameEl?.value || 'Progress', 'four-level');
                    }} style={{ ...btnP, opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', textAlign: 'left', padding: '12px' }}>
                      <div style={{ fontWeight: '700' }}>A) Standard 4-level scale</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>Excellent · Good · Satisfactory · Needs Improvement</div>
                    </button>
                    <button disabled={!accumulatedText} onClick={() => {
                      const nameEl = document.getElementById('rating-name-input') as HTMLInputElement;
                      handleExtractAndAdd('rating', 'name', nameEl?.value || 'Progress', 'own');
                    }} style={{ ...btnV, opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', textAlign: 'left', padding: '12px' }}>
                      <div style={{ fontWeight: '700' }}>B) My own scale from my reports</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>Claude identifies your own groupings</div>
                    </button>
                  </div>
                </div>
              )}

              {/* ── QUALITIES sub-menu ── */}
              {subMenu === 'qualities' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the qualities/strengths sentences from several reports on the left. Include a range of different types of pupil. Claude will find ALL similar sentences across all reports.</p>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Section name</label>
                    <input type="text" placeholder="e.g. Personal Qualities, Strengths" style={inp} id="qualities-name-input"
                      defaultValue="Personal Qualities" />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Opener</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button id="q-name-btn" onClick={() => { document.getElementById('q-name-btn')!.style.border='2px solid #3b82f6'; document.getElementById('q-pron-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '2px solid #3b82f6', borderRadius: '6px', backgroundColor: '#eff6ff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>[Name]</button>
                      <button id="q-pron-btn" onClick={() => { document.getElementById('q-pron-btn')!.style.border='2px solid #8b5cf6'; document.getElementById('q-name-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}>{pronounCapital}</button>
                    </div>
                  </div>
                  <button disabled={!accumulatedText} onClick={() => {
                    const nameEl = document.getElementById('qualities-name-input') as HTMLInputElement;
                    const prnBtn = document.getElementById('q-pron-btn') as HTMLButtonElement;
                    const opener: OpenerType = prnBtn?.style.border.includes('8b5cf6') ? 'pronoun' : 'name';
                    handleExtractAndAdd('qualities', opener, nameEl?.value || 'Personal Qualities');
                  }} style={{ ...btnP, width: '100%', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', padding: '12px' }}>
                    {selectionActive ? '✓ Extract all quality sentences from reports' : '← Highlight & add text from reports first'}
                  </button>
                </div>
              )}

              {/* ── PERSONAL INFORMATION sub-menu ── */}
              {subMenu === 'personalinfo' && (
                <div>
                  <button onClick={() => { setSubMenu(null); setPiName(''); setPiInstruction(''); setError(null); }} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight example sentences that contain a personal detail unique to each pupil — like a sport, target grade, or personal goal. Claude will find all similar sentences and replace the unique detail with [Info 1], [Info 2] etc.</p>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Section name</label>
                    <input type="text" value={piName} onChange={e => setPiName(e.target.value)} placeholder="e.g. Focus Sport, Target Grade, Personal Goal" style={inp} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={lbl}>Instruction for teacher</label>
                    <input type="text" value={piInstruction} onChange={e => setPiInstruction(e.target.value)}
                      placeholder="e.g. Enter this pupil's chosen sport"
                      style={inp} />
                  </div>
                  <button
                    disabled={!accumulatedText || !piName.trim()}
                    onClick={() => handleExtractAndAdd('personalised-comment', 'name', piName.trim() || 'Personal Information')}
                    style={{ ...btnP, width: '100%', opacity: (accumulatedText && piName.trim()) ? 1 : 0.4, cursor: (accumulatedText && piName.trim()) ? 'pointer' : 'not-allowed', padding: '12px' }}
                  >
                    {accumulatedText ? '✓ Extract all sentences of this type from reports' : '← Highlight & add text from reports first'}
                  </button>
                </div>
              )}

              {/* ── STANDARD sub-menu ── */}
              {subMenu === 'standard' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 No AI involvement. Paste the text directly. Replace any pupil names with [Name] before pasting.</p>
                  </div>
                  {!subMenu?.includes('|') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => { setStdType('single'); setSubMenu('standard|single'); }} style={{ ...btnP, textAlign: 'left', padding: '12px' }}>
                        <div style={{ fontWeight: '700' }}>A) One fixed text for all reports</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>Course description, assessment analysis, etc.</div>
                      </button>
                      <button onClick={() => { setStdType('multi'); setSubMenu('standard|multi'); }} style={{ ...btnV, textAlign: 'left', padding: '12px' }}>
                        <div style={{ fontWeight: '700' }}>B) Different options per pupil</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>Pathway options, course levels, etc.</div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {subMenu === 'standard|single' && (
                <div>
                  <button onClick={() => setSubMenu('standard')} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" value={stdName} onChange={e => setStdName(e.target.value)} placeholder="e.g. Course Content, Assessment Analysis" style={inp} /></div>
                  <div style={{ marginBottom: '12px' }}><label style={lbl}>Text (replace pupil names with [Name])</label><textarea value={stdContent} onChange={e => setStdContent(e.target.value)} placeholder="Paste the text here..." style={{ ...txa, minHeight: '100px' }} /></div>
                  <button onClick={() => {
                    if (!stdName.trim() || !stdContent.trim()) { setError('Please enter a name and content.'); return; }
                    addSection({ id: makeId(), type: 'standard-comment', name: stdName.trim(), openerType: 'name', positionType: 'standard', data: { content: stdContent.trim() } });
                    setStdName(''); setStdContent('');
                  }} style={{ ...btnG, width: '100%' }}>Add Standard Comment</button>
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
                  <button onClick={() => {
                    const valid = stdOptions.filter(o => o.label.trim() && o.content.trim());
                    if (!stdName.trim() || valid.length === 0) { setError('Please enter a name and at least one option.'); return; }
                    const comments: Record<string, string[]> = {};
                    valid.forEach(o => { comments[o.label.trim()] = [o.content.trim()]; });
                    addSection({ id: makeId(), type: 'qualities', name: stdName.trim(), openerType: 'name', positionType: 'standard-multi', data: { comments } });
                    setStdName(''); setStdOptions([{label:'', content:''}]);
                  }} style={{ ...btnG, width: '100%' }}>Add Section</button>
                </div>
              )}

              {/* ── ASSESSMENT sub-menu ── */}
              {subMenu === 'assessment' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the assessment sentence(s) from your reports, name the section, then choose which type fits. Add as many assessment sections as you need for different tests.</p>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={lbl}>Section name <span style={{ color: '#9ca3af', fontWeight: '400' }}>(e.g. MQS Assessment, Calculator Test)</span></label>
                    <input type="text" value={assessSectionName} onChange={e => setAssessSectionName(e.target.value)} placeholder="Assessment" style={inp} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button disabled={!accumulatedText} onClick={() => {
                      handleBuildSameAssessment(assessSectionName.trim() || 'Assessment');
                      setAssessSectionName('');
                    }} style={{ ...btnP, textAlign: 'left', padding: '12px', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed' }}>
                      <div style={{ fontWeight: '700' }}>A) Same sentence — only score changes per pupil</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>e.g. "[Name] scored [Score] in the assessment" — teacher types score per pupil when writing</div>
                    </button>
                    <button disabled={!accumulatedText} onClick={() => {
                      handleExtractAndAdd('assessment-comment', 'name', assessSectionName.trim() || 'Assessment');
                      setAssessSectionName('');
                    }} style={{ ...btnV, textAlign: 'left', padding: '12px', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed' }}>
                      <div style={{ fontWeight: '700' }}>B) Different sentences by performance level</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>Different language for strong/good/satisfactory/struggling pupils — Claude groups them</div>
                    </button>
                  </div>
                  {!accumulatedText && (
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>← Highlight assessment text from your reports first</p>
                  )}
                </div>
              )}

              {/* ── DEVELOPMENT sub-menu ── */}
              {subMenu === 'development' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the Areas for Development sentences from several reports. Include a variety of different types. Claude will find ALL development sentences across all reports and group by topic.</p>
                  </div>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" placeholder="e.g. Areas for Development" style={inp} id="dev-name-input" defaultValue="Areas for Development" /></div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Opener</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button id="dev-name-btn" onClick={() => { document.getElementById('dev-name-btn')!.style.border='2px solid #3b82f6'; document.getElementById('dev-pron-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '2px solid #3b82f6', borderRadius: '6px', backgroundColor: '#eff6ff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>[Name]</button>
                      <button id="dev-pron-btn" onClick={() => { document.getElementById('dev-pron-btn')!.style.border='2px solid #8b5cf6'; document.getElementById('dev-name-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}>{pronounCapital}</button>
                    </div>
                  </div>
                  <button disabled={!accumulatedText} onClick={() => {
                    const nameEl = document.getElementById('dev-name-input') as HTMLInputElement;
                    const prnBtn = document.getElementById('dev-pron-btn') as HTMLButtonElement;
                    const opener: OpenerType = prnBtn?.style.border.includes('8b5cf6') ? 'pronoun' : 'name';
                    handleExtractAndAdd('development', opener, nameEl?.value || 'Areas for Development');
                  }} style={{ ...btnP, width: '100%', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', padding: '12px' }}>
                    {selectionActive ? '✓ Extract all development sentences from reports' : '← Highlight & add text from reports first'}
                  </button>
                </div>
              )}

              {/* ── NEXT STEPS sub-menu ── */}
              {subMenu === 'nextsteps' && (
                <div>
                  <button onClick={() => setSubMenu(null)} style={{ ...btnS, marginBottom: '12px', padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>💡 Highlight the next steps sentences from several reports. If they always start with "Moving forward," include that. Claude will group by topic.</p>
                  </div>
                  <div style={{ marginBottom: '10px' }}><label style={lbl}>Section name</label><input type="text" placeholder="e.g. Next Steps, Moving Forward" style={inp} id="ns-name-input" defaultValue="Next Steps" /></div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={lbl}>Opener</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button id="ns-name-btn" onClick={() => { document.getElementById('ns-name-btn')!.style.border='2px solid #3b82f6'; document.getElementById('ns-pron-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '2px solid #3b82f6', borderRadius: '6px', backgroundColor: '#eff6ff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>[Name]</button>
                      <button id="ns-pron-btn" onClick={() => { document.getElementById('ns-pron-btn')!.style.border='2px solid #8b5cf6'; document.getElementById('ns-name-btn')!.style.border='1px solid #d1d5db'; }} style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px' }}>{pronounCapital}</button>
                    </div>
                  </div>
                  <button disabled={!accumulatedText} onClick={() => {
                    const nameEl = document.getElementById('ns-name-input') as HTMLInputElement;
                    const prnBtn = document.getElementById('ns-pron-btn') as HTMLButtonElement;
                    const opener: OpenerType = prnBtn?.style.border.includes('8b5cf6') ? 'pronoun' : 'name';
                    handleExtractAndAdd('next-steps', opener, nameEl?.value || 'Next Steps');
                  }} style={{ ...btnP, width: '100%', opacity: accumulatedText ? 1 : 0.4, cursor: accumulatedText ? 'pointer' : 'not-allowed', padding: '12px' }}>
                    {selectionActive ? '✓ Extract all next steps sentences from reports' : '← Highlight & add text from reports first'}
                  </button>
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
          <button onClick={() => {
            if (generatedTemplate) {
              addTemplate({ name: generatedTemplate.name, sections: generatedTemplate.sections });
              alert(`"${generatedTemplate.name}" saved. You can continue to add variety or close.`);
            }
          }} style={{ ...btnG, padding: '10px 16px', fontSize: '14px' }}>💾 Save Now</button>
        </header>
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ ...card, border: '2px solid #8b5cf6', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#111827' }}>What happens next?</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
              Your template currently contains <strong>only your exact sentences</strong> from the reports — nothing AI-generated. If you want more variety (so teachers have more options to choose from per heading), select the sections below and Claude will add 1-2 additional options per heading, written to match your voice and style.
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Or skip this and go straight to the review page.</p>
          </div>

          {sectionsForVariety.length > 0 ? (
            <div style={card}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>Select sections to add variety to:</h3>
              {sectionsForVariety.map((item, i) => (
                <div key={item.section.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < sectionsForVariety.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <input type="checkbox" checked={item.selected} onChange={() => setSectionsForVariety(prev => prev.map((s, idx) => idx === i ? { ...s, selected: !s.selected } : s))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ backgroundColor: getSectionTypeColor(item.section.type), color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '3px', marginRight: '6px' }}>{getBuiltSectionTypeLabel(item.section.type)}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{item.section.name}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                      {item.section.type === 'next-steps'
                        ? `${Object.keys(item.section.data?.focusAreas || {}).length} focus areas`
                        : `${Object.keys(item.section.data?.comments || {}).length} headings`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={card}><p style={{ margin: 0, fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>No sections eligible for variety generation.</p></div>
          )}

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', fontSize: '13px', color: '#166534' }}>
            💡 Tip: Use <strong>Save Now</strong> in the top bar to save the exact-sentences version before adding variety.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/template-review', { state: { template: { name: generatedTemplate?.name, sections: generatedTemplate?.sections } } })}
              style={{ ...btnS, flex: 1, padding: '14px', fontSize: '15px' }}>Skip — Go to Review</button>
            <button onClick={handleGenerateVariety}
              disabled={!sectionsForVariety.some(s => s.selected)}
              style={{ ...btnV, flex: 1, padding: '14px', fontSize: '15px', opacity: sectionsForVariety.some(s => s.selected) ? 1 : 0.4, cursor: sectionsForVariety.some(s => s.selected) ? 'pointer' : 'not-allowed' }}>
              ✨ Generate Variety & Review
            </button>
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