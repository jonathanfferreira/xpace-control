import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, School, Building2, Users, GraduationCap, Mail, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Papa from 'papaparse';
import logo from '@/assets/xpace-logo.png';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    title: 'Dados da Escola',
    description: 'Informações básicas da sua escola',
    icon: <School className="h-6 w-6" />,
  },
  {
    title: 'Unidades',
    description: 'Configure as unidades da escola',
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    title: 'Importar Alunos',
    description: 'Importe seus alunos via CSV',
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: 'Criar Turmas',
    description: 'Configure suas turmas',
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    title: 'Convidar Professores',
    description: 'Convide professores para o sistema',
    icon: <Mail className="h-6 w-6" />,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');

  // Step 1: School Data
  const [schoolData, setSchoolData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    city: '',
  });

  // Step 2: Unit Data
  const [unitData, setUnitData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
  });

  // Step 3: CSV Import
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importedStudents, setImportedStudents] = useState<any[]>([]);

  // Step 4: Classes Data
  const [classData, setClassData] = useState({
    name: '',
    schedule_day: 'Monday',
    schedule_time: '18:00',
    max_students: 30,
  });
  const [createdClasses, setCreatedClasses] = useState<string[]>([]);

  // Step 5: Teacher Invites
  const [teacherEmail, setTeacherEmail] = useState('');
  const [invitedTeachers, setInvitedTeachers] = useState<string[]>([]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleSchoolSubmit = async () => {
    if (!schoolData.name || !schoolData.contact_email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: schoolData.name,
          contact_email: schoolData.contact_email,
          contact_phone: schoolData.contact_phone,
          city: schoolData.city,
          admin_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSchoolId(data.id);

      // Create trial subscription
      await supabase.rpc('create_trial_subscription', { _school_id: data.id });

      toast.success('Escola criada com sucesso!');
      setCurrentStep(1);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar escola');
    } finally {
      setLoading(false);
    }
  };

  const handleUnitSubmit = async () => {
    if (!unitData.name) {
      toast.error('Nome da unidade é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('school_units')
        .insert({
          name: unitData.name,
          address: unitData.address,
          city: unitData.city,
          phone: unitData.phone,
          school_id: schoolId,
        })
        .select()
        .single();

      if (error) throw error;

      setUnitId(data.id);
      toast.success('Unidade criada com sucesso!');
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar unidade');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportedStudents(results.data);
        toast.success(`${results.data.length} alunos carregados do CSV`);
      },
      error: (error) => {
        toast.error('Erro ao ler arquivo CSV');
        console.error(error);
      },
    });
  };

  const handleImportStudents = async () => {
    if (importedStudents.length === 0) {
      toast.error('Nenhum aluno para importar');
      return;
    }

    setLoading(true);
    try {
      const studentsToInsert = importedStudents.map((student: any) => ({
        full_name: student.nome || student.name,
        email: student.email,
        phone: student.telefone || student.phone,
        birth_date: student.data_nascimento || student.birth_date,
        school_id: schoolId,
        unit_id: unitId,
      }));

      const { error } = await supabase.from('students').insert(studentsToInsert);

      if (error) throw error;

      toast.success(`${studentsToInsert.length} alunos importados!`);
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleClassSubmit = async () => {
    if (!classData.name) {
      toast.error('Nome da turma é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: classData.name,
          schedule_day: classData.schedule_day,
          schedule_time: classData.schedule_time,
          max_students: classData.max_students,
          school_id: schoolId,
          unit_id: unitId,
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedClasses([...createdClasses, data.name]);
      setClassData({ name: '', schedule_day: 'Monday', schedule_time: '18:00', max_students: 30 });
      toast.success('Turma criada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar turma');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTeacher = async () => {
    if (!teacherEmail) {
      toast.error('Email do professor é obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Mock invite - in production would send actual email
      setInvitedTeachers([...invitedTeachers, teacherEmail]);
      setTeacherEmail('');
      toast.success(`Convite enviado para ${teacherEmail}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    toast.success('Onboarding concluído! Bem-vindo ao Xpace Control! 🎉');
    navigate('/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="school-name">Nome da Escola *</Label>
              <Input
                id="school-name"
                value={schoolData.name}
                onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                placeholder="Ex: Academia de Dança X"
              />
            </div>
            <div>
              <Label htmlFor="school-email">Email de Contato *</Label>
              <Input
                id="school-email"
                type="email"
                value={schoolData.contact_email}
                onChange={(e) => setSchoolData({ ...schoolData, contact_email: e.target.value })}
                placeholder="contato@escola.com"
              />
            </div>
            <div>
              <Label htmlFor="school-phone">Telefone</Label>
              <Input
                id="school-phone"
                value={schoolData.contact_phone}
                onChange={(e) => setSchoolData({ ...schoolData, contact_phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="school-city">Cidade</Label>
              <Input
                id="school-city"
                value={schoolData.city}
                onChange={(e) => setSchoolData({ ...schoolData, city: e.target.value })}
                placeholder="São Paulo"
              />
            </div>
            <Button onClick={handleSchoolSubmit} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Próximo
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="unit-name">Nome da Unidade *</Label>
              <Input
                id="unit-name"
                value={unitData.name}
                onChange={(e) => setUnitData({ ...unitData, name: e.target.value })}
                placeholder="Unidade Centro"
              />
            </div>
            <div>
              <Label htmlFor="unit-address">Endereço</Label>
              <Input
                id="unit-address"
                value={unitData.address}
                onChange={(e) => setUnitData({ ...unitData, address: e.target.value })}
                placeholder="Rua X, 123"
              />
            </div>
            <div>
              <Label htmlFor="unit-city">Cidade</Label>
              <Input
                id="unit-city"
                value={unitData.city}
                onChange={(e) => setUnitData({ ...unitData, city: e.target.value })}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="unit-phone">Telefone</Label>
              <Input
                id="unit-phone"
                value={unitData.phone}
                onChange={(e) => setUnitData({ ...unitData, phone: e.target.value })}
                placeholder="(11) 3333-3333"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep(0)} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleUnitSubmit} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Próximo
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Arquivo CSV (opcional)</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Formato esperado: nome, email, telefone, data_nascimento
              </p>
            </div>
            
            {importedStudents.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">{importedStudents.length} alunos carregados</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep(1)} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={importedStudents.length > 0 ? handleImportStudents : () => setCurrentStep(3)} 
                disabled={loading} 
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {importedStudents.length > 0 ? 'Importar e Continuar' : 'Pular'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="class-name">Nome da Turma *</Label>
              <Input
                id="class-name"
                value={classData.name}
                onChange={(e) => setClassData({ ...classData, name: e.target.value })}
                placeholder="Ballet Infantil"
              />
            </div>
            <div>
              <Label htmlFor="class-day">Dia da Semana</Label>
              <select
                id="class-day"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={classData.schedule_day}
                onChange={(e) => setClassData({ ...classData, schedule_day: e.target.value })}
              >
                <option value="Monday">Segunda-feira</option>
                <option value="Tuesday">Terça-feira</option>
                <option value="Wednesday">Quarta-feira</option>
                <option value="Thursday">Quinta-feira</option>
                <option value="Friday">Sexta-feira</option>
                <option value="Saturday">Sábado</option>
              </select>
            </div>
            <div>
              <Label htmlFor="class-time">Horário</Label>
              <Input
                id="class-time"
                type="time"
                value={classData.schedule_time}
                onChange={(e) => setClassData({ ...classData, schedule_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="class-capacity">Capacidade</Label>
              <Input
                id="class-capacity"
                type="number"
                value={classData.max_students}
                onChange={(e) => setClassData({ ...classData, max_students: parseInt(e.target.value) })}
              />
            </div>

            {createdClasses.length > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Turmas criadas:</p>
                {createdClasses.map((className, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {className}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep(2)} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleClassSubmit} disabled={loading} variant="secondary" className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Turma
              </Button>
            </div>
            <Button onClick={() => setCurrentStep(4)} className="w-full">
              Continuar
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="teacher-email">Email do Professor</Label>
              <Input
                id="teacher-email"
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="professor@email.com"
              />
            </div>

            {invitedTeachers.length > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Convites enviados:</p>
                {invitedTeachers.map((email, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    {email}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setCurrentStep(3)} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleInviteTeacher} disabled={loading || !teacherEmail} variant="secondary" className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Convidar
              </Button>
            </div>
            <Button onClick={handleFinish} className="w-full">
              Finalizar Configuração
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <img src={logo} alt="Xpace" className="h-12 mx-auto" />
          <div>
            <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
            <CardDescription>
              Vamos configurar sua escola em 5 passos simples
            </CardDescription>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {steps.length}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {steps[currentStep].icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{steps[currentStep].title}</h3>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            </div>
          </div>

          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}
