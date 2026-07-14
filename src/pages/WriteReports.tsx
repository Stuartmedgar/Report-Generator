import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, Class, Student } from '../types';
import ReportWriter from '../components/ReportWriter';

type Step = 'template-selection' | 'writing';

// ─── Preview class used for the "Edit Template" flow — lets a teacher try out
//     a template against a dummy student without touching real class/report data.
const PREVIEW_STUDENT: Student = { id: 'preview-test-student', firstName: 'Test', lastName: 'Student' };
function buildPreviewClass(): Class {
  return { id: 'preview-test-class', name: 'Template Preview', students: [PREVIEW_STUDENT], createdAt: new Date().toISOString() };
}

function makeBlankStudent(): Student {
  return { id: `${Date.now()}${Math.random().toString(36).slice(2, 9)}`, firstName: '', lastName: '' };
}

// First name-less default a fresh class gets — "Class 1", "Class 2", etc. —
// so a teacher never has to name anything before they can start writing.
function getDefaultClassName(existingClasses: Class[]): string {
  const existingNames = new Set(existingClasses.map(c => c.name));
  let n = 1;
  while (existingNames.has(`Class ${n}`)) n++;
  return `Class ${n}`;
}

// ─── Read sessionStorage synchronously before first render ───────────────────
function getInitialState(
  classes: Class[],
  templates: Template[],
  locationState?: { preselectedClassId?: string; preselectedTemplateId?: string; tourSource?: string; templatePreview?: Template } | null
) {
  try {
    const raw = sessionStorage.getItem('continueEditing');
    if (raw) {
      const { classId, templateId, studentIndex, tourSource } = JSON.parse(raw);
      const template = templates.find(t => t.id === templateId) || null;
      const classData = classId ? classes.find(c => c.id === classId) || null : null;
      if (template) {
        sessionStorage.removeItem('continueEditing');
        return {
          step: 'writing' as Step,
          template,
          classData,
          students: classData ? classData.students.map((s: Student) => s.id) : [] as string[],
          studentIndex: studentIndex >= 0 ? studentIndex : 0,
          directNav: true,
          tourSource: (tourSource as string) || null,
        };
      }
    }
  } catch (_) {
    sessionStorage.removeItem('continueEditing');
  }
  if (locationState?.templatePreview) {
    return {
      step: 'writing' as Step,
      template: locationState.templatePreview,
      classData: buildPreviewClass(),
      students: [PREVIEW_STUDENT.id],
      studentIndex: 0,
      directNav: false,
      tourSource: null,
      isPreview: true,
    };
  }
  if (locationState?.preselectedClassId || locationState?.preselectedTemplateId) {
    const classData = locationState.preselectedClassId
      ? classes.find(c => c.id === locationState.preselectedClassId) ?? null
      : null;
    const template = locationState.preselectedTemplateId
      ? templates.find(t => t.id === locationState.preselectedTemplateId) ?? null
      : null;
    return {
      step: (template ? 'writing' : 'template-selection') as Step,
      template,
      classData,
      students: classData ? classData.students.map((s: Student) => s.id) : [] as string[],
      studentIndex: 0,
      directNav: false,
      tourSource: locationState.tourSource || null,
      isPreview: false,
    };
  }
  return {
    step: 'template-selection' as Step,
    template: null,
    classData: null,
    students: [] as string[],
    studentIndex: 0,
    directNav: false,
    tourSource: null,
    isPreview: false,
  };
}

