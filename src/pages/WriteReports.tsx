import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, Class, Student } from '../types';
import ReportWriter from '../components/ReportWriter';
import TemplateSelection from '../components/WriteReports/TemplateSelection';
import ClassSelection from '../components/WriteReports/ClassSelection';
import StudentSelection from '../components/WriteReports/StudentSelection';

type Step = 'template-selection' | 'class-selection' | 'student-selection' | 'writing';

function WriteReports() {
  const navigate = useNavigate();
  const { state } = useData();
  const [currentStep, setCurrentStep] = useState<Step>('template-selection');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [resumeStudentIndex, setResumeStudentIndex] = useState<number>(0);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Step navigation handlers
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    if (isMobile) {
      setCurrentStep('class-selection');
    }
  };

  const handleClassSelect = (classData: Class) => {
    setSelectedClass(classData);
    if (isMobile) {
      setCurrentStep('student-selection');
    } else {
      // Desktop - go straight to students after both selected
      if (selectedTemplate) {
        setCurrentStep('student-selection');
      }
    }
  };

  const handleStudentSelection = (mode: 'all' | 'selected', studentIds: string[] = []) => {
    setSelectedStudents(mode === 'all' ? 
      selectedClass?.students.map((s: Student) => s.id) || [] : studentIds);
    setResumeStudentIndex(0);
    setCurrentStep('writing');
  };

  // Back navigation
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

  // Writing step
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

  // Student selection step
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

  // Mobile: Class Selection Step
  if (isMobile && currentStep === 'class-selection' && selectedTemplate) {
    return (
      <ClassSelection
        selectedTemplate={selectedTemplate}
        onClassSelect={handleClassSelect}
        onBack={handleBackToTemplates}
      />
    );
  }

  // Template Selection (Mobile Step 1, Desktop Main Page)
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