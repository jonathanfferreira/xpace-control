import { createContext, useContext, useState, ReactNode } from 'react';
import { DEMO_USER, DEMO_SCHOOL, DEMO_CLASSES, DEMO_STUDENTS, DEMO_ATTENDANCES, DEMO_PAYMENTS } from '@/lib/demoData';

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (value: boolean) => void;
  demoData: {
    user: typeof DEMO_USER;
    school: typeof DEMO_SCHOOL;
    classes: typeof DEMO_CLASSES;
    students: typeof DEMO_STUDENTS;
    attendances: typeof DEMO_ATTENDANCES;
    payments: typeof DEMO_PAYMENTS;
  };
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setDemoMode] = useState(false);

  const demoData = {
    user: DEMO_USER,
    school: DEMO_SCHOOL,
    classes: DEMO_CLASSES,
    students: DEMO_STUDENTS,
    attendances: DEMO_ATTENDANCES,
    payments: DEMO_PAYMENTS,
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, setDemoMode, demoData }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
