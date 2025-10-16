import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Unit {
  id: string;
  name: string;
  school_id: string;
}

interface UnitContextType {
  selectedUnit: Unit | null;
  units: Unit[];
  selectUnit: (unit: Unit | null) => void;
  loadUnits: () => Promise<void>;
  loading: boolean;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: ReactNode }) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUnits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get school
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      // Load units
      const { data: unitsData } = await supabase
        .from('school_units')
        .select('*')
        .eq('school_id', school.id)
        .eq('active', true)
        .order('name');

      if (unitsData) {
        setUnits(unitsData);
        
        // Auto-select first unit or restore from localStorage
        const savedUnitId = localStorage.getItem('selectedUnitId');
        if (savedUnitId) {
          const savedUnit = unitsData.find(u => u.id === savedUnitId);
          if (savedUnit) {
            setSelectedUnit(savedUnit);
          } else if (unitsData.length > 0) {
            setSelectedUnit(unitsData[0]);
          }
        } else if (unitsData.length > 0) {
          setSelectedUnit(unitsData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectUnit = (unit: Unit | null) => {
    setSelectedUnit(unit);
    if (unit) {
      localStorage.setItem('selectedUnitId', unit.id);
    } else {
      localStorage.removeItem('selectedUnitId');
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  return (
    <UnitContext.Provider value={{ selectedUnit, units, selectUnit, loadUnits, loading }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
}
