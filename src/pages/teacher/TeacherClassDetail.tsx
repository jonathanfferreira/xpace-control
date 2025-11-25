
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, User, List, MessageSquare, Star, PlusCircle } from 'lucide-react';

// Tipos
interface ClassData { id: string; name: string; description: string; studentIds: string[]; }
interface Student { id: string; name: string; avatarUrl?: string; }
interface Evaluation {
    id: string;
    studentId: string;
    studentName: string;
    participation: number;
    technique: number;
    behavior: number;
    notes: string;
    createdAt: Timestamp;
}

// --- COMPONENTE DE AVALIAÇÃO ---
const EvaluationForm = ({ classId, students, onEvaluationSaved }: { classId: string; students: Student[]; onEvaluationSaved: () => void }) => {
    const { user } = useAuth();
    const [selectedStudent, setSelectedStudent] = useState('');
    const [participation, setParticipation] = useState(3);
    const [technique, setTechnique] = useState(3);
    const [behavior, setBehavior] = useState(3);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!selectedStudent) {
            toast.warning("Por favor, selecione um aluno para avaliar.");
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'evaluations'), {
                classId,
                studentId: selectedStudent,
                teacherId: user?.uid,
                participation, technique, behavior, notes,
                createdAt: serverTimestamp(),
            });
            toast.success("Avaliação salva com sucesso!");
            // Resetar formulário
            setSelectedStudent(''); setParticipation(3); setTechnique(3); setBehavior(3); setNotes('');
            onEvaluationSaved(); // Atualiza a lista na página pai
        } catch (error: any) {
            toast.error("Erro ao salvar avaliação.", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    // Componente de Estrelas para avaliação
    const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void}) => (
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map(star => 
            <Star key={star} onClick={() => onChange(star)} className={`cursor-pointer ${value >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
        )}</div>
    );

    return (
        <div className="space-y-6 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Registrar Nova Avaliação</h3>
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Aluno Avaliado</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                            <SelectTrigger><SelectValue placeholder="Selecione o aluno..." /></SelectTrigger>
                            <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Observações Gerais</Label>
                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Descreva o desempenho, dificuldades, elogios..." />
                    </div>
                </div>
                <div className="space-y-4 rounded-md bg-muted/50 p-4">
                    <div className="grid gap-3">
                        <Label className="font-semibold">Critérios</Label>
                        <div className="flex justify-between items-center"><p>Participação</p> <StarRating value={participation} onChange={setParticipation} /></div>
                        <div className="flex justify-between items-center"><p>Técnica</p> <StarRating value={technique} onChange={setTechnique} /></div>
                        <div className="flex justify-between items-center"><p>Comportamento</p> <StarRating value={behavior} onChange={setBehavior} /></div>
                    </div>
                </div>
            </div>
            <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Avaliação
            </Button>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
export default function TeacherClassDetail() {
    const { classId } = useParams<{ classId: string }>();
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!classId) return;
        setLoading(true);
        try {
            // 1. Pega os dados da Turma
            const classDoc = await getDoc(doc(db, 'classes', classId));
            if (!classDoc.exists()) { toast.error("Turma não encontrada."); return; }
            const fetchedClassData = { id: classDoc.id, ...classDoc.data() } as ClassData;
            setClassData(fetchedClassData);

            // 2. Pega os dados dos Alunos da turma
            if (fetchedClassData.studentIds?.length > 0) {
                const studentsQuery = query(collection(db, 'students'), where('__name__', 'in', fetchedClassData.studentIds));
                const studentsSnapshot = await getDocs(studentsQuery);
                const fetchedStudents = studentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
                setStudents(fetchedStudents);
            }
            
            // 3. Pega as avaliações já feitas para esta turma
            await fetchEvaluations();

        } catch (error: any) { toast.error("Erro ao carregar dados da turma.", { description: error.message });
        } finally { setLoading(false); }
    };

    const fetchEvaluations = async () => {
        if (!classId) return;
        const evalsQuery = query(collection(db, 'evaluations'), where('classId', '==', classId), orderBy('createdAt', 'desc'));
        const evalsSnapshot = await getDocs(evalsQuery);
        // Mapeia o nome do aluno para a avaliação
        const fetchedEvaluations = evalsSnapshot.docs.map(d => {
            const data = d.data();
            const studentName = students.find(s => s.id === data.studentId)?.name || 'Aluno não encontrado';
            return { id: d.id, studentName, ...data } as Evaluation;
        });
        setEvaluations(fetchedEvaluations);
    }

    useEffect(() => { fetchData(); }, [classId]);
    // Atualiza nomes nas avaliações quando a lista de alunos carrega
    useEffect(() => { 
        if(students.length > 0) fetchEvaluations();
    }, [students]); 

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!classData) return <p>Turma não encontrada.</p>;

    return (
        <div className="space-y-6">
            <Link to="/professor/turmas" className="flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Minhas Turmas</Link>
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <p className="text-muted-foreground">{classData.description}</p>

            <Tabs defaultValue="evaluations">
                <TabsList>
                    <TabsTrigger value="students"><User className="mr-2 h-4 w-4"/> Alunos ({students.length})</TabsTrigger>
                    <TabsTrigger value="evaluations"><MessageSquare className="mr-2 h-4 w-4"/> Avaliações</TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Alunos Matriculados</CardTitle></CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                                {students.map(student => (
                                    <div key={student.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
                                        <Avatar>
                                            <AvatarImage src={student.avatarUrl} />
                                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium">{student.name}</p>
                                    </div>
                                ))}
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="evaluations" className="mt-4 space-y-6">
                    <EvaluationForm classId={classId!} students={students} onEvaluationSaved={fetchEvaluations} />
                    
                    <Card>
                        <CardHeader><CardTitle>Histórico de Avaliações</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {evaluations.length > 0 ? evaluations.map(ev => (
                                <div key={ev.id} className="p-3 border rounded-md">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{ev.studentName}</p>
                                        <p className="text-xs text-muted-foreground">{ev.createdAt.toDate().toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-sm my-2">{ev.notes}</p>
                                    <Separator />
                                    <div className="grid grid-cols-3 gap-2 text-sm mt-2 text-center">
                                        <span><Badge variant="secondary">Participação: {ev.participation}/5</Badge></span>
                                        <span><Badge variant="secondary">Técnica: {ev.technique}/5</Badge></span>
                                        <span><Badge variant="secondary">Comportamento: {ev.behavior}/5</Badge></span>
                                    </div>
                                </div>
                            )) : <p className="text-center text-muted-foreground py-4">Nenhuma avaliação registrada para esta turma ainda.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