function WriteReports() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, addClass, updateClass } = useData();

  const init = getInitialState(
    state.classes,
    state.templates,
    location.state as { preselectedClassId?: string; preselectedTemplateId?: string; tourSource?: string; templatePreview?: Template } | null
  );
  const [currentStep, setCurrentStep] = useState<Step>(init.step);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(init.template);
  const [selectedClass, setSelectedClass] = useState<Class | null>(init.classData);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(init.students);
  const [resumeStudentIndex] = useState<number>(init.studentIndex);
  const [tourSource] = useState<string | null>(init.tourSource || null);
  const [isPreview] = useState<boolean>(init.isPreview || false);
  const [isNewClass, setIsNewClass] = useState(false);

  useEffect(() => {
    const preselectedClassId = location.state?.preselectedClassId as string | undefined;
    const preselectedTemplateId = location.state?.preselectedTemplateId as string | undefined;

    if (preselectedClassId || preselectedTemplateId) {
      const classData = preselectedClassId ? state.classes.find(c => c.id === preselectedClassId) : null;
      const template = preselectedTemplateId ? state.templates.find(t => t.id === preselectedTemplateId) : null;

      if (classData) setSelectedClass(classData);
      if (template) setSelectedTemplate(template);

      if (template) {
        if (classData) setSelectedStudents(classData.students.map((s: Student) => s.id));
        setCurrentStep('writing');
      } else if (classData) {
        setCurrentStep('template-selection');
      }
    }
  }, [location.state, state.classes, state.templates]);

  // No setup screens: as soon as a template is chosen with no class ready to
  // write into (nothing selected yet, or an existing class with zero pupils),
  // silently create what's needed — a default-named class and/or one
  // blank-name pupil — so the report writer always mounts ready to write.
  const autoSeededRef = useRef(false);
  useEffect(() => {
    if (currentStep !== 'writing' || !selectedTemplate) return;
    if (selectedClass && selectedClass.students.length > 0) return;
    if (autoSeededRef.current) return;
    autoSeededRef.current = true;

    const blankStudent = makeBlankStudent();
    if (!selectedClass) {
      const newClass = addClass({ name: getDefaultClassName(state.classes), students: [blankStudent] });
      setSelectedClass(newClass);
      setSelectedStudents([blankStudent.id]);
      setIsNewClass(true);
    } else {
      const updated = { ...selectedClass, students: [...selectedClass.students, blankStudent] };
      updateClass(updated);
      setSelectedClass(updated);
      setSelectedStudents([blankStudent.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedTemplate, selectedClass]);

  // Called when the report writer renames the class (via the header), or the
  // teacher creates/loads a different class via the "+ Add Class" menu —
  // keeps this state in sync so resume/"continue writing" flows still work.
  const handleClassChange = (classData: Class, isNew?: boolean) => {
    setSelectedClass(classData);
    setSelectedStudents(classData.students.map((s: Student) => s.id));
    setIsNewClass(!!isNew);
  };

  // ─── Exit always leaves the report writer entirely — to Manage Templates when
  //     previewing a template edit, otherwise to the home page ──────────────────
  const handleBackFromWriting = isPreview
    ? () => {
        if (window.confirm('Leave the report writer? Any unsaved changes will be lost.')) {
          navigate('/manage-templates', { replace: true });
        }
      }
    : () => {
        if (window.confirm('Leave the report writer? Any unsaved changes will be lost.')) {
          navigate('/', { replace: true });
        }
      };

  const studentsToWrite = selectedClass?.students.filter(s =>
    selectedStudents.includes(s.id)
  ) || [];

  if (currentStep === 'writing' && selectedTemplate && selectedClass && selectedClass.students.length > 0) {
    return (
      <ReportWriter
        key={selectedClass.id}
        template={selectedTemplate}
        classData={selectedClass}
        onClassChange={handleClassChange}
        isNewClass={isNewClass}
        students={studentsToWrite}
        onBack={handleBackFromWriting}
        startStudentIndex={resumeStudentIndex}
        tourSource={tourSource as 'ai-builder' | 'wizard' | undefined}
        disableReportSaving={isPreview}
        exitPath={isPreview ? '/manage-templates' : '/view-reports'}
      />
    );
  }

  // Template resolved but the auto-seed effect above hasn't landed yet —
  // nothing meaningful to render for a moment rather than a broken screen.
  if (currentStep === 'writing' && selectedTemplate) {
    return null;
  }

  // ─── No continueEditing or preselected state — redirect to onboarding flow ──
  if (!location.state?.preselectedClassId && !location.state?.preselectedTemplateId) {
    navigate('/start', { replace: true });
  }
  return null;
}

export default WriteReports;
