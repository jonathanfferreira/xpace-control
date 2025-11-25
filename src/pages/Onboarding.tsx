
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Building, User, Mail, ShieldCheck } from 'lucide-react';

const OnboardingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateSchool = async () => {
    if (!user) {
      toast.error('Você precisa estar autenticado para criar uma escola.');
      return;
    }
    if (schoolName.trim().length < 3) {
      toast.warning('O nome da escola deve ter pelo menos 3 caracteres.');
      return;
    }
    setLoading(true);
    try {
      // 1. Verifica se o usuário já tem uma escola
      const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
      const existingSchools = await getDocs(schoolQuery);
      if (!existingSchools.empty) {
        toast.info('Você já possui uma escola configurada.');
        navigate('/dashboard');
        return;
      }

      // 2. Cria a nova escola
      const schoolRef = await addDoc(collection(db, 'schools'), {
        name: schoolName,
        admin_id: user.uid,
        createdAt: serverTimestamp(),
        status: 'active',
      });

      // 3. Atualiza a role do usuário para 'admin'
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: 'admin' });
      
      toast.success(`Escola "${schoolName}" criada com sucesso!`);
      navigate('/dashboard'); // Redireciona para o painel principal

    } catch (error: any) {
      console.error('Erro no onboarding:', error);
      toast.error('Ocorreu um erro ao criar sua escola.', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Bem-vindo ao XPACE OS!</CardTitle>
          <CardDescription>Vamos configurar sua escola em alguns passos rápidos.</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="schoolName" className="font-medium flex items-center">
                  <Building className="mr-2 h-5 w-5 text-primary" />
                  Qual é o nome da sua escola ou estúdio?
                </label>
                <Input 
                  id="schoolName" 
                  value={schoolName} 
                  onChange={(e) => setSchoolName(e.target.value)} 
                  placeholder="Ex: Escola de Dança Bailarte"
                  autoFocus
                />
                <p className='text-xs text-muted-foreground'>Este será o nome exibido em todo o sistema.</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateSchool} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} 
            Criar Minha Escola e Acessar o Painel
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingPage;
