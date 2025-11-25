
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { GuardianLayout } from '@/components/layout/GuardianLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Star, MessageSquare, School } from 'lucide-react';

// Tipos
interface Student {
    id: string;
    full_name: string;
    photo_url?: string;
}

interface Evaluation {
    id: string;
    classId: string;
    className?: string; // Nome da turma será buscado depois
    teacherId: string;
    teacherName?: string; // Nome do professor será buscado depois
    participation: number;
    technique: number;
    behavior: number;
    notes: string;
    createdAt: Timestamp;
}

// Componente de Estrelas para visualização
const ViewStarRating = ({ value }: { value: number }) => (
    <div className="flex gap-1">{[1, 2, 3, 4, 5].map(star => 
        <Star key={star} className={`h-4 w-4 ${value >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
    )}</div>
);

export default function GuardianEvaluations() {
    const { studentId } = useParams<{ studentId: string }>();
    const [student, setStudent] = useState<Student | null>(null);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!studentId) return;
            setLoading(true);
            try {
                // 1. Pega os dados do Aluno
                const studentDoc = await getDoc(doc(db, 'students', studentId));
                if (!studentDoc.exists()) { toast.error("Aluno não encontrado."); return; }
                setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);

                // 2. Pega todas as avaliações do aluno
                const evalsQuery = query(collection(db, 'evaluations'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
                const evalsSnapshot = await getDocs(evalsQuery);
                const evalsData = evalsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Evaluation));

                // 3. Busca os nomes das turmas e professores (para evitar múltiplas buscas, fazemos um batch)
                const classIds = [...new Set(evalsData.map(e => e.classId))];
                const teacherIds = [...new Set(evalsData.map(e => e.teacherId))];
                
                const classNames: Record<string, string> = {};
                if (classIds.length > 0) {
                    const classesQuery = query(collection(db, 'classes'), where('__name__', 'in', classIds));
                    const classesSnapshot = await getDocs(classesQuery);
                    classesSnapshot.forEach(doc => { classNames[doc.id] = doc.data().name; });
                }

                const teacherNames: Record<string, string> = {};
                if (teacherIds.length > 0) {
                    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', teacherIds));
                    const usersSnapshot = await getDocs(usersQuery);
                    usersSnapshot.forEach(doc => { teacherNames[doc.id] = doc.data().displayName; });
                }

                // 4. Monta o objeto final
                const populatedEvaluations = evalsData.map(ev => ({
                    ...ev,
                    className: classNames[ev.classId] || 'Turma desconhecida',
                    teacherName: teacherNames[ev.teacherId] || 'Professor desconhecido',
                }));

                setEvaluations(populatedEvaluations);

            } catch (error: any) { toast.error("Erro ao carregar avaliações.", { description: error.message });
            } finally { setLoading(false); }
        };
        fetchData();
    }, [studentId]);

    if (loading || !student) {
        return <GuardianLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div></GuardianLayout>;
    }

    return (
        <GuardianLayout>
            <div className="space-y-6">
                 <Link to="/responsavel/alunos" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Meus Alunos</Link>
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border">
                        <AvatarImage src={student.photo_url} />
                        <AvatarFallback className="text-2xl">{student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold">Avaliações de {student.full_name}</h1>
                        <p className="text-muted-foreground">Histórico de desenvolvimento e feedback dos professores.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Linha do Tempo das Avaliações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {evaluations.length > 0 ? (
                            <div className="space-y-8 relative pl-6 before:absolute before:left-[35px] before:top-0 before:h-full before:w-px before:bg-border">
                                {evaluations.map(ev => (
                                    <div key={ev.id} className="relative">
                                        <div className="absolute left-[-8px] top-1 h-4 w-4 rounded-full bg-primary" />
                                        <div className="pl-10">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-lg">{ev.className}</p>
                                                <p className="text-sm text-muted-foreground">{ev.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Professor(a): {ev.teacherName}</p>
                                            
                                            <Card className="mt-4 bg-muted/30">
                                                <CardContent className="p-4 space-y-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center"><span className="font-medium">Participação</span> <ViewStarRating value={ev.participation} /></div>
                                                        <div className="flex justify-between items-center"><span className="font-medium">Técnica</span> <ViewStarRating value={ev.technique} /></div>
                                                        <div className="flex justify-between items-center"><span className="font-medium">Comportamento</span> <ViewStarRating value={ev.behavior} /></div>
                                                    </div>
                                                    {ev.notes && (
                                                        <>
                                                        <Separator />
                                                        <div>
                                                            <h4 className="font-semibold mb-1">Observações do Professor:</h4>
                                                            <p className="text-sm text-muted-foreground italic">"{ev.notes}"</p>
                                                        </div>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground"/>
                                <h3 className="mt-2 text-lg font-semibold">Nenhuma Avaliação</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Ainda não há avaliações de desenvolvimento para {student.full_name}.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </GuardianLayout>
    );
}
