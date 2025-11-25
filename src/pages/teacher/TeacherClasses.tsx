import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';
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
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    if (!user) return;
    try {
      const classesQuery = query(
        collection(db, 'classes'),
        where('teacher_id', '==', user.uid),
        where('active', '==', true)
      );
      const querySnapshot = await getDocs(classesQuery);
      const fetchedClasses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Class[];
      setClasses(fetchedClasses);
    } catch (error: any) {
      console.error("Error fetching classes: ", error);
      toast.error('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (classId: string) => {
    if (!user) return;
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classSnap = await getDoc(classDocRef);

      if (!classSnap.exists()) {
        throw new Error("Class not found");
      }
      const classData = classSnap.data();

      const token = `${classId}-${Date.now()}`;
      
      const [hours, minutes] = classData.schedule_time.split(':').map(Number);
      
      const now = new Date();
      const classStart = new Date(now);
      classStart.setHours(hours, minutes, 0, 0);
      
      const validFrom = new Date(classStart.getTime() - 10 * 60 * 1000);
      const validUntil = new Date(classStart.getTime() + 15 * 60 * 1000);

      await addDoc(collection(db, 'qr_tokens'), {
        token,
        class_id: classId,
        valid_from: Timestamp.fromDate(validFrom),
        valid_until: Timestamp.fromDate(validUntil),
        teacher_id: user.uid,
        created_at: Timestamp.now()
      });

      setQrToken(token);
      setQrDialogOpen(true);
      toast.success('QR Code gerado com sucesso (válido por 25 minutos)');
    } catch (error: any) {
      console.error("Error generating QR code: ", error);
      toast.error('Erro ao gerar QR Code');
    }
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
