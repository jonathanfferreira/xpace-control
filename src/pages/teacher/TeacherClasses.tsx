import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Users } from 'lucide-react';
import { toast } from 'sonner';

type Class = {
  id: string;
  name: string;
  description?: string;
  schedule_day: string;
  schedule_time: string;
  duration_minutes: number;
};

export default function TeacherClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id)
        .eq('active', true);

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (classId: string) => {
    try {
      const token = `${classId}-${Date.now()}`;
      const validFrom = new Date();
      const validUntil = new Date(validFrom.getTime() + 25 * 60 * 1000);

      const { error } = await supabase.from('qr_tokens').insert({
        token,
        class_id: classId,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
      });

      if (error) throw error;

      setQrToken(token);
      setSelectedClass(classId);
      setQrDialogOpen(true);
      toast.success('QR Code gerado com sucesso');
    } catch (error: any) {
      toast.error('Erro ao gerar QR Code');
    }
  };

  const getStudentCount = async (classId: string) => {
    const { count } = await supabase
      .from('class_students')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);
    return count || 0;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Turmas</h1>
          <p className="text-muted-foreground">Gerencie suas turmas e gere QR codes para presença</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <CardTitle>{classItem.name}</CardTitle>
                {classItem.description && <CardDescription>{classItem.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Dia:</span> {classItem.schedule_day}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Horário:</span> {classItem.schedule_time}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Duração:</span> {classItem.duration_minutes} min
                  </p>
                </div>
                <Button className="w-full" onClick={() => generateQRCode(classItem.id)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Exibir QR Code
                </Button>
              </CardContent>
            </Card>
          ))}

          {classes.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-10">
                  <p className="text-center text-muted-foreground">Você não possui turmas cadastradas ainda</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code para Presença</DialogTitle>
            </DialogHeader>
            {qrToken && (
              <div className="flex flex-col items-center gap-4 py-4">
                <QRCodeSVG value={qrToken} size={256} />
                <p className="text-sm text-muted-foreground text-center">
                  Alunos podem escanear este código para marcar presença
                  <br />
                  Válido por 25 minutos
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
