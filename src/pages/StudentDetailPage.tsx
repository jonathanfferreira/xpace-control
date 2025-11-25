
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, storage } from '@/integrations/firebase/client';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, User, School, FileText, Upload, Trash2, Download } from 'lucide-react';

// Tipos
interface Student {
    id: string;
    full_name: string;
    photo_url?: string;
    [key: string]: any; // Outros campos
}

interface DocumentFile {
    name: string;
    url: string;
}

// --- Componente de Documentos ---
const DocumentsTab = ({ studentId }: { studentId: string }) => {
    const [files, setFiles] = useState<DocumentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const listFiles = async () => {
        setLoading(true);
        const filesRef = ref(storage, `student_documents/${studentId}`);
        try {
            const res = await listAll(filesRef);
            const filesData = await Promise.all(res.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                return { name: itemRef.name, url };
            }));
            setFiles(filesData);
        } catch (error: any) { toast.error("Erro ao listar documentos.", { description: error.message });
        } finally { setLoading(false); }
    };

    useEffect(() => { listFiles(); }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fileRef = ref(storage, `student_documents/${studentId}/${file.name}`);
        try {
            await uploadBytes(fileRef, file);
            toast.success("Documento enviado com sucesso!");
            listFiles(); // Re-lista os arquivos
        } catch (error: any) { toast.error("Falha no upload.", { description: error.message });
        } finally { setUploading(false); }
    };

    const handleFileDelete = async (fileName: string) => {
        if (!window.confirm(`Tem certeza que quer excluir o arquivo "${fileName}"?`)) return;
        const fileRef = ref(storage, `student_documents/${studentId}/${fileName}`);
        try {
            await deleteObject(fileRef);
            toast.success("Documento excluído com sucesso.");
            listFiles();
        } catch (error: any) {
            toast.error("Falha ao excluir.", { description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestão de Documentos</CardTitle>
                <CardDescription>Faça upload e gerencie documentos do aluno, como contratos e certidões.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="file-upload" className={`w-full flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted ${uploading && 'opacity-50'}`}>
                       {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} 
                       {uploading ? 'Enviando...' : 'Clique para enviar um arquivo'}
                    </Label>
                    <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </div>

                {loading ? <Loader2 className="m-auto h-6 w-6 animate-spin" /> : 
                files.length > 0 ? (
                    <div className="space-y-2">
                        {files.map(file => (
                            <div key={file.name} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                                <p className="font-mono text-sm">{file.name}</p>
                                <div className="flex items-center gap-2">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm"><Download className="h-4 w-4"/></Button>
                                    </a>
                                    <Button variant="destructive" size="sm" onClick={() => handleFileDelete(file.name)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-center text-sm text-muted-foreground py-4">Nenhum documento encontrado.</p>}
            </CardContent>
        </Card>
    );
}

// --- Página Principal ---
export default function StudentDetailPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        const fetchStudent = async () => {
            setLoading(true);
            try {
                const studentDoc = await getDoc(doc(db, 'students', studentId));
                if (studentDoc.exists()) {
                    setStudent({ id: studentDoc.id, ...studentDoc.data() });
                } else {
                    toast.error("Aluno não encontrado.");
                }
            } catch (error: any) { toast.error("Erro ao buscar dados do aluno.", { description: error.message });
            } finally { setLoading(false); }
        };
        fetchStudent();
    }, [studentId]);

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!student) return <p>Aluno não encontrado.</p>;

    return (
        <div className="space-y-6">
            <Link to="/alunos" className="flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Alunos</Link>
            
            <div className="flex items-start gap-6">
                 <Avatar className="h-24 w-24 border">
                    <AvatarImage src={student.photo_url} />
                    <AvatarFallback className="text-3xl">{student.full_name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold">{student.full_name}</h1>
                    <p className="text-muted-foreground">ID: {student.id}</p>
                </div>
            </div>

            <Tabs defaultValue="documents">
                <TabsList>
                    <TabsTrigger value="info"><User className="mr-2 h-4 w-4"/> Informações</TabsTrigger>
                    <TabsTrigger value="classes"><School className="mr-2 h-4 w-4"/> Turmas</TabsTrigger>
                    <TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4"/> Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
                        <CardContent>
                            {/* Formulário de Edição de Aluno aqui no futuro */}
                            <p>Em breve: formulário para editar os dados do aluno.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="classes" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Turmas Matriculadas</CardTitle></CardHeader>
                        <CardContent>
                           <p>Em breve: lista de turmas em que o aluno está matriculado.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                    <DocumentsTab studentId={student.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
