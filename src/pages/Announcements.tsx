
import { useState, useEffect } from 'react';
import { db } from '@/integrations/firebase/client';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Trash, Edit, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Announcement {
    id: string;
    title: string;
    content: string;
    targetRoles: string[];
    createdAt: Timestamp;
    author?: string; // Futuramente, podemos registrar quem criou
}

const roleMap: { [key: string]: string } = {
    admin: 'Administradores',
    teacher: 'Professores',
    guardian: 'Responsáveis',
    student: 'Alunos',
}

export default function Announcements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement> | null>(null);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'announcements'));
            const fetchedAnnouncements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)).sort((a, b) => b.createdAt.toMillis() - a.toMillis());
            setAnnouncements(fetchedAnnouncements);
        } catch (error: any) {
            toast.error('Falha ao carregar comunicados.', { description: error.message });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSave = async () => {
        if (!currentAnnouncement || !currentAnnouncement.title || !currentAnnouncement.content || !currentAnnouncement.targetRoles?.length) {
            toast.warning('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const dataToSave = {
            title: currentAnnouncement.title,
            content: currentAnnouncement.content,
            targetRoles: currentAnnouncement.targetRoles,
            createdAt: currentAnnouncement.id ? currentAnnouncement.createdAt : serverTimestamp(),
        };

        try {
            if (currentAnnouncement.id) {
                await updateDoc(doc(db, 'announcements', currentAnnouncement.id), dataToSave);
                toast.success('Comunicado atualizado com sucesso!');
            } else {
                await addDoc(collection(db, 'announcements'), dataToSave);
                toast.success('Comunicado criado com sucesso!');
            }
            fetchAnnouncements();
            setIsDialogOpen(false);
            setCurrentAnnouncement(null);
        } catch (error: any) {
            toast.error('Ocorreu um erro ao salvar o comunicado.', { description: error.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este comunicado? Esta ação não pode ser desfeita.')) return;
        try {
            await deleteDoc(doc(db, 'announcements', id));
            toast.success('Comunicado excluído com sucesso.');
            fetchAnnouncements();
        } catch (error: any) {
            toast.error('Falha ao excluir o comunicado.', { description: error.message });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Mural de Comunicados</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setCurrentAnnouncement({})}><PlusCircle className="mr-2 h-4 w-4" /> Novo Comunicado</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{currentAnnouncement?.id ? 'Editar' : 'Novo'} Comunicado</DialogTitle>
                            <DialogDescription>Crie ou edite um comunicado para a escola. Ele será exibido no painel de todos os perfis selecionados.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título</Label>
                                <Input id="title" value={currentAnnouncement?.title || ''} onChange={e => setCurrentAnnouncement({ ...currentAnnouncement, title: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">Conteúdo</Label>
                                <Textarea id="content" value={currentAnnouncement?.content || ''} onChange={e => setCurrentAnnouncement({ ...currentAnnouncement, content: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Enviar para:</Label>
                                <Select
                                    value={currentAnnouncement?.targetRoles?.join(',')}
                                    onValueChange={value => setCurrentAnnouncement({ ...currentAnnouncement, targetRoles: value.split(',') })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione os destinatários" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin,teacher,guardian,student">Todos</SelectItem>
                                        <SelectItem value="admin">Apenas Administradores</SelectItem>
                                        <SelectItem value="teacher">Apenas Professores</SelectItem>
                                        <SelectItem value="guardian">Apenas Responsáveis</SelectItem>
                                        <SelectItem value="student">Apenas Alunos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Comunicados Publicados</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : announcements.length === 0 ? (
                        <Alert>
                            <Megaphone className="h-4 w-4" />
                            <AlertTitle>Nenhum comunicado encontrado!</AlertTitle>
                            <AlertDescription>Clique em "Novo Comunicado" para criar o primeiro aviso.</AlertDescription>
                        </Alert>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Título</TableHead>
                                    <TableHead>Destinatários</TableHead>
                                    <TableHead>Data de Criação</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {announcements.map(announcement => (
                                    <TableRow key={announcement.id}>
                                        <TableCell className="font-medium">{announcement.title}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {announcement.targetRoles.map(role => <Badge key={role} variant="secondary">{roleMap[role] || role}</Badge>)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{announcement.createdAt.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setCurrentAnnouncement(announcement); setIsDialogOpen(true); }}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(announcement.id)} className="text-destructive">
                                                        <Trash className="mr-2 h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
