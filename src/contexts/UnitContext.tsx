import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUnits = async () => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const schoolsQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
      const schoolSnapshot = await getDocs(schoolsQuery);

      if (schoolSnapshot.empty) {
        setUnits([]);
        setSelectedUnit(null);
        setLoading(false);
        return;
      }
      const school = schoolSnapshot.docs[0];
      const schoolId = school.id;

      const unitsQuery = query(
        collection(db, 'school_units'),
        where('school_id', '==', schoolId),
        where('active', '==', true)
      );
      const unitsSnapshot = await getDocs(unitsQuery);
      const unitsData = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[];
      
      setUnits(unitsData);

      if (unitsData.length > 0) {
        const savedUnitId = localStorage.getItem('selectedUnitId');
        const savedUnit = unitsData.find(u => u.id === savedUnitId);
        if (savedUnit) {
          setSelectedUnit(savedUnit);
        } else {
          const firstUnit = unitsData[0];
          setSelectedUnit(firstUnit);
          localStorage.setItem('selectedUnitId', firstUnit.id);
        }
      } else {
        setSelectedUnit(null);
        localStorage.removeItem('selectedUnitId');
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
    if(user) {
        loadUnits();
    }
  }, [user]);

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
