
import { useState, useEffect } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from './useAuth';

// Define a estrutura de uma Turma
export interface Class {
  id: string;
  name: string;
  // Adicione outros campos que você espera de uma turma
  [key: string]: any;
}

/**
 * Hook para buscar a lista de turmas de uma escola em tempo real.
 * @returns \{ classes: Class[], loading: boolean, error: Error | null }
 */
export const useClasses = () => {
  const { schoolId } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const classesCollectionRef = collection(db, 'schools', schoolId, 'classes');

    const unsubscribe = onSnapshot(
      classesCollectionRef,
      (snapshot) => {
        const classesData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as Class[];
        setClasses(classesData);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao buscar turmas: ", err);
        setError(err);
        setLoading(false);
      }
    );

    // Função de limpeza para cancelar a inscrição quando o componente for desmontado
    return () => unsubscribe();
  }, [schoolId]);

  return { classes, loading, error };
};
