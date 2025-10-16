import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, X, School, Building2, Users, GraduationCap, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  action?: () => void;
}

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'school',
      title: 'Dados da Escola',
      description: 'Configure as informações básicas',
      completed: false,
      icon: <School className="h-4 w-4" />,
      action: () => navigate('/configuracoes'),
    },
    {
      id: 'units',
      title: 'Criar Unidades',
      description: 'Adicione pelo menos uma unidade',
      completed: false,
      icon: <Building2 className="h-4 w-4" />,
      action: () => navigate('/units'),
    },
    {
      id: 'students',
      title: 'Cadastrar Alunos',
      description: 'Adicione seus alunos',
      completed: false,
      icon: <Users className="h-4 w-4" />,
      action: () => navigate('/alunos'),
    },
    {
      id: 'classes',
      title: 'Criar Turmas',
      description: 'Configure suas turmas',
      completed: false,
      icon: <GraduationCap className="h-4 w-4" />,
      action: () => navigate('/turmas'),
    },
    {
      id: 'teachers',
      title: 'Convidar Professores',
      description: 'Adicione professores ao sistema',
      completed: false,
      icon: <Mail className="h-4 w-4" />,
      action: () => navigate('/configuracoes'),
    },
  ]);

  const [showChecklist, setShowChecklist] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check school
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      // Check units
      const { data: units } = await supabase
        .from('school_units')
        .select('id')
        .eq('school_id', school.id);

      // Check students
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', school.id);

      // Check classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('school_id', school.id);

      // Update checklist
      setChecklist(prev => prev.map(item => {
        switch (item.id) {
          case 'school':
            return { ...item, completed: !!school };
          case 'units':
            return { ...item, completed: (units?.length || 0) > 0 };
          case 'students':
            return { ...item, completed: (students?.length || 0) > 0 };
          case 'classes':
            return { ...item, completed: (classes?.length || 0) > 0 };
          default:
            return item;
        }
      }));

      // Hide checklist if all completed
      const allCompleted = [
        !!school,
        (units?.length || 0) > 0,
        (students?.length || 0) > 0,
        (classes?.length || 0) > 0,
      ].every(Boolean);

      if (allCompleted) {
        const dismissed = localStorage.getItem('onboarding-checklist-dismissed');
        setShowChecklist(!dismissed);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  const handleDismiss = () => {
    localStorage.setItem('onboarding-checklist-dismissed', 'true');
    setShowChecklist(false);
  };

  if (!showChecklist) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Começando com o Xpace Control</CardTitle>
            <CardDescription>
              Complete estes passos para configurar sua escola
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {completedCount} de {checklist.length} completos ({Math.round(progress)}%)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-smooth ${
                item.completed
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-card border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    item.completed
                      ? 'bg-green-500/20 text-green-600'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.completed ? <Check className="h-4 w-4" /> : item.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              {!item.completed && item.action && (
                <Button size="sm" variant="outline" onClick={item.action}>
                  Iniciar
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
