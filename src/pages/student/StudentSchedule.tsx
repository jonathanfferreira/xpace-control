import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentSchedule() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minha Agenda</h1>
          <p className="text-muted-foreground">Veja suas próximas aulas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agenda Semanal</CardTitle>
            <CardDescription>
              Suas aulas da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
