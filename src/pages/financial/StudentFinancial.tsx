
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { triggerCreateAsaasCustomer, triggerCreateAsaasCharge } from '@/services/asaasService';
import { UserProfile } from '@/services/authService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

const StudentFinancialPage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingCharge, setIsCreatingCharge] = useState(false);
  
  // Form state for creating a charge
  const [chargeValue, setChargeValue] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const [userDoc, loading, error] = useDocument(
    studentId ? doc(db, 'users', studentId) : undefined
  );

  const userProfile = userDoc?.data() as UserProfile | undefined;

  const handleSyncAsaas = async () => {
    if (!studentId) return;
    setIsSyncing(true);
    try {
      const result = await triggerCreateAsaasCustomer(studentId);
      toast.success('Sincronização com Asaas concluída!', {
        description: `ID do Cliente: ${result.customerId}`,
      });
    } catch (err) {
      toast.error('Falha ao sincronizar com o Asaas.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.asaasCustomerId || !chargeValue || !dueDate) {
      toast.error('Preencha todos os campos obrigatórios para criar a cobrança.');
      return;
    }

    setIsCreatingCharge(true);
    try {
      const result = await triggerCreateAsaasCharge({
        customerId: userProfile.asaasCustomerId,
        value: parseFloat(chargeValue),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        description: chargeDescription,
      });
      toast.success('Cobrança criada com sucesso no Asaas!', {
        description: `ID da Cobrança: ${result.id}`
      });
      // Clear form
      setChargeValue('');
      setChargeDescription('');
      setDueDate(undefined);
    } catch (err) {
      toast.error('Falha ao criar cobrança no Asaas.');
    } finally {
      setIsCreatingCharge(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error || !userProfile) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Não foi possível carregar os dados financeiros do aluno.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Financeiro do Aluno: {userProfile.displayName}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Integração com Asaas</CardTitle>
        </CardHeader>
        <CardContent>
          {userProfile.asaasCustomerId ? (
            <div className="flex items-center gap-4">
              <Badge variant="success">Sincronizado</Badge>
              <p className="text-sm text-muted-foreground">ID: <strong>{userProfile.asaasCustomerId}</strong></p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Badge variant="outline">Não Sincronizado</Badge>
              <Button onClick={handleSyncAsaas} disabled={isSyncing} size="sm">
                {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sincronizar Agora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {userProfile.asaasCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Cobrança</CardTitle>
            <CardDescription>Crie uma nova cobrança (Boleto ou PIX) para este aluno no Asaas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCharge} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input id="value" type="number" placeholder="Ex: 150.00" value={chargeValue} onChange={e => setChargeValue(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dueDate">Data de Vencimento</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP") : <span>Escolha uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={setDueDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Input id="description" placeholder="Ex: Mensalidade de Julho" value={chargeDescription} onChange={e => setChargeDescription(e.target.value)} />
              </div>
              <Button type="submit" disabled={isCreatingCharge}>
                {isCreatingCharge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Cobrança
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
            <Alert>
                <AlertTitle>Em Breve</AlertTitle>
                <AlertDescription>
                A funcionalidade para listar o histórico de cobranças do Asaas será implementada aqui.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFinancialPage;
