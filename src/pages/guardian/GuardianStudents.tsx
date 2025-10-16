import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GuardianStudents() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meus Alunos</h1>
          <p className="text-muted-foreground">Acompanhe seus dependentes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dependentes</CardTitle>
            <CardDescription>
              Lista de alunos vinculados à sua conta
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
