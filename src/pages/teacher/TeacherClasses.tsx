import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherClasses() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Turmas</h1>
          <p className="text-muted-foreground">Gerencie suas turmas e aulas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Turmas Ativas</CardTitle>
            <CardDescription>
              Lista de turmas que você leciona
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
