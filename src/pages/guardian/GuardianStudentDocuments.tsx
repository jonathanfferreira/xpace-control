
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, storage } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { GuardianLayout } from '@/components/layout/GuardianLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, FileText, Download, FolderOpen } from 'lucide-react';

// Tipos
interface Student {
    id: string;
    full_name: string;
    photo_url?: string;
}

interface DocumentFile {
    name: string;
    url: string;
}

export default function GuardianStudentDocuments() {
    const { studentId } = useParams<{ studentId: string }>();
    const [student, setStudent] = useState<Student | null>(null);
    const [files, setFiles] = useState<DocumentFile[]>([]);
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

                // 2. Lista os arquivos do storage
                const filesRef = ref(storage, `student_documents/${studentId}`);
                const res = await listAll(filesRef);
                const filesData = await Promise.all(res.items.map(async (itemRef) => {
                    const url = await getDownloadURL(itemRef);
                    return { name: itemRef.name, url };
                }));
                setFiles(filesData);

            } catch (error: any) { toast.error("Erro ao carregar documentos.", { description: error.message });
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
                        <h1 className="text-3xl font-bold">Documentos de {student.full_name}</h1>
                        <p className="text-muted-foreground">Visualize e baixe contratos, certidões e outros arquivos.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Arquivos Disponíveis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {files.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {files.map(file => (
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" key={file.name} className="block group">
                                        <div className="border rounded-lg p-4 h-full flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                                            <FileText className="h-10 w-10 mb-2 text-primary" />
                                            <p className="font-mono text-sm break-all group-hover:underline">{file.name}</p>
                                            <Button variant="outline" size="sm" className="mt-4"><Download className="mr-2 h-4 w-4" /> Baixar</Button>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground"/>
                                <h3 className="mt-2 text-lg font-semibold">Nenhum Documento</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Ainda não há documentos disponíveis para {student.full_name}.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </GuardianLayout>
    );
}
