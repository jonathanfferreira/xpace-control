
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './staff/columns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher';
    status: 'active' | 'inactive';
}

export default function StaffPage() {
    const { schoolId } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'teacher'>('teacher');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!schoolId) return;
        const staffCollectionRef = collection(db, 'schools', schoolId, 'staff');

        const unsubscribe = onSnapshot(staffCollectionRef, (snapshot) => {
            const staffData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffMember[];
            setStaff(staffData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching staff: ", error);
            toast.error('Erro ao carregar a equipe.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [schoolId]);

    const handleInvite = async () => {
        if (!inviteEmail || !schoolId) {
            toast.error('Por favor, preencha o e-mail do convidado.');
            return;
        }

        setIsSubmitting(true);
        const functions = getFunctions();
        const inviteStaff = httpsCallable(functions, 'inviteStaff');

        try {
            const result = await inviteStaff({ email: inviteEmail, role: inviteRole, schoolId });
            toast.success(`Convite enviado para ${inviteEmail}!`);
            // TODO: Adicionar o novo membro à lista localmente ou recarregar os dados
            setInviteEmail(''); // Limpa o campo
        } catch (error: any) {
            console.error(error);
            toast.error(`Erro ao enviar convite: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Equipe</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Convidar Membro</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Convidar novo membro para a equipe</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input 
                                placeholder="E-mail do convidado"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <Select onValueChange={(value: 'admin' | 'teacher') => setInviteRole(value)} defaultValue={inviteRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="teacher">Professor(a)</SelectItem>
                                    <SelectItem value="admin">Administrador(a)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleInvite} disabled={isSubmitting} className='w-full'>
                                {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            
            {loading ? (
                <p>Carregando...</p>
            ) : (
                <DataTable columns={columns} data={staff} searchKey='email' />
            )}
        </div>
    );
}
