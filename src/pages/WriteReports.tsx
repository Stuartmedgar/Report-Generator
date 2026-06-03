import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, Class, Student } from '../types';
import ReportWriter from '../components/ReportWriter';
import TemplateSelection from '../components/WriteReports/TemplateSelection';
import ClassSelection from '../components/WriteReports/ClassSelection';
import StudentSelection from '../components/WriteReports/StudentSelection';

type Step = 'template-selection' | 'class-selection' | 'student-selection' | 'writing';

// ─── Read sessionStorage synchronously before first render ───────────────────
function getInitialState(classes: Class[], templates: Template[]) {
  try {
    const raw = sessionStorage.getItem('continueEditing');
    if (raw) {
      const { classId, templateId, studentIndex } = JSON.parse(raw);
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
        };
      }
    }
  } catch (_) {
    sessionStorage.removeItem('continueEditing');
  }
  return {
    step: 'template-selection' as Step,
    template: null,
    classData: null,
    students: [] as string[],
    studentIndex: 0,
    directNav: false,
  };
}

function WriteReports() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useData();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const init = getInitialState(state.classes, state.templates);
  const [currentStep, setCurrentStep] = useState<Step>(init.step);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(init.template);
  const [selectedClass, setSelectedClass] = useState<Class | null>(init.classData);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(init.students);
  const [resumeStudentIndex, setResumeStudentIndex] = useState<number>(init.studentIndex);
  const [directNav] = useState<boolean>(init.directNav || false);

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
        setCurrentStep('student-selection');
      } else if (classData) {
        setCurrentStep('template-selection');
      }
    }
  }, [location.state, state.classes, state.templates]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    if (isMobile) setCurrentStep('class-selection');
  };

  const handleClassSelect = (classData: Class) => {
    setSelectedClass(classData);
    if (isMobile) {
      setCurrentStep('student-selection');
    } else {
      if (selectedTemplate) setCurrentStep('student-selection');
    }
  };

  const handleStudentSelection = (mode: 'all' | 'selected', studentIds: string[] = []) => {
    setSelectedStudents(mode === 'all' ?
      selectedClass?.students.map((s: Student) => s.id) || [] : studentIds);
    setResumeStudentIndex(0);
    setCurrentStep('writing');
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setSelectedClass(null);
    setSelectedStudents([]);
    setCurrentStep('template-selection');
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setSelectedStudents([]);
    setCurrentStep('class-selection');
  };

  const handleBackToStudents = () => {
    setSelectedStudents([]);
    setResumeStudentIndex(0);
    setCurrentStep('student-selection');
  };

  // ─── When arrived via direct nav (continueEditing), back goes home ────────
  const handleBackFromWriting = directNav
    ? () => {
        if (window.confirm('Leave the report writer? Any unsaved changes will be lost.')) {
          navigate('/');
        }
      }
    : handleBackToStudents;

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
      />
    );
  }

  if (currentStep === 'student-selection' && selectedTemplate && selectedClass) {
    return (
      <StudentSelection
        template={selectedTemplate}
        classData={selectedClass}
        onSelectStudents={handleStudentSelection}
        onBack={isMobile ? handleBackToClasses : handleBackToTemplates}
        isMobile={isMobile}
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

  return (
    <TemplateSelection
      selectedTemplate={selectedTemplate}
      selectedClass={selectedClass}
      onTemplateSelect={handleTemplateSelect}
      onClassSelect={handleClassSelect}
      onContinueToStudents={() => setCurrentStep('student-selection')}
      isMobile={isMobile}
    />
  );
}

export default WriteReports;