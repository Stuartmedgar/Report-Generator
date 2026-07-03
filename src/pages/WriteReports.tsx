import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, Class, Student } from '../types';
import ReportWriter from '../components/ReportWriter';
import ClassSelection from '../components/WriteReports/ClassSelection';

type Step = 'template-selection' | 'class-selection' | 'student-selection' | 'writing';

// ─── Read sessionStorage synchronously before first render ───────────────────
function getInitialState(
  classes: Class[],
  templates: Template[],
  locationState?: { preselectedClassId?: string; preselectedTemplateId?: string; tourSource?: string } | null
) {
  try {
    const raw = sessionStorage.getItem('continueEditing');
    if (raw) {
      const { classId, templateId, studentIndex, tourSource } = JSON.parse(raw);
      const template = templates.find(t => t.id === templateId) || null;
      const classData = classes.find(c => c.id === classId) || null;
      if (template && classData) {
        sessionStorage.removeItem('continueEditing');
        return {
          step: 'writing' as Step,
          template,
          classData,
          students: classData.students.map((s: Student) => s.id),
          studentIndex: studentIndex >= 0 ? studentIndex : 0,
          directNav: true,
          tourSource: (tourSource as string) || null,
        };
      }
    }
  } catch (_) {
    sessionStorage.removeItem('continueEditing');
  }
  if (locationState?.preselectedClassId || locationState?.preselectedTemplateId) {
    const classData = locationState.preselectedClassId
      ? classes.find(c => c.id === locationState.preselectedClassId) ?? null
      : null;
    const template = locationState.preselectedTemplateId
      ? templates.find(t => t.id === locationState.preselectedTemplateId) ?? null
      : null;
    return {
      step: (classData && template ? 'writing' : 'template-selection') as Step,
      template,
      classData,
      students: classData && template ? classData.students.map((s: Student) => s.id) : [] as string[],
      studentIndex: 0,
      directNav: false,
      tourSource: locationState.tourSource || null,
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
  };
}

function WriteReports() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useData();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const init = getInitialState(
    state.classes,
    state.templates,
    location.state as { preselectedClassId?: string; preselectedTemplateId?: string; tourSource?: string } | null
  );
  const [currentStep, setCurrentStep] = useState<Step>(init.step);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(init.template);
  const [selectedClass, setSelectedClass] = useState<Class | null>(init.classData);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(init.students);
  const [resumeStudentIndex] = useState<number>(init.studentIndex);
  const [directNav] = useState<boolean>(init.directNav || false);
  const [tourSource] = useState<string | null>(init.tourSource || null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const preselectedClassId = location.state?.preselectedClassId as string | undefined;
    const preselectedTemplateId = location.state?.preselectedTemplateId as string | undefined;

    if (preselectedClassId || preselectedTemplateId) {
      const classData = preselectedClassId ? state.classes.find(c => c.id === preselectedClassId) : null;
      const template = preselectedTemplateId ? state.templates.find(t => t.id === preselectedTemplateId) : null;

      if (classData) setSelectedClass(classData);
      if (template) setSelectedTemplate(template);

      if (classData && template) {
        setSelectedStudents(classData.students.map((s: Student) => s.id));
        setCurrentStep('writing');
      } else if (classData && !template) {
        setCurrentStep('template-selection');
      }
    }
  }, [location.state, state.classes, state.templates]);

  const handleClassSelect = (classData: Class) => {
    setSelectedClass(classData);
    setSelectedStudents(classData.students.map((s: Student) => s.id));
    setCurrentStep('writing');
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setSelectedClass(null);
    setSelectedStudents([]);
    setCurrentStep('template-selection');
  };

  // ─── When arrived via direct nav (continueEditing), exit goes home ─────────
  const handleBackFromWriting = directNav
    ? () => {
        if (window.confirm('Leave the report writer? Any unsaved changes will be lost.')) {
          navigate('/', { replace: true });
        }
      }
    : handleBackToTemplates;

  const studentsToWrite = selectedClass?.students.filter(s =>
    selectedStudents.includes(s.id)
  ) || [];

  if (currentStep === 'writing' && selectedTemplate && selectedClass) {
    return (
      <ReportWriter
        template={selectedTemplate}
        classData={selectedClass}
        students={studentsToWrite}
        onBack={handleBackFromWriting}
        startStudentIndex={resumeStudentIndex}
        tourSource={tourSource as 'ai-builder' | 'wizard' | undefined}
      />
    );
  }

  if (isMobile && currentStep === 'class-selection' && selectedTemplate) {
    return (
      <ClassSelection
        selectedTemplate={selectedTemplate}
        onClassSelect={handleClassSelect}
        onBack={handleBackToTemplates}
      />
    );
  }

  // ─── No continueEditing or preselected state — redirect to onboarding flow ──
  if (!location.state?.preselectedClassId && !location.state?.preselectedTemplateId) {
    navigate('/start', { replace: true });
  }
  return null;
}

export default WriteReports;