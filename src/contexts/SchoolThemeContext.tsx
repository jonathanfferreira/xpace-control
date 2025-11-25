
// src/contexts/SchoolThemeContext.tsx

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';

interface SchoolTheme {
  logoUrl: string | null;
  primaryColor: string | null;
}

interface SchoolThemeContextType {
  theme: SchoolTheme;
  loading: boolean;
}

const SchoolThemeContext = createContext<SchoolThemeContextType | undefined>(undefined);

export const SchoolThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<SchoolTheme>({ logoUrl: null, primaryColor: null });
  const [loading, setLoading] = useState(true);

  const schoolIdQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, 'schools'), where('admin_id', '==', user.uid));
  }, [user]);

  useEffect(() => {
    if (!schoolIdQuery) {
      setLoading(false);
      return;
    }

    const getSchoolIdAndListen = async () => {
      try {
        const schoolSnapshot = await getDocs(schoolIdQuery);
        if (!schoolSnapshot.empty) {
          const schoolId = schoolSnapshot.docs[0].id;
          const schoolRef = doc(db, 'schools', schoolId);
          
          const unsubscribe = onSnapshot(schoolRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const newTheme = {
                logoUrl: data.logoUrl || null,
                primaryColor: data.primaryColor || null,
              };
              setTheme(newTheme);

              // Injetar cor primária como variável CSS
              if (data.primaryColor) {
                document.documentElement.style.setProperty('--primary', data.primaryColor);
              }
            }
            setLoading(false);
          });

          return unsubscribe;
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching school theme:", error);
        setLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    getSchoolIdAndListen().then(unsub => {
        unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [schoolIdQuery]);

  return (
    <SchoolThemeContext.Provider value={{ theme, loading }}>
      {children}
    </SchoolThemeContext.Provider>
  );
};

export const useSchoolTheme = () => {
  const context = useContext(SchoolThemeContext);
  if (context === undefined) {
    throw new Error('useSchoolTheme must be used within a SchoolThemeProvider');
  }
  return context;
};
