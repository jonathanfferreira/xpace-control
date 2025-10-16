import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function QRCodeScanner() {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setSuccess(false);

    try {
      // Validate token and check time window
      const now = new Date();
      const { data: qrData, error: qrError } = await supabase
        .from('qr_tokens')
        .select('*, classes(id, name, school_id)')
        .eq('token', token)
        .maybeSingle();

      if (qrError) throw qrError;

      if (!qrData) {
        toast.error('QR Code inválido');
        return;
      }

      // Check time window
      const validFrom = new Date(qrData.valid_from);
      const validUntil = new Date(qrData.valid_until);

      if (now < validFrom) {
        toast.error('QR Code ainda não está válido. A presença pode ser marcada 10 minutos antes da aula.');
        return;
      }

      if (now > validUntil) {
        toast.error('QR Code expirado. A janela de presença é de 15 minutos após o início da aula.');
        return;
      }

      // Get student linked to this user
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        toast.error('Nenhum aluno vinculado a esta conta');
        return;
      }

      // Check enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('class_students')
        .select('id')
        .eq('student_id', studentData.id)
        .eq('class_id', qrData.class_id)
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;

      if (!enrollmentData) {
        toast.error('Você não está matriculado nesta turma');
        return;
      }

      // Check if already marked today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAttendance } = await supabase
        .from('attendances')
        .select('id')
        .eq('student_id', studentData.id)
        .eq('class_id', qrData.class_id)
        .eq('attendance_date', today)
        .maybeSingle();

      if (existingAttendance) {
        toast.error('Presença já marcada hoje');
        return;
      }

      // Get user agent and create simple fingerprint
      const userAgent = navigator.userAgent;
      const deviceFingerprint = `${userAgent}-${studentData.id}`;

      // Mark attendance with device tracking
      const { error: attendanceError } = await supabase
        .from('attendances')
        .insert({
          class_id: qrData.class_id,
          student_id: studentData.id,
          attendance_date: today,
          marked_by: user?.id,
          user_agent: userAgent,
          device_fingerprint: deviceFingerprint,
        });

      if (attendanceError) throw attendanceError;

      setSuccess(true);
      toast.success(`Presença marcada na turma ${qrData.classes?.name}`);
      setToken('');
    } catch (error: any) {
      console.error('Error scanning QR code:', error);
      toast.error(error.message || 'Não foi possível registrar a presença.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marcar Presença</h1>
          <p className="text-muted-foreground">Escaneie o QR Code da aula</p>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Ler QR Code</CardTitle>
            <CardDescription>
              Digite ou cole o código do QR Code exibido pelo professor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Código QR</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Cole o código aqui"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!token.trim() || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {success && <CheckCircle2 className="mr-2 h-4 w-4" />}
                Marcar Presença
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
