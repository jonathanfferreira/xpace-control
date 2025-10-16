import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
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
      // Validate token
      const { data: qrData, error: qrError } = await supabase
        .from('qr_tokens')
        .select('*, classes(id, name, school_id)')
        .eq('token', token)
        .maybeSingle();

      if (qrError) throw qrError;

      if (!qrData) {
        throw new Error('Token inválido');
      }

      // Check if token is still valid
      const now = new Date();
      const validFrom = new Date(qrData.valid_from);
      const validUntil = new Date(qrData.valid_until);

      if (now < validFrom || now > validUntil) {
        throw new Error('Token expirado ou ainda não válido');
      }

      // Get student linked to this user
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        throw new Error('Nenhum aluno vinculado a esta conta');
      }

      // Check enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentData.id)
        .eq('class_id', qrData.class_id)
        .eq('status', 'active')
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;

      if (!enrollmentData) {
        throw new Error('Você não está matriculado nesta turma');
      }

      // Mark attendance
      const today = new Date().toISOString().split('T')[0];
      
      const { error: attendanceError } = await supabase
        .from('attendances')
        .insert({
          class_id: qrData.class_id,
          student_id: studentData.id,
          attendance_date: today,
          marked_by: user?.id,
        });

      if (attendanceError) {
        if (attendanceError.code === '23505') {
          throw new Error('Presença já registrada para hoje');
        }
        throw attendanceError;
      }

      setSuccess(true);
      toast({
        title: 'Presença registrada!',
        description: `Presença marcada na turma ${qrData.classes?.name}`,
      });

      setToken('');
    } catch (error: any) {
      console.error('Error scanning QR code:', error);
      toast({
        title: 'Erro ao marcar presença',
        description: error.message || 'Não foi possível registrar a presença.',
        variant: 'destructive',
      });
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
