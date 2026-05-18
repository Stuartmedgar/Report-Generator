import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, Class, Student } from '../types';
import ReportWriter from '../components/ReportWriter';
import TemplateSelection from '../components/WriteReports/TemplateSelection';
import ClassSelection from '../components/WriteReports/ClassSelection';
import StudentSelection from '../components/WriteReports/StudentSelection';

type Step = 'template-selection' | 'class-selection' | 'student-selection' | 'writing';

function WriteReports() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useData();
  const [currentStep, setCurrentStep] = useState<Step>('template-selection');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [resumeStudentIndex, setResumeStudentIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle preselected class and template coming from SelectTemplate page
  useEffect(() => {
    const preselectedClassId = location.state?.preselectedClassId as string | undefined;
    const preselectedTemplateId = location.state?.preselectedTemplateId as string | undefined;

    if (preselectedClassId || preselectedTemplateId) {
      const classData = preselectedClassId ? state.classes.find(c => c.id === preselectedClassId) : null;
      const template = preselectedTemplateId ? state.templates.find(t => t.id === preselectedTemplateId) : null;

      if (classData) setSelectedClass(classData);
      if (template) setSelectedTemplate(template);

      // If both are set, go straight to student selection
      if (classData && template) {
        setCurrentStep('student-selection');
      } else if (classData) {
        // Class selected, still need template
        setCurrentStep('template-selection');
      }
    }
  }, [location.state, state.classes, state.templates]);

  // Handle continueEditing from sessionStorage
  useEffect(() => {
    const continueEditingData = sessionStorage.getItem('continueEditing');
    if (continueEditingData) {
      try {
        const { classId, templateId, studentIndex } = JSON.parse(continueEditingData);
        const template = state.templates.find(t => t.id === templateId);
        const classData = state.classes.find(c => c.id === classId);
        if (template && classData) {
          setSelectedTemplate(template);
          setSelectedClass(classData);
          setSelectedStudents(classData.students.map(s => s.id));
          setResumeStudentIndex(studentIndex);
          setCurrentStep('writing');
          sessionStorage.removeItem('continueEditing');
        }
      } catch (error) {
        console.error('Error parsing continue editing data:', error);
        sessionStorage.removeItem('continueEditing');
      }
    }
  }, [state.templates, state.classes]);

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

  const studentsToWrite = selectedClass?.students.filter(s =>
    selectedStudents.includes(s.id)
  ) || [];

  if (currentStep === 'writing' && selectedTemplate && selectedClass) {
    return (
      <ReportWriter
        template={selectedTemplate}
        classData={selectedClass}
        students={studentsToWrite}
        onBack={handleBackToStudents}
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