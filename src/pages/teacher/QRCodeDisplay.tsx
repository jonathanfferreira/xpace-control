import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Clock } from 'lucide-react';

export default function QRCodeDisplay() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeacherClasses();
    }
  }, [user]);

  const fetchTeacherClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id)
        .eq('active', true);

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: 'Erro ao carregar turmas',
        description: 'Não foi possível carregar suas turmas.',
        variant: 'destructive',
      });
    }
  };

  const generateQRCode = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    try {
      // Generate token valid for 25 minutes (10 min before + 15 min after class start)
      const now = new Date();
      const validFrom = new Date(now.getTime() - 10 * 60000); // 10 min ago
      const validUntilDate = new Date(now.getTime() + 15 * 60000); // 15 min from now
      
      const token = `${selectedClassId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('qr_tokens')
        .insert({
          class_id: selectedClassId,
          token,
          valid_from: validFrom.toISOString(),
          valid_until: validUntilDate.toISOString(),
        });

      if (error) throw error;

      setQrToken(token);
      setValidUntil(validUntilDate);

      toast({
        title: 'QR Code gerado',
        description: 'O código QR foi gerado com sucesso.',
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Erro ao gerar QR Code',
        description: 'Não foi possível gerar o código QR.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const timeRemaining = validUntil
    ? Math.max(0, Math.floor((validUntil.getTime() - Date.now()) / 1000))
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QR Code de Presença</h1>
          <p className="text-muted-foreground">Gere um QR Code para marcar presença</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gerar QR Code</CardTitle>
            <CardDescription>
              Selecione uma turma e gere um código QR válido por 25 minutos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Turma</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateQRCode}
              disabled={!selectedClassId || loading}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Gerar Novo QR Code
            </Button>

            {qrToken && (
              <div className="flex flex-col items-center space-y-4 p-6 bg-muted rounded-lg">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={qrToken} size={256} />
                </div>
                
                {timeRemaining > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Válido por: {formatTime(timeRemaining)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
