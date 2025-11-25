
import { useState, useEffect } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from './useAuth';

// Define a estrutura de um Aluno
export interface Student {
  id: string;
  name: string;
  // Adicione outros campos que você espera de um aluno
  [key: string]: any;
}

/**
 * Hook para buscar a lista de alunos de uma escola em tempo real.
 * @returns { students: Student[], loading: boolean, error: Error | null }
 */
export const useStudents = () => {
  const { schoolId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const studentsCollectionRef = collection(db, 'schools', schoolId, 'students');

    const unsubscribe = onSnapshot(
      studentsCollectionRef,
      (snapshot) => {
        const studentsData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[];
        setStudents(studentsData);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao buscar alunos: ", err);
        setError(err);
        setLoading(false);
      }
    );

    // Função de limpeza para cancelar a inscrição quando o componente for desmontado
    return () => unsubscribe();
  }, [schoolId]);

  return { students, loading, error };
};
